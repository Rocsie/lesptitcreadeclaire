import Stripe from 'stripe';
import { isStripeConfigured, isStripeWebhookConfigured } from './payment-mode';
import { absoluteUrl } from './site';
import { StoreError } from './store';
import type { Order } from './types';

// Paiement par carte via Stripe Checkout (page de paiement hébergée par Stripe) :
// aucun numéro de carte ne transite ni n'est stocké sur le site.

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeConfigured()) throw new StoreError("Le paiement en ligne n'est pas configuré.", 503);
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  return client;
}

const cents = (amount: number) => Math.round(amount * 100);

/** Crée la page de paiement Stripe d'une commande en attente. */
export async function createCheckoutSession(order: Order): Promise<{ id: string; url: string }> {
  const stripe = getStripe();

  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if (order.discountAmount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: cents(order.discountAmount),
      currency: 'eur',
      duration: 'once',
      name: order.promoCode ? `Code ${order.promoCode}` : 'Réduction',
      max_redemptions: 1,
    });
    discounts.push({ coupon: coupon.id });
  }

  const query = `commande=${encodeURIComponent(order.orderNumber)}&cle=${order.accessToken}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    locale: 'fr',
    customer_email: order.customerEmail,
    client_reference_id: order.id,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    payment_intent_data: {
      description: `Commande ${order.orderNumber}`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    },
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'eur',
        unit_amount: cents(item.unitPrice),
        product_data: {
          name: item.variantTitle ? `${item.productName} (${item.variantTitle})` : item.productName,
          ...(item.imageUrl ? { images: [absoluteUrl(item.imageUrl)] } : {}),
        },
      },
    })),
    ...(discounts.length > 0 ? { discounts } : {}),
    ...(order.shippingCost > 0
      ? {
          shipping_options: [
            {
              shipping_rate_data: {
                type: 'fixed_amount' as const,
                display_name: 'Livraison Colissimo',
                fixed_amount: { amount: cents(order.shippingCost), currency: 'eur' },
              },
            },
          ],
        }
      : {}),
    // La réservation de stock tient 30 minutes, durée minimale acceptée par Stripe.
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${absoluteUrl('/checkout/succes')}?${query}`,
    cancel_url: `${absoluteUrl('/checkout')}?annule=${encodeURIComponent(order.orderNumber)}&cle=${order.accessToken}`,
  });

  if (!session.url) throw new Error('Stripe n\'a pas renvoyé d\'adresse de paiement.');
  return { id: session.id, url: session.url };
}

export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(sessionId);
}

export async function expireCheckoutSession(sessionId: string): Promise<void> {
  try {
    await getStripe().checkout.sessions.expire(sessionId);
  } catch {
    // session déjà payée ou déjà expirée : rien à faire
  }
}

/** Vérifie la signature d'un appel webhook Stripe et renvoie l'événement. */
export function parseWebhookEvent(rawBody: string, signature: string | null): Stripe.Event {
  if (!isStripeWebhookConfigured()) throw new StoreError('Webhook Stripe non configuré.', 503);
  if (!signature) throw new StoreError('Signature manquante.', 400);
  try {
    return getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch {
    throw new StoreError('Signature invalide.', 400);
  }
}
