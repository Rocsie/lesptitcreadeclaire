import React from 'react';
import Link from 'next/link';
import { FloralDivider } from '@/components/brand/FloralAccents';

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Mentions Légales</h1>
        <p className="text-xs text-muted">Informations réglementaires régissant la boutique Les P&apos;tites Créa de Claire</p>
        <FloralDivider />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xs space-y-6 text-xs text-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">1. Éditeur du Site</h2>
          <p>
            Le site internet <strong>Les P&apos;tites Créa de Claire</strong> est édité par l&apos;entreprise artisanale :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dénomination :</strong> Les P&apos;tites Créa de Claire (Boutique L&apos;Atelier)</li>
            <li><strong>Responsable de publication :</strong> Claire</li>
            <li><strong>Localisation :</strong> Port-la-Nouvelle (11210), Aude, Occitanie, France</li>
            <li><strong>Email de contact :</strong> contact@lesptitescreadeclaire.fr</li>
            <li><strong>Téléphone :</strong> 04 68 00 00 00</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">2. Hébergement</h2>
          <p>
            Le site est hébergé sur un serveur VPS dédié hautement sécurisé sous Linux / Apache2 / Node.js avec chiffrement SSL Let&apos;s Encrypt.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">3. Propriété Intellectuelle</h2>
          <p>
            Tous les textes, photographies de bijoux, créations artistiques, logos et éléments graphiques sont la propriété exclusive de Claire. Toute reproduction sans accord préalable écrit est interdite.
          </p>
        </section>
      </div>
    </div>
  );
}
