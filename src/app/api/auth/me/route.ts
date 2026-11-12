import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { checkPasswordStrength, getSessionUser, hashPassword, startSession, verifyPassword } from '@/lib/auth';
import { StoreError, store } from '@/lib/store';

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

// Mise à jour du profil et changement de mot de passe de la personne connectée.
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
    const body = await readBody(request);

    let passwordHash: string | undefined;
    if (body.newPassword !== undefined && body.newPassword !== '') {
      const stored = await store.getStoredUserById(user.id);
      const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';
      if (!stored || !(await verifyPassword(current, stored.passwordHash))) {
        throw new StoreError('Le mot de passe actuel est incorrect.', 403);
      }
      passwordHash = await hashPassword(checkPasswordStrength(body.newPassword));
    }

    const updated = await store.updateUser(user.id, {
      firstName: typeof body.firstName === 'string' ? body.firstName : undefined,
      lastName: typeof body.lastName === 'string' ? body.lastName : undefined,
      phone: typeof body.phone === 'string' ? body.phone : undefined,
      passwordHash,
    });

    // Le changement de mot de passe invalide les sessions : on rouvre celle en cours.
    if (passwordHash) {
      const stored = await store.getStoredUserById(user.id);
      if (stored) await startSession(stored);
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la mise à jour du compte.');
  }
}
