import { NextResponse } from 'next/server';
import { getAnalyticsReport } from '@/lib/analytics';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const days = Number(new URL(request.url).searchParams.get('days')) || 7;
  return NextResponse.json(await getAnalyticsReport(days));
}
