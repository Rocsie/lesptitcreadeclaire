import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await store.updateOrderStatus(id, body.status, body.adminNotes);
    if (!updated) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la commande' }, { status: 500 });
  }
}
