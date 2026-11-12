import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

// Réglages publics du tunnel de commande : frais de port, seuil de gratuité, mode de paiement.
export async function GET() {
  return NextResponse.json(await store.getPublicSettings());
}
