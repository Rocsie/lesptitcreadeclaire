import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { AuthProvider } from '@/context/AuthContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#6E2D4A',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'https://lesptitescreadeclaire.fr'),
  title: "Les P'tites Créa de Claire | Bijoux & Créations artisanales • Port-la-Nouvelle",
  description: "Boutique L'Atelier à Port-la-Nouvelle. Bijoux faits main, créations artisanales uniques et petites séries étincelantes imaginées et réalisées avec passion dans l'Aude.",
  keywords: [
    'bijoux Port-la-Nouvelle',
    'créatrice bijoux Port-la-Nouvelle',
    'bijoux artisanaux Port-la-Nouvelle',
    'créations artisanales Port-la-Nouvelle',
    'bijoux faits main Aude',
    'créatrice artisanale Aude',
    'Les P\'tites Créa de Claire',
    'Boutique L\'Atelier'
  ],
  authors: [{ name: 'Claire' }],
  openGraph: {
    title: "Les P'tites Créa de Claire • Boutique L'Atelier",
    description: "Des créations uniques et bijoux artisanaux faits main à Port-la-Nouvelle.",
    url: 'https://lesptitescreadeclaire.fr',
    siteName: "Les P'tites Créa de Claire",
    images: [
      {
        url: '/images/hero-atelier.jpg',
        width: 1200,
        height: 630,
        alt: 'Les P\'tites Créa de Claire - Bijoux artisanaux à Port-la-Nouvelle',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-dark antialiased" suppressHydrationWarning>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
