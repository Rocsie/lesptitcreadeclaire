import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const messages = await store.getContactMessages();
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await store.addContactMessage(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du message' }, { status: 500 });
  }
}
