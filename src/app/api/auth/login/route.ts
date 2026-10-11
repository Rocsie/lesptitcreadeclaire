import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    // Compte Claire Administrateur
    if (email.toLowerCase() === 'admin@lesptitescreadeclaire.fr' && password === 'claire2026!') {
      return NextResponse.json({
        user: {
          id: 'usr-admin',
          email,
          firstName: 'Claire',
          lastName: 'Artisane',
          role: 'ADMIN',
          phone: '04 68 00 00 00',
        },
      });
    }

    // Compte Sophie Client
    if (email.toLowerCase() === 'sophie.martin@example.fr' && password === 'client123!') {
      return NextResponse.json({
        user: {
          id: 'usr-client',
          email,
          firstName: 'Sophie',
          lastName: 'Martin',
          role: 'CLIENT',
          phone: '06 12 34 56 78',
        },
      });
    }

    return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la connexion' }, { status: 500 });
  }
}
