import { NextResponse, after } from 'next/server';
import { trackEvent } from '@/lib/analytics';
import { errorResponse, readBody } from '@/lib/api';
import { clientIp, getSessionUser, rateLimit } from '@/lib/auth';
import { sendOrderEmails } from '@/lib/mailer';
import { placeOrder } from '@/lib/orders';
import { store, type CreateOrderInput } from '@/lib/store';

// La gestionnaire voit toutes les commandes, une cliente connectée uniquement les siennes.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  if (user.role === 'ADMIN') {
    return NextResponse.json(await store.getOrders());
  }

  const own = await store.getOrdersForUser(user);
  return NextResponse.json(
    own.map((order) => ({ ...order, accessToken: undefined, adminNotes: undefined, paymentReference: undefined }))
  );
}

export async function POST(request: Request) {
  try {
    if (!rateLimit(`order:${await clientIp()}`, 20, 60 * 60_000)) {
      return NextResponse.json(
        { error: 'Trop de commandes en peu de temps. Merci de réessayer un peu plus tard.' },
        { status: 429 }
      );
    }

    const body = (await readBody(request)) as unknown as CreateOrderInput;
    const user = await getSessionUser();
    const placed = await placeOrder(body, user);

    if (placed.paid) {
      after(async () => {
        trackEvent({ event: 'purchase' });
        await sendOrderEmails(placed.order);
      });
    }

    return NextResponse.json(
      {
        orderNumber: placed.order.orderNumber,
        accessToken: placed.order.accessToken,
        total: placed.order.total,
        status: placed.order.status,
        checkoutUrl: placed.checkoutUrl || null,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la création de la commande.');
  }
}
