import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { getSessionUser, requireAdmin } from '@/lib/auth';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    // Les brouillons et produits masqués ne sortent que pour l'administration.
    let products;
    if (searchParams.get('scope') === 'admin') {
      const user = await getSessionUser();
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Accès réservé à la gestionnaire.' }, { status: 403 });
      }
      products = await store.getProducts();
    } else {
      products = await store.getVisibleProducts();
    }

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
    return errorResponse(error, 'Erreur lors de la récupération des produits.');
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const created = await store.createProduct(await readBody(request));
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la création du produit.');
  }
}
