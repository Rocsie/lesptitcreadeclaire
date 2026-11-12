import { NextResponse } from 'next/server';
import { sourceFromReferrer, trackEvent, type AnalyticsEvent } from '@/lib/analytics';
import { clientIp, rateLimit } from '@/lib/auth';
import { store } from '@/lib/store';

const EVENTS: AnalyticsEvent[] = ['page_view', 'product_view', 'add_to_cart', 'begin_checkout'];
const BOT_RE = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse/i;

// Compteur de visites anonyme. Les achats sont comptés côté serveur, pas ici.
export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    if (!userAgent || BOT_RE.test(userAgent)) return new NextResponse(null, { status: 204 });

    const ip = await clientIp();
    if (!rateLimit(`track:${ip}`, 120, 60_000)) return new NextResponse(null, { status: 204 });

    const body = await request.json().catch(() => null);
    const event = body?.event as AnalyticsEvent;
    if (!EVENTS.includes(event)) return new NextResponse(null, { status: 204 });

    trackEvent({
      event,
      visitorKey: `${ip}|${userAgent}`,
      source: sourceFromReferrer(
        typeof body.referrer === 'string' ? body.referrer.slice(0, 300) : undefined,
        typeof body.utmSource === 'string' ? body.utmSource.slice(0, 60) : undefined
      ),
    });

    if (event === 'product_view' && typeof body.slug === 'string') {
      await store.incrementProductViews(body.slug.slice(0, 160));
    }
  } catch (error) {
    console.error('[analytics] suivi impossible', error);
  }
  return new NextResponse(null, { status: 204 });
}
