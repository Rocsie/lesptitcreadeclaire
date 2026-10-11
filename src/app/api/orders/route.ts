import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const orders = await store.getOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await store.createOrder(body);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 });
  }
}
