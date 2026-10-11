import React from 'react';
import { FloralDivider } from '@/components/brand/FloralAccents';

export default function ConfidentialitePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Politique de Confidentialité & RGPD</h1>
        <p className="text-xs text-muted">Protection de vos données personnelles</p>
        <FloralDivider />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xs space-y-6 text-xs text-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">1. Collecte des Données</h2>
          <p>
            Les données personnelles recueillies (nom, prénom, adresse e-mail, adresse de livraison, téléphone) sont strictement destinées au traitement des commandes, à la gestion de la relation client et aux expéditions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">2. Non-Transmission à des Tiers</h2>
          <p>
            Vos données ne sont ni vendues, ni louées, ni cédées à des organismes commerciaux tiers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">3. Vos Droits Informatique et Libertés</h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données personnelles sur simple demande par email à : <strong>contact@lesptitescreadeclaire.fr</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
