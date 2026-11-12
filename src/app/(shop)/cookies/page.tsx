import React from 'react';
import type { Metadata } from 'next';
import { FloralDivider } from '@/components/brand/FloralAccents';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Gestion des cookies',
  description:
    "Le site Les P'tites Créa de Claire n'utilise aucun cookie publicitaire : uniquement un cookie de session pour votre compte et une mesure d'audience sans cookie.",
  path: '/cookies',
});

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Gestion des Cookies</h1>
        <p className="text-xs text-muted">Informations sur l&apos;utilisation des traceurs</p>
        <FloralDivider />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xs space-y-6 text-sm text-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">1. Cookies techniques nécessaires</h2>
          <p>
            Le site n&apos;utilise que le strict nécessaire à son fonctionnement : un cookie de session quand vous vous connectez à votre compte, et le stockage local de votre navigateur pour conserver votre panier et vos favoris. Aucun cookie publicitaire n&apos;est déposé.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">2. Mesure d&apos;audience interne</h2>
          <p>
            Les visites sont comptées par un outil interne, sans cookie et sans donnée personnelle : seuls des totaux par jour sont conservés (pages vues, créations consultées). Aucun service tiers de suivi n&apos;est utilisé.
          </p>
        </section>
      </div>
    </div>
  );
}
