import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { StoreError, store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await store.getOpeningHours());
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    let hours: unknown;
    try {
      hours = await request.json();
    } catch {
      throw new StoreError('Requête invalide.');
    }
    return NextResponse.json(await store.updateOpeningHours(hours));
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la mise à jour des horaires.');
  }
}
