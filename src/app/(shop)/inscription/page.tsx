import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
  title: 'Créer un compte',
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-24" />}>
      <RegisterForm />
    </Suspense>
  );
}
