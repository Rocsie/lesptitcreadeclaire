import React from 'react';
import type { Metadata } from 'next';
import { FloralDivider } from '@/components/brand/FloralAccents';
import OcDigitalLogo from '@/components/brand/OcDigitalLogo';
import { pageMetadata } from '@/lib/seo';
import { SITE_MAKER } from '@/lib/site';
import { store } from '@/lib/store';

export const metadata: Metadata = pageMetadata({
  title: 'Mentions légales',
  description:
    "Mentions légales du site Les P'tites Créa de Claire : éditeur, hébergeur, propriété intellectuelle et contact de la boutique L'Atelier à Port-la-Nouvelle.",
  path: '/mentions-legales',
});

// Les informations de l'entreprise se remplissent dans Administration > Contenu du site.
// Une ligne non renseignée n'est pas affichée (et l'administration le signale).
export default async function MentionsLegalesPage() {
  const cms = await store.getCmsSettings();
  const value = (key: string) => cms[key]?.trim() || '';
  const email = value('contact_email') || 'contact@lesptitescreadeclaire.com';
  const address = [value('contact_street'), `${value('contact_postal_code') || '11210'} ${value('contact_city') || 'Port-la-Nouvelle'}`]
    .filter(Boolean)
    .join(', ');

  const lines: Array<[string, string]> = [
    ['Nom commercial', "Les P'tites Créa de Claire (Boutique L'Atelier)"],
    ['Exploitant', value('legal_owner')],
    ['Forme juridique', value('legal_status')],
    ['SIRET', value('legal_siret')],
    ['TVA', value('legal_vat')],
    ['Adresse', `${address}, France`],
    ['Email', email],
    ['Téléphone', value('contact_phone')],
    ['Responsable de la publication', value('legal_owner') || 'Claire'],
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Mentions Légales</h1>
        <p className="text-xs text-muted">Informations réglementaires de la boutique Les P&apos;tites Créa de Claire</p>
        <FloralDivider />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xs space-y-6 text-sm text-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">1. Éditeur du site</h2>
          <dl className="space-y-1">
            {lines
              .filter(([, text]) => text)
              .map(([label, text]) => (
                <div key={label} className="flex flex-wrap gap-x-2">
                  <dt className="font-semibold text-dark">{label} :</dt>
                  <dd>{text}</dd>
                </div>
              ))}
          </dl>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">2. Hébergement</h2>
          <p className="whitespace-pre-line">
            {value('legal_host') || "Les coordonnées de l'hébergeur du site sont communiquées sur simple demande à l'adresse email ci-dessus."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-dark">3. Propriété intellectuelle</h2>
          <p>
            Les textes, photographies, créations, logos et éléments graphiques de ce site sont la propriété de la boutique. Toute reproduction sans accord écrit préalable est interdite.
          </p>
        </section>

        {value('legal_mediator') && (
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-dark">4. Médiation de la consommation</h2>
            <p className="whitespace-pre-line">{value('legal_mediator')}</p>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-dark">
            {value('legal_mediator') ? '5' : '4'}. Conception et réalisation
          </h2>
          <p>
            Ce site a été conçu et réalisé par{' '}
            <a href={SITE_MAKER.url} target="_blank" rel="noopener" className="font-semibold text-plum hover:underline">
              {SITE_MAKER.name}
              <span className="sr-only"> (nouvel onglet)</span>
            </a>
            , {SITE_MAKER.description}.
          </p>
          <a href={SITE_MAKER.url} target="_blank" rel="noopener" className="inline-flex transition-opacity hover:opacity-75">
            <OcDigitalLogo height={30} background="#FFFFFF" />
            <span className="sr-only">Visiter le site de {SITE_MAKER.name} (nouvel onglet)</span>
          </a>
        </section>
      </div>
    </div>
  );
}
