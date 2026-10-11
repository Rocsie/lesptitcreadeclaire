import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const cms = await store.getCmsSettings();
  return NextResponse.json(cms);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    for (const [key, value] of Object.entries(body)) {
      await store.updateCmsSetting(key, String(value));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour CMS' }, { status: 500 });
  }
}
