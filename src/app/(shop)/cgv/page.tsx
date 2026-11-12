import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FloralDivider } from '@/components/brand/FloralAccents';
import { formatPrice } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';
import { store } from '@/lib/store';

export const metadata: Metadata = pageMetadata({
  title: 'Conditions générales de vente',
  description:
    "Conditions générales de vente des P'tites Créa de Claire : prix, paiement, retrait à Port-la-Nouvelle, livraison Colissimo, rétractation sous 14 jours.",
  path: '/cgv',
});

export default async function CGVPage() {
  const [settings, cms] = await Promise.all([store.getPublicSettings(), store.getCmsSettings()]);
  const shippingTerms =
    settings.freeShippingThreshold > 0
      ? `Frais de port : ${formatPrice(settings.shippingPrice)}, offerts dès ${formatPrice(settings.freeShippingThreshold)} d'achat.`
      : `Frais de port : ${formatPrice(settings.shippingPrice)}.`;
  const mediator = cms.legal_mediator?.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Conditions Générales de Vente (CGV)</h1>
        <p className="text-xs text-muted">Régissant les ventes de bijoux et créations artisanales</p>
        <FloralDivider />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xs space-y-6 text-sm text-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">1. Objet</h2>
          <p>
            Les présentes conditions générales de vente s&apos;appliquent à toutes les commandes passées sur la boutique en ligne <strong>Les P&apos;tites Créa de Claire</strong> pour des créations artisanales faites main. L&apos;identité du vendeur figure dans les{' '}
            <Link href="/mentions-legales" className="text-plum font-semibold hover:underline">
              mentions légales
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">2. Produits et caractère artisanal</h2>
          <p>
            Chaque bijou est confectionné de manière artisanale. Les pièces uniques et séries limitées peuvent comporter de légères nuances par rapport aux photographies (inclusions de paillettes, reflets des pierres, etc.), ce qui constitue l&apos;authenticité du travail de l&apos;artisan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">3. Prix et paiement</h2>
          <p>
            Les prix sont indiqués en euros (€) toutes taxes comprises (TTC). Le règlement s&apos;effectue par carte bancaire sur une page de paiement sécurisée. La commande est confirmée par email une fois le paiement accepté.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">4. Livraison et retrait en boutique</h2>
          {settings.pickupEnabled && (
            <p>
              <strong>Retrait gratuit :</strong> disponible à la boutique L&apos;Atelier à Port-la-Nouvelle (11210) aux horaires d&apos;ouverture. Un email prévient la cliente quand sa commande est prête.
            </p>
          )}
          <p>
            <strong>Livraison Colissimo :</strong> expédition sous 48 h ouvrées en France métropolitaine. {shippingTerms}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">5. Droit de rétractation</h2>
          <p>
            Conformément à la législation française, le client dispose d&apos;un délai de 14 jours à compter de la réception de sa commande pour exercer son droit de rétractation, sans avoir à motiver sa décision. Ce droit ne s&apos;applique pas aux créations personnalisées réalisées sur mesure. Pour l&apos;exercer, il suffit d&apos;écrire à la boutique depuis la{' '}
            <Link href="/contact" className="text-plum font-semibold hover:underline">
              page contact
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">6. Garanties légales</h2>
          <p>
            Les créations bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil).
          </p>
        </section>

        {mediator && (
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-dark">7. Médiation de la consommation</h2>
            <p className="whitespace-pre-line">{mediator}</p>
          </section>
        )}
      </div>
    </div>
  );
}
