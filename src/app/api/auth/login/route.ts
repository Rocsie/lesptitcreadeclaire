import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { clientIp, ensureAdminAccount, rateLimit, startSession, verifyPassword } from '@/lib/auth';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
    }

    const ip = await clientIp();
    if (!rateLimit(`login:${ip}`, 20, 15 * 60_000) || !rateLimit(`login:${email}`, 8, 15 * 60_000)) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Merci de patienter quelques minutes avant de réessayer.' },
        { status: 429 }
      );
    }

    await ensureAdminAccount();

    const stored = await store.getStoredUserByEmail(email);
    const ok = stored ? await verifyPassword(password, stored.passwordHash) : false;
    if (!stored || !ok) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
    }

    await startSession(stored);
    return NextResponse.json({
      user: {
        id: stored.id,
        email: stored.email,
        firstName: stored.firstName,
        lastName: stored.lastName,
        phone: stored.phone ?? null,
        role: stored.role,
      },
    });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la connexion.');
  }
}
