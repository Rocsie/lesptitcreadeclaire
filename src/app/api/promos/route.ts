import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { store } from '@/lib/store';

// La liste des codes promo est réservée à l'administration.
// Le panier passe par /api/promos/validate, qui ne révèle rien d'autre que le code saisi.

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json(await store.getCoupons());
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const created = await store.createCoupon(await readBody(request));
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la création du code promo.');
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readBody(request);
    if (typeof body.id !== 'string' || !body.id) {
      return NextResponse.json({ error: 'Identifiant du code requis.' }, { status: 400 });
    }
    const updated = await store.updateCoupon(body.id, body);
    if (!updated) return NextResponse.json({ error: 'Code promo introuvable.' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la mise à jour du code promo.');
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });
    const deleted = await store.deleteCoupon(id);
    if (!deleted) return NextResponse.json({ error: 'Code promo introuvable.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la suppression du code promo.');
  }
}
