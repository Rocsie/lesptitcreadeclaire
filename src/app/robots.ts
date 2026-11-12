import type { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/paths';
import { SITE_NOINDEX } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';

// Généré à la demande : l'adresse du site vient de APP_URL au démarrage, pas au moment du build.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  // Démo ou préproduction (SITE_NOINDEX=true) : rien ne doit être indexé,
  // sinon le site de test ferait doublon avec le vrai.
  if (SITE_NOINDEX) {
    return { rules: { userAgent: '*', disallow: `${BASE_PATH}/` } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: `${BASE_PATH}/`,
      disallow: [
        '/admin',
        '/api/',
        '/compte',
        '/checkout',
        '/connexion',
        '/inscription',
        '/mot-de-passe-oublie',
        '/reinitialisation',
      ].map((path) => `${BASE_PATH}${path}`),
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
