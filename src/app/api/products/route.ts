import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    let products = await store.getProducts();

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.materials?.toLowerCase().includes(q)
      );
    }

    if (category) {
      products = products.filter((p) => p.categoryId === category);
    }

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des produits' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await store.createProduct(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création du produit' }, { status: 500 });
  }
}
