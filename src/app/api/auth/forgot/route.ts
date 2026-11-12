import crypto from 'crypto';
import { NextResponse, after } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { clientIp, rateLimit } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { store } from '@/lib/store';

// Demande de réinitialisation. La réponse est toujours la même, que le compte existe ou non,
// pour ne pas révéler quelles adresses ont un compte.
export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    const ip = await clientIp();
    if (!rateLimit(`forgot:${ip}`, 5, 60 * 60_000) || !rateLimit(`forgot:${email}`, 3, 60 * 60_000)) {
      return NextResponse.json({ error: 'Trop de demandes. Merci de réessayer plus tard.' }, { status: 429 });
    }

    const user = email ? await store.getStoredUserByEmail(email) : null;
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await store.setPasswordReset(user.id, tokenHash, new Date(Date.now() + 60 * 60_000).toISOString());
      after(() => sendPasswordResetEmail(user.email, user.firstName, token));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la demande de réinitialisation.');
  }
}
