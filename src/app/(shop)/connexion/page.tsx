import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-24" />}>
      <LoginForm />
    </Suspense>
  );
}
