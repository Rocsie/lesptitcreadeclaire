import { withBase } from './paths';

type ClientEvent = 'page_view' | 'product_view' | 'add_to_cart' | 'begin_checkout';

/** Envoie un événement de mesure d'audience anonyme. Ne bloque jamais la navigation. */
export function track(event: ClientEvent, extra: Record<string, string | undefined> = {}): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify({ event, ...extra });
    const url = withBase('/api/analytics/track');
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch {
    // la mesure d'audience ne doit jamais gêner le site
  }
}
