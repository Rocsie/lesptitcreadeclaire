import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const collections = await store.getCollections();
  return NextResponse.json(collections);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Le nom de la collection est requis' }, { status: 400 });
    }
    const created = await store.createCollection(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur création collection' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }
    const updated = await store.updateCollection(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Collection introuvable' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur mise à jour collection' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }
    const deleted = await store.deleteCollection(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur suppression collection' }, { status: 500 });
  }
}
