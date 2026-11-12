import React, { Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import Tracker from '@/components/analytics/Tracker';
import { store } from '@/lib/store';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [cms, hours, categories, products] = await Promise.all([
    store.getCmsSettings(),
    store.getOpeningHours(),
    store.getCategories(),
    store.getVisibleProducts(),
  ]);
  // Le pied de page ne propose que les rayons qui contiennent des créations.
  const footerCategories = categories.filter((c) => products.some((p) => p.categoryId === c.id));
  // Le bandeau affiche déjà une petite étoile dessinée : un emoji saisi en début de texte ferait doublon.
  const announcement = (cms.banner_announcement || '').replace(/^(?:\p{Extended_Pictographic}|\uFE0F|\s)+/u, '').trim();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-plum focus:text-white focus:text-sm"
      >
        Aller au contenu
      </a>
      <Suspense fallback={<div className="h-20 bg-cream border-b border-rose-powder/20" />}>
        <Header announcement={announcement} />
      </Suspense>
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <CartDrawer />
      <Footer hours={hours} cms={cms} categories={footerCategories} />
      <Suspense fallback={null}>
        <Tracker />
      </Suspense>
    </div>
  );
}
