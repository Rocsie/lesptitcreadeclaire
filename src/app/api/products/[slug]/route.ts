import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { getSessionUser, requireAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { VISIBLE_STATUSES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await store.getProductBySlug(slug);
    if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
    if (!VISIBLE_STATUSES.includes(product.status)) {
      const user = await getSessionUser();
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
      }
    }
    return NextResponse.json(product);
  } catch (error) {
    return errorResponse(error, 'Erreur serveur.');
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const { slug } = await params;
    const body = await readBody(request);
    const id = typeof body.id === 'string' && body.id ? body.id : slug;
    const updated = await store.updateProduct(id, body);
    if (!updated) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la mise à jour.');
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const { slug } = await params;
    const deleted = await store.deleteProduct(slug);
    if (!deleted) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la suppression.');
  }
}
