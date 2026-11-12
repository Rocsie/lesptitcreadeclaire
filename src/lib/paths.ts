// Gestion du sous-dossier de déploiement (basePath).
// Next.js préfixe tout seul les <Link> et le routeur, mais ni les <img> ni fetch().
// Ces helpers font le reste pour que le site marche à la racine comme sous /lpc.

export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

/** Préfixe une URL interne (image, fichier, route API) par le basePath. */
export function withBase(url: string | null | undefined): string {
  if (!url) return '';
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  if (!BASE_PATH) return url;
  if (url === BASE_PATH || url.startsWith(`${BASE_PATH}/`)) return url;
  return `${BASE_PATH}${url}`;
}

/** fetch() vers une route interne, avec le basePath et le cookie de session. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(withBase(path), { credentials: 'same-origin', ...init });
}

/** Slug lisible à partir d'un libellé français (accents retirés). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Montant en euros au format français : 34,00 €. */
export function formatPrice(amount: number): string {
  return `${(Number(amount) || 0).toFixed(2).replace('.', ',')} €`;
}
