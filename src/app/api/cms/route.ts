import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

// Textes et réglages affichés sur le site : lecture publique, écriture réservée à l'administration.
export async function GET() {
  return NextResponse.json(await store.getCmsSettings());
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const updated = await store.updateCmsSettings(await readBody(request));
    return NextResponse.json({ success: true, cms: updated });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la mise à jour des contenus.');
  }
}
