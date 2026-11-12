import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { confirmPaidOrder } from '@/lib/orders';
import { parseWebhookEvent } from '@/lib/payments';
import { store } from '@/lib/store';

// Stripe appelle cette adresse après chaque paiement.
// À déclarer dans le tableau de bord Stripe : <APP_URL>/api/stripe/webhook
// avec les événements checkout.session.completed, checkout.session.async_payment_succeeded,
// checkout.session.async_payment_failed et checkout.session.expired.
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const event = parseWebhookEvent(rawBody, request.headers.get('stripe-signature'));

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id;
      if (orderId && session.payment_status === 'paid') {
        await confirmPaidOrder(orderId, session.id);
      }
    }

    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id;
      if (orderId) await store.cancelPendingOrder(orderId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return errorResponse(error, 'Erreur de traitement du webhook.');
  }
}
