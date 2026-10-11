import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const hours = await store.getOpeningHours();
  return NextResponse.json(hours);
}

export async function PUT(request: Request) {
  try {
    const hours = await request.json();
    const updated = await store.updateOpeningHours(hours);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour des horaires' }, { status: 500 });
  }
}
