'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/track';

// Compte une page vue à chaque changement de page de la boutique.
// La provenance (Instagram, Google...) n'est transmise qu'à l'arrivée sur le site.
export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    let referrer: string | undefined;
    let utmSource: string | undefined;
    try {
      if (!window.sessionStorage.getItem('pcc_seen')) {
        window.sessionStorage.setItem('pcc_seen', '1');
        const external = document.referrer && !document.referrer.startsWith(window.location.origin);
        referrer = external ? document.referrer : undefined;
        utmSource = new URLSearchParams(window.location.search).get('utm_source') || undefined;
      }
    } catch {
      // stockage de session indisponible
    }
    track('page_view', { referrer, utmSource });
  }, [pathname]);

  return null;
}
