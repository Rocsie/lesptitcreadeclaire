import { NextResponse, after } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { sendOrderStatusEmail } from '@/lib/mailer';
import { store } from '@/lib/store';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/types';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const { id } = await params;
    const body = await readBody(request);

    let status: OrderStatus | undefined;
    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !(body.status in ORDER_STATUS_LABELS)) {
        return NextResponse.json({ error: 'Statut de commande inconnu.' }, { status: 400 });
      }
      status = body.status as OrderStatus;
    }

    const result = await store.updateOrder(id, {
      status,
      adminNotes: typeof body.adminNotes === 'string' ? body.adminNotes : undefined,
      trackingNumber: typeof body.trackingNumber === 'string' ? body.trackingNumber : undefined,
    });
    if (!result) return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });

    // La cliente est prévenue par email quand le statut change vraiment.
    if (status && status !== result.previousStatus) {
      after(() => sendOrderStatusEmail(result.order));
    }

    return NextResponse.json(result.order);
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la mise à jour de la commande.');
  }
}
