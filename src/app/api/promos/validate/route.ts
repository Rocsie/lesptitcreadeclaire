import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const { code, subtotal } = await request.json();
    if (!code) {
      return NextResponse.json({ valid: false, message: 'Veuillez saisir un code.' });
    }
    const result = await store.validateCoupon(code, Number(subtotal) || 0);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ valid: false, message: 'Erreur lors de la validation' }, { status: 500 });
  }
}
