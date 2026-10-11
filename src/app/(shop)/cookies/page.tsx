import React from 'react';
import { FloralDivider } from '@/components/brand/FloralAccents';

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Gestion des Cookies</h1>
        <p className="text-xs text-muted">Informations sur l&apos;utilisation des traceurs</p>
        <FloralDivider />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xs space-y-6 text-xs text-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">1. Cookies Techniques Nécessaires</h2>
          <p>
            Ces cookies sont indispensables au bon fonctionnement de la boutique en ligne : maintien du contenu de votre panier, mémorisation de votre session de connexion et sécurité des transactions bancaires.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">2. Mesure d&apos;Audience Interne</h2>
          <p>
            Nous utilisons un outil d&apos;analytics interne respectueux de la vie privée, sans profilage publicitaire invasif, afin d&apos;analyser les créations les plus consultées et améliorer votre expérience d&apos;achat.
          </p>
        </section>
      </div>
    </div>
  );
}
