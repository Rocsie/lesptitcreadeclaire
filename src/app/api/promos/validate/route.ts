import { NextResponse } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { clientIp, rateLimit } from '@/lib/auth';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    // Empêche de deviner les codes promo par essais successifs.
    if (!rateLimit(`promo:${await clientIp()}`, 30, 10 * 60_000)) {
      return NextResponse.json(
        { valid: false, message: 'Trop de tentatives, merci de patienter quelques minutes.' },
        { status: 429 }
      );
    }
    const body = await readBody(request);
    const result = await store.validateCoupon(String(body.code || ''), Number(body.subtotal) || 0);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la validation du code.');
  }
}
