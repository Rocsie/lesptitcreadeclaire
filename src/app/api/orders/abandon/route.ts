import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { abandonPendingOrder } from '@/lib/orders';
import { store } from '@/lib/store';

// Appelée quand la cliente revient de la page de paiement sans avoir payé :
// la commande en attente est annulée et les créations redeviennent disponibles.
export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const order = await store.getOrderByNumber(String(body.orderNumber || ''));
    if (!order || !order.accessToken || order.accessToken !== body.token) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
    }
    const updated = await abandonPendingOrder(order);
    return NextResponse.json({ status: updated.status });
  } catch (error) {
    return errorResponse(error, "Erreur lors de l'annulation de la commande.");
  }
}
