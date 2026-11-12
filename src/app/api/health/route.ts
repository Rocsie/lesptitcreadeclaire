import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { DATA_DIR, store } from '@/lib/store';

export const dynamic = 'force-dynamic';

// Point de contrôle pour la surveillance (PM2, UptimeRobot...).
// Répond 200 quand le site sait lire ses données et écrire dans son dossier, 503 sinon.
// Ne révèle aucune information sur la boutique.
export async function GET() {
  try {
    await store.getPublicSettings();
    const probe = path.join(DATA_DIR, '.health');
    fs.writeFileSync(probe, String(Date.now()));
    fs.unlinkSync(probe);
    return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[health] le dossier de données est inaccessible', error);
    return NextResponse.json({ status: 'error' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
