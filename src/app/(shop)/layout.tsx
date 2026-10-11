import React, { Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Suspense fallback={<div className="h-20 bg-cream border-b border-rose-soft/20" />}>
        <Header />
      </Suspense>
      <main className="flex-1">
        {children}
      </main>
      <CartDrawer />
      <Footer />
    </div>
  );
}

