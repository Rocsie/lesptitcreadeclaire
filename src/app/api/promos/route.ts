import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const coupons = await store.getCoupons();
  return NextResponse.json(coupons);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.code) {
      return NextResponse.json({ error: 'Le code promo est requis' }, { status: 400 });
    }
    const created = await store.createCoupon(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur création code promo' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID du code requis' }, { status: 400 });
    }
    const updated = await store.updateCoupon(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Code promo introuvable' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur mise à jour code promo' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }
    const deleted = await store.deleteCoupon(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur suppression code promo' }, { status: 500 });
  }
}
