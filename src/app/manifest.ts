import type { MetadataRoute } from 'next';
import { withBase } from '@/lib/paths';
import { SITE_NAME } from '@/lib/site';

// Fiche d'identité du site pour les téléphones (ajout à l'écran d'accueil, couleur de la barre).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}, bijoux artisanaux à Port-la-Nouvelle`,
    short_name: "L'Atelier",
    description: 'Bijoux faits main à Port-la-Nouvelle : pièces uniques et petites séries.',
    lang: 'fr',
    start_url: withBase('/'),
    display: 'standalone',
    background_color: '#FDFBF7',
    theme_color: '#6E2D4A',
    icons: [
      { src: withBase('/icon.svg'), type: 'image/svg+xml', sizes: 'any' },
      { src: withBase('/apple-icon.png'), type: 'image/png', sizes: '180x180' },
      { src: withBase('/images/icone-512.png'), type: 'image/png', sizes: '512x512' },
    ],
  };
}
