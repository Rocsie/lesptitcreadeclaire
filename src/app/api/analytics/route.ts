import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const analytics = await store.getAnalytics();
  return NextResponse.json(analytics);
}
