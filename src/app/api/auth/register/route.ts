import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { checkPasswordStrength, clientIp, hashPassword, rateLimit, startSession } from '@/lib/auth';
import { StoreError, isValidEmail, store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const firstName = typeof body.firstName === 'string' ? body.firstName : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName : '';
    const phone = typeof body.phone === 'string' ? body.phone : '';

    if (!firstName.trim() || !lastName.trim()) throw new StoreError('Merci de renseigner votre prénom et votre nom.');
    if (!isValidEmail(email)) throw new StoreError("L'adresse email n'est pas valide.");
    const password = checkPasswordStrength(body.password);

    const ip = await clientIp();
    if (!rateLimit(`register:${ip}`, 10, 60 * 60_000)) {
      return NextResponse.json({ error: 'Trop de créations de compte. Merci de réessayer plus tard.' }, { status: 429 });
    }

    if (await store.getStoredUserByEmail(email)) {
      throw new StoreError('Un compte existe déjà avec cette adresse email.', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await store.createUser({ email, passwordHash, firstName, lastName, phone, role: 'CLIENT' });
    const stored = await store.getStoredUserById(user.id);
    if (stored) await startSession(stored);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la création du compte.');
  }
}
