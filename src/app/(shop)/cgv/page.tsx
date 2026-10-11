import React from 'react';
import { FloralDivider } from '@/components/brand/FloralAccents';

export default function CGVPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Conditions Générales de Vente (CGV)</h1>
        <p className="text-xs text-muted">Régissant les ventes de bijoux et créations artisanales</p>
        <FloralDivider />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xs space-y-6 text-xs text-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">1. Objet</h2>
          <p>
            Les présentes Conditions Générales de Vente s&apos;appliquent à toutes les commandes passées sur la boutique en ligne <strong>Les P&apos;tites Créa de Claire</strong> pour des créations artisanales faites main.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">2. Produits et Caractère Artisanal</h2>
          <p>
            Chaque bijou est confectionné de manière artisanale. Les pièces uniques et séries limitées peuvent comporter de légères nuances par rapport aux photographies (inclusions de paillettes, reflets des pierres, etc.), ce qui constitue l&apos;authenticité du travail de l&apos;artisan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">3. Prix et Paiement</h2>
          <p>
            Les prix sont indiqués en euros (€) toutes taxes comprises (TTC). Le règlement s&apos;effectue par carte bancaire via paiement chiffré et sécurisé Stripe.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">4. Livraison & Retrait Boutique</h2>
          <p>
            <strong>Retrait gratuit :</strong> Disponible à la boutique L&apos;Atelier à Port-la-Nouvelle (11210) aux horaires d&apos;ouverture.<br />
            <strong>Livraison Colissimo :</strong> Expédiée sous 48h ouvrées. Frais de port offerts dès 60 € d&apos;achat en France.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold text-dark">5. Droit de Rétractation</h2>
          <p>
            Conformément à la législation française, le client dispose d&apos;un délai de 14 jours à compter de la réception de sa commande pour exercer son droit de rétractation (hors créations sur-mesure personnalisées).
          </p>
        </section>
      </div>
    </div>
  );
}
