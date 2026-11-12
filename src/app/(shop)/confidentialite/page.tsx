import React from 'react';
import type { Metadata } from 'next';
import { FloralDivider } from '@/components/brand/FloralAccents';
import { pageMetadata } from '@/lib/seo';
import { store } from '@/lib/store';

export const metadata: Metadata = pageMetadata({
  title: 'Politique de confidentialité',
  description:
    "Quelles données personnelles Les P'tites Créa de Claire collecte, pourquoi, et comment exercer vos droits d'accès, de rectification et de suppression.",
  path: '/confidentialite',
});

export default async function ConfidentialitePage() {
  const cms = await store.getCmsSettings();
  const email = cms.contact_email?.trim() || 'contact@lesptitescreadeclaire.com';

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Politique de Confidentialité & RGPD</h1>
        <p className="text-xs text-muted">Protection de vos données personnelles</p>
        <FloralDivider />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xs space-y-6 text-sm text-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">1. Données collectées</h2>
          <p>
            Les données recueillies (nom, prénom, adresse e-mail, adresse de livraison, téléphone) servent uniquement au traitement des commandes, à la relation avec les clientes et aux expéditions. L&apos;adresse e-mail laissée dans le formulaire de la lettre d&apos;information ne sert qu&apos;à l&apos;envoi de cette lettre.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">2. Paiement</h2>
          <p>
            Les paiements par carte sont traités par le prestataire de paiement Stripe. Les données bancaires ne transitent pas par le site et n&apos;y sont jamais enregistrées.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">3. Aucune cession à des tiers</h2>
          <p>
            Vos données ne sont ni vendues, ni louées, ni cédées à des organismes commerciaux. Elles ne sont transmises qu&apos;aux prestataires nécessaires à l&apos;exécution de la commande (paiement, transport).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">4. Mesure d&apos;audience</h2>
          <p>
            Les visites sont comptées par un outil interne, sans cookie et sans donnée personnelle : seuls des totaux par jour sont conservés.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">5. Vos droits</h2>
          <p>
            Conformément au Règlement général sur la protection des données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données sur simple demande par email à <strong>{email}</strong>. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).
          </p>
        </section>
      </div>
    </div>
  );
}
