import { BASE_PATH } from './paths';

export const SITE_NAME = "Les P'tites Créa de Claire";

/** Adresse publique du site, sans barre finale (ex. https://lesptitescreadeclaire.com). */
export const SITE_ORIGIN = (process.env.APP_URL || 'https://lesptitescreadeclaire.com').replace(/\/+$/, '');

/** Studio qui a conçu et réalisé le site : signature du pied de page, des mentions légales et de l'administration. */
export const SITE_MAKER = {
  name: 'Oc’Digital',
  url: 'https://ocdigital.cloud/',
  description: 'studio de création et de gestion de sites web en Occitanie',
} as const;

/** URL absolue d'une page ou d'un fichier du site, basePath compris. */
export function absoluteUrl(pathname = '/'): string {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const base = SITE_ORIGIN.endsWith(BASE_PATH) ? SITE_ORIGIN : `${SITE_ORIGIN}${BASE_PATH}`;
  const suffix = pathname === '/' ? '' : pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${suffix}`;
}

/** N'accepte que des liens http(s) : évite les liens piégés saisis dans l'administration. */
export function safeExternalUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
