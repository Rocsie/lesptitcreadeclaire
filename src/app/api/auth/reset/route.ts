import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { checkPasswordStrength, clientIp, hashPassword, rateLimit } from '@/lib/auth';
import { StoreError, store } from '@/lib/store';

// Enregistre le nouveau mot de passe à partir du lien reçu par email.
export async function POST(request: Request) {
  try {
    if (!rateLimit(`reset:${await clientIp()}`, 10, 60 * 60_000)) {
      return NextResponse.json({ error: 'Trop de tentatives. Merci de réessayer plus tard.' }, { status: 429 });
    }
    const body = await readBody(request);
    const token = typeof body.token === 'string' ? body.token : '';
    const password = checkPasswordStrength(body.password);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = token ? await store.getStoredUserByResetToken(tokenHash) : null;
    if (!user) {
      throw new StoreError('Ce lien de réinitialisation est invalide ou a expiré. Refaites une demande.', 400);
    }

    await store.updateUser(user.id, { passwordHash: await hashPassword(password) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la réinitialisation du mot de passe.');
  }
}
