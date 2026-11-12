import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import ResetForm from './ResetForm';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-24" />}>
      <ResetForm />
    </Suspense>
  );
}
