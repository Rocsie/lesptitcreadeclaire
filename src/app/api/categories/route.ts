import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const categories = await store.getCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Le nom de la catégorie est requis' }, { status: 400 });
    }
    const created = await store.createCategory(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur création catégorie' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }
    const updated = await store.updateCategory(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur mise à jour catégorie' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }
    const deleted = await store.deleteCategory(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur suppression catégorie' }, { status: 500 });
  }
}
