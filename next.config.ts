import type { NextConfig } from 'next';

// Sous-dossier de déploiement. Vide = site servi à la racine du domaine.
// Pour la démo servie sous /lpc : NEXT_PUBLIC_BASE_PATH=/lpc au moment du build.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

// Une seule adresse officielle : si APP_URL est en https sur un vrai domaine, la variante avec ou sans
// "www" est redirigée définitivement vers elle. Sans cela, les moteurs de recherche voient deux sites.
function canonicalHostRedirect() {
  let official: URL;
  try {
    official = new URL(process.env.APP_URL || '');
  } catch {
    return [];
  }
  const host = official.host;
  if (official.protocol !== 'https:' || /^(localhost|127\.|\[::1\])/.test(host) || !host.includes('.')) return [];
  const variant = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
  return [
    {
      source: '/:path*',
      has: [{ type: 'host' as const, value: variant.replace(/\./g, '\\.') }],
      destination: `${official.origin}${basePath}/:path*`,
      permanent: true,
    },
  ];
}

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  turbopack: {
    root: process.cwd(),
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.1.*', '*.loca.lt'],
  // Aucune indication de la technologie utilisée dans les en-têtes de réponse.
  poweredByHeader: false,
  images: {
    // Les photos sont redimensionnées et converties à la demande (AVIF, sinon WebP),
    // puis gardées en cache un mois : une photo de 1 Mo devient une vignette de quelques Ko.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [420, 640, 828, 1080, 1280, 1600],
    imageSizes: [64, 96, 128, 256, 384],
  },
  async redirects() {
    return canonicalHostRedirect();
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Les photos de public/images ne changent pas de nom : cache long côté navigateur.
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }],
      },
    ];
  },
};

export default nextConfig;
