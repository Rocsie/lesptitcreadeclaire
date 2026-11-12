import type { Metadata, Viewport } from 'next';
import { Alex_Brush, Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { getSessionUser } from '@/lib/auth';
import { DEFAULT_SHARE_IMAGE, SITE_NOINDEX } from '@/lib/seo';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { store } from '@/lib/store';

// Tout le site lit les données de la boutique (produits, textes, réglages) à chaque visite :
// une modification faite dans l'administration est visible immédiatement, sans reconstruire le site.
export const dynamic = 'force-dynamic';

const alexBrush = Alex_Brush({ subsets: ['latin'], weight: '400', variable: '--font-alex-brush', display: 'swap' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#6E2D4A',
};

const DESCRIPTION =
  "Boutique L'Atelier à Port-la-Nouvelle. Bijoux faits main, créations artisanales uniques et petites séries imaginées et réalisées avec passion dans l'Aude.";

// Valeurs par défaut. Chaque page indexable définit les siennes (titre, description,
// adresse canonique, image de partage) avec pageMetadata() de src/lib/seo.ts.
export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl('/')),
  title: {
    default: `Bijoux artisanaux à Port-la-Nouvelle | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'Claire' }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'shopping',
  formatDetection: { telephone: false },
  // Démo ou préproduction : SITE_NOINDEX=true empêche toute indexation.
  robots: SITE_NOINDEX
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
      },
  // Code de validation Google Search Console, à mettre dans GOOGLE_SITE_VERIFICATION.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: {
    title: `${SITE_NAME}, bijoux artisanaux à Port-la-Nouvelle`,
    description: 'Des créations uniques et bijoux artisanaux faits main à Port-la-Nouvelle.',
    siteName: SITE_NAME,
    images: [
      {
        url: absoluteUrl(DEFAULT_SHARE_IMAGE),
        width: 1200,
        height: 630,
        alt: "Les P'tites Créa de Claire, bijoux artisanaux à Port-la-Nouvelle",
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([store.getPublicSettings(), getSessionUser()]);

  return (
    <html
      lang="fr"
      className={`${alexBrush.variable} ${cormorant.variable} ${jakarta.variable} h-full scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-cream text-dark antialiased">
        <Providers settings={settings} initialUser={user}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
