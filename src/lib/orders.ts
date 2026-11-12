import { after } from 'next/server';
import { trackEvent } from './analytics';
import { sendOrderEmails } from './mailer';
import { isStripeConfigured } from './payment-mode';
import { createCheckoutSession, expireCheckoutSession, retrieveCheckoutSession } from './payments';
import { StoreError, store, type CreateOrderInput } from './store';
import type { Order, User } from './types';

export interface PlacedOrder {
  order: Order;
  /** Présent en mode Stripe : adresse de la page de paiement vers laquelle rediriger. */
  checkoutUrl?: string;
  /** Vrai quand la commande est déjà payée (mode démonstration ou total nul) : les emails peuvent partir. */
  paid: boolean;
}

/** Enregistre une commande et, en mode Stripe, prépare la page de paiement. */
export async function placeOrder(input: CreateOrderInput, user: User | null): Promise<PlacedOrder> {
  const settings = await store.getPublicSettings();
  if (settings.paymentMode === 'disabled') {
    throw new StoreError(
      "La commande en ligne n'est pas encore ouverte. Contactez la boutique pour réserver une création.",
      503
    );
  }

  const order = await store.createOrder(input, {
    userId: user?.id || null,
    paymentMode: settings.paymentMode,
  });

  if (settings.paymentMode === 'simulation') return { order, paid: true };

  // Rien à encaisser (remise totale avec retrait en boutique) : la commande est validée directement.
  if (order.total < 0.5) {
    const done = await store.markOrderPaid(order.id, 'gratuit');
    return { order: done?.order || order, paid: true };
  }

  try {
    const session = await createCheckoutSession(order);
    await store.setOrderPaymentReference(order.id, session.id);
    return { order, checkoutUrl: session.url, paid: false };
  } catch (err) {
    console.error('[paiement] création de la session Stripe impossible', err);
    await store.cancelPendingOrder(order.id);
    throw new StoreError(
      "Le paiement n'a pas pu être lancé. Votre commande n'a pas été enregistrée, merci de réessayer dans un instant.",
      502
    );
  }
}

/** Paiement confirmé : passe la commande en "payée" une seule fois et envoie les emails. */
export async function confirmPaidOrder(orderId: string, paymentReference?: string | null): Promise<Order | null> {
  const result = await store.markOrderPaid(orderId, paymentReference);
  if (!result) return null;
  if (result.changed) {
    trackEvent({ event: 'purchase' });
    // Les emails partent une fois la réponse envoyée : un serveur SMTP lent ne bloque pas la page.
    after(() => sendOrderEmails(result.order));
  }
  return result.order;
}

/**
 * Pour une commande encore en attente, interroge Stripe et met à jour son état.
 * Sert de filet de sécurité quand le webhook arrive en retard ou n'est pas configuré.
 */
export async function refreshPendingOrder(order: Order): Promise<Order> {
  if (order.status !== 'PENDING' || !isStripeConfigured()) return order;
  const sessionId = order.paymentReference;
  if (!sessionId || !sessionId.startsWith('cs_')) return order;
  try {
    const session = await retrieveCheckoutSession(sessionId);
    if (session.payment_status === 'paid') {
      return (await confirmPaidOrder(order.id, sessionId)) || order;
    }
    if (session.status === 'expired') {
      return (await store.cancelPendingOrder(order.id)) || order;
    }
  } catch (err) {
    console.error('[paiement] lecture de la session Stripe impossible', err);
  }
  return order;
}

/** La cliente a quitté la page de paiement : la commande est annulée et le stock libéré. */
export async function abandonPendingOrder(order: Order): Promise<Order> {
  const fresh = await refreshPendingOrder(order);
  if (fresh.status !== 'PENDING') return fresh;
  if (fresh.paymentReference?.startsWith('cs_') && isStripeConfigured()) {
    await expireCheckoutSession(fresh.paymentReference);
  }
  return (await store.cancelPendingOrder(fresh.id)) || fresh;
}
