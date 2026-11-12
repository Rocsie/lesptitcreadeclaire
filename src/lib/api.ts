import { NextResponse } from 'next/server';
import { StoreError } from './store';

/** Transforme une erreur en réponse JSON : message métier tel quel, sinon message générique. */
export function errorResponse(err: unknown, fallback: string): NextResponse {
  if (err instanceof StoreError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(`[api] ${fallback}`, err);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // corps absent ou JSON invalide
  }
  throw new StoreError('Requête invalide.');
}
