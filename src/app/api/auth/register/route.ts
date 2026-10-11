import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      email,
      firstName,
      lastName,
      phone: phone || null,
      role: 'CLIENT',
    };

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
  }
}
