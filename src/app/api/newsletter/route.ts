import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { clientIp, rateLimit, requireAdmin } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json(await store.getNewsletter());
}

export async function POST(request: Request) {
  try {
    if (!rateLimit(`newsletter:${await clientIp()}`, 10, 60 * 60_000)) {
      return NextResponse.json({ error: 'Trop de tentatives, merci de réessayer plus tard.' }, { status: 429 });
    }
    const body = await readBody(request);
    await store.addNewsletter(String(body.email || ''));
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Erreur lors de l'inscription.");
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const email = new URL(request.url).searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email manquant.' }, { status: 400 });
  const ok = await store.removeNewsletter(email);
  if (!ok) return NextResponse.json({ error: 'Abonnée introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
