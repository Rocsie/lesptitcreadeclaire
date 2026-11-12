import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { OrderConfirmedEffects, PendingRefresh } from './SuccessEffects';
import { getSessionUser } from '@/lib/auth';
import { refreshPendingOrder } from '@/lib/orders';
import { formatPrice } from '@/lib/paths';
import { store } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Confirmation de commande',
  robots: { index: false },
};

type Props = { searchParams: Promise<{ commande?: string; cle?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { commande, cle } = await searchParams;
  const found = commande ? await store.getOrderByNumber(commande) : null;

  // La clé du lien prouve que la visiteuse est bien l'auteure de la commande.
  if (!found || !cle || found.accessToken !== cle) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-dark">Commande introuvable</h1>
        <p className="text-sm text-muted">
          Ce lien de confirmation n&apos;est pas valide. Si vous venez de commander, le récapitulatif vous a été envoyé par email.
        </p>
        <Link
          href="/boutique"
          className="inline-flex items-center justify-center px-8 py-3 min-h-[44px] rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const order = await refreshPendingOrder(found);
  const user = await getSessionUser();
  const pending = order.status === 'PENDING';
  const cancelled = order.status === 'CANCELLED';
  const simulated = order.paymentMethod === 'simulation';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-rose-powder/30 shadow-xl text-center space-y-6 animate-in zoom-in-95">
        {pending && (
          <>
            <PendingRefresh />
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Clock className="w-9 h-9" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-dark">Paiement en cours de confirmation</h1>
              <p className="text-sm text-muted">
                Votre commande {order.orderNumber} est enregistrée. Nous attendons la confirmation de votre banque : cette page se met à jour toute seule.
              </p>
            </div>
          </>
        )}

        {cancelled && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-dark">Commande annulée</h1>
              <p className="text-sm text-muted">
                La commande {order.orderNumber} n&apos;a pas été payée et a été annulée. Rien n&apos;a été débité.
              </p>
            </div>
          </>
        )}

        {!pending && !cancelled && (
          <>
            <OrderConfirmedEffects orderNumber={order.orderNumber} />
            <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-sage" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <span className="font-script text-3xl text-plum block">Merci pour votre confiance !</span>
              <h1 className="font-serif text-2xl font-bold text-dark">Votre commande {order.orderNumber} est validée</h1>
              <p className="text-xs sm:text-sm text-muted">
                Le récapitulatif est envoyé à <strong>{order.customerEmail}</strong>.
              </p>
            </div>
          </>
        )}

        <div className="p-4 rounded-2xl bg-cream-warm border border-rose-powder/20 text-xs text-dark/80 text-left space-y-2">
          <ul className="divide-y divide-rose-powder/15">
            {order.items.map((item) => (
              <li key={item.id} className="py-1.5 flex justify-between gap-3">
                <span>
                  {item.quantity} × {item.productName}
                  {item.variantTitle ? ` (${item.variantTitle})` : ''}
                </span>
                <span className="font-semibold shrink-0">{formatPrice(item.totalPrice)}</span>
              </li>
            ))}
          </ul>
          {order.discountAmount > 0 && (
            <p className="flex justify-between text-plum">
              <span>Réduction{order.promoCode ? ` (${order.promoCode})` : ''}</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </p>
          )}
          <p className="flex justify-between">
            <span>{order.shippingMethod === 'pickup' ? 'Retrait en boutique' : 'Livraison Colissimo'}</span>
            <span>{order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Gratuit'}</span>
          </p>
          <p className="flex justify-between text-sm font-bold text-dark pt-2 border-t border-rose-powder/20">
            <span>Total TTC</span>
            <span className="text-plum">{formatPrice(order.total)}</span>
          </p>
          <p className="pt-2 border-t border-rose-powder/20">
            <strong>Mode de réception :</strong>{' '}
            {order.shippingMethod === 'pickup'
              ? "retrait gratuit à la boutique L'Atelier (Port-la-Nouvelle). Vous recevrez un email dès que la commande sera prête."
              : `expédition Colissimo à ${order.shippingAddress?.address1 || ''}${order.shippingAddress?.address2 ? `, ${order.shippingAddress.address2}` : ''}, ${order.shippingAddress?.postalCode || ''} ${order.shippingAddress?.city || ''}.`}
          </p>
          {simulated && !cancelled && (
            <p className="pt-2 border-t border-rose-powder/20 text-amber-800">
              Commande passée en mode démonstration : aucun paiement n&apos;a été prélevé.
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/boutique"
            className="px-6 py-3 min-h-[44px] inline-flex items-center justify-center rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Retourner à la boutique
          </Link>
          <Link
            href={user ? '/compte' : '/inscription'}
            className="px-6 py-3 min-h-[44px] inline-flex items-center justify-center rounded-full bg-rose-light hover:bg-rose-powder/40 text-plum text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            {user ? 'Voir mes commandes' : 'Créer un compte pour suivre ma commande'}
          </Link>
        </div>
      </div>
    </div>
  );
}
