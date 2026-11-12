import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Finaliser ma commande',
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-24" />}>
      <CheckoutClient />
    </Suspense>
  );
}
