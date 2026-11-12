import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await store.getCollections());
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const created = await store.createCollection(await readBody(request));
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la création de la collection.');
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readBody(request);
    if (typeof body.id !== 'string' || !body.id) {
      return NextResponse.json({ error: 'Identifiant requis.' }, { status: 400 });
    }
    const updated = await store.updateCollection(body.id, body);
    if (!updated) return NextResponse.json({ error: 'Collection introuvable.' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la mise à jour de la collection.');
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });
    const deleted = await store.deleteCollection(id);
    if (!deleted) return NextResponse.json({ error: 'Collection introuvable.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la suppression de la collection.');
  }
}
