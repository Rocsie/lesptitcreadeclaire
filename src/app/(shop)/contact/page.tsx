import React from 'react';
import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import ContactForm from './ContactForm';
import { FloralCorner, FloralDivider, HandDrawnHeart } from '@/components/brand/FloralAccents';
import OctopusLogo from '@/components/brand/OctopusLogo';
import JsonLd from '@/components/seo/JsonLd';
import { buildFaq } from '@/lib/faq';
import { breadcrumbJsonLd, faqJsonLd, localBusinessJsonLd, pageMetadata } from '@/lib/seo';
import { store } from '@/lib/store';

export const metadata: Metadata = pageMetadata({
  title: 'Contact et horaires | Bijoux artisanaux à Port-la-Nouvelle',
  absoluteTitle: true,
  description:
    "Horaires, adresse et contact de la boutique L'Atelier à Port-la-Nouvelle. Livraison, retrait gratuit, créations sur mesure : les réponses à vos questions.",
  path: '/contact',
});

export default async function ContactPage() {
  const [hours, cms, settings] = await Promise.all([
    store.getOpeningHours(),
    store.getCmsSettings(),
    store.getPublicSettings(),
  ]);
  const phone = cms.contact_phone?.trim();
  const email = cms.contact_email?.trim();
  const address = cms.contact_address?.trim() || "Boutique L'Atelier, 11210 Port-la-Nouvelle";
  const notice = cms.exceptional_notice?.trim();
  const faq = buildFaq(settings);
  const mapQuery = [cms.contact_street, cms.contact_postal_code || '11210', cms.contact_city || 'Port-la-Nouvelle']
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Les P'tites Créa de Claire ${mapQuery}`)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16">
      <JsonLd data={localBusinessJsonLd(cms, hours)} />
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Accueil', path: '/' },
          { name: 'Contact et horaires', path: '/contact' },
        ])}
      />

      <div className="text-center space-y-3 relative">
        <FloralCorner position="top-left" className="-top-6 left-0 hidden sm:block" />
        <FloralCorner position="top-right" className="-top-6 right-0 hidden sm:block" />

        <OctopusLogo size={52} variant="plum" className="justify-center mx-auto mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest text-plum block">
          Nous rendre visite ou nous écrire
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-dark">Contact & Horaires</h1>
        <p className="text-sm text-muted max-w-xl mx-auto font-light">
          Une question sur une création, une commande personnalisée ou nos horaires à Port-la-Nouvelle ? Claire vous répond avec plaisir.
        </p>
        <FloralDivider />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-rose-powder/30 shadow-sm space-y-6">
          <h2 className="font-serif text-2xl font-bold text-dark">Envoyer un message à Claire</h2>
          <ContactForm />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-cream-warm border border-rose-powder/30 space-y-4">
            <div className="flex items-center gap-2 text-plum">
              <Clock className="w-5 h-5 text-plum" aria-hidden="true" />
              <h2 className="font-serif text-lg font-bold text-dark">Horaires de la boutique L&apos;Atelier</h2>
            </div>

            {notice && (
              <p className="p-3 rounded-xl bg-rose-light border border-rose-powder/50 text-xs text-plum font-medium">{notice}</p>
            )}

            <div className="space-y-2 text-xs">
              {hours.length === 0 && <p className="text-muted">Horaires communiqués à la boutique.</p>}
              {hours.map((h) => (
                <div key={h.id} className="flex justify-between gap-3 p-2.5 bg-white rounded-xl border border-rose-powder/20">
                  <span className="font-bold text-plum">{h.dayGroup}</span>
                  <span className="text-dark font-medium text-right">
                    {h.isClosed ? 'Fermé' : [h.morningHours, h.afternoonHours].filter(Boolean).join(' / ')}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted italic flex items-center gap-1">
              <HandDrawnHeart color="gold" size={12} /> Retrait gratuit des commandes en boutique pendant ces horaires.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-rose-powder/30 space-y-3 text-xs text-dark/80">
            <h2 className="font-serif text-lg font-bold text-dark mb-2">Coordonnées</h2>
            <address className="not-italic space-y-3">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold shrink-0" aria-hidden="true" />
                <span>{address}</span>
              </p>
              {phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-plum shrink-0" aria-hidden="true" />
                  <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-plum transition-colors">
                    {phone}
                  </a>
                </p>
              )}
              {email && (
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-rose-old shrink-0" aria-hidden="true" />
                  <a href={`mailto:${email}`} className="hover:text-plum transition-colors break-all">
                    {email}
                  </a>
                </p>
              )}
            </address>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 px-4 py-2.5 min-h-[40px] rounded-full bg-rose-light hover:bg-rose-powder/40 text-plum font-semibold transition-colors"
            >
              <span>Voir l&apos;itinéraire</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-light to-cream-warm border border-rose-powder/40 space-y-3">
            <div className="flex items-center gap-2 text-plum font-serif text-base font-bold">
              <MapPin className="w-4 h-4 text-gold" aria-hidden="true" />
              <span>Port-la-Nouvelle & son littoral</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Venez nous rendre visite au bord de l&apos;étang et de la mer ! Vous pourrez retirer gratuitement vos achats web et découvrir en exclusivité les pièces uniques tout juste sorties de l&apos;établi.
            </p>
          </div>
        </div>
      </div>

      {/* Questions fréquentes : mêmes réponses que les données structurées de la page */}
      <section className="max-w-3xl mx-auto space-y-6" aria-labelledby="faq-titre">
        <div className="text-center space-y-2">
          <h2 id="faq-titre" className="font-serif text-3xl font-bold text-dark">
            Questions fréquentes
          </h2>
          <p className="text-sm text-muted">Livraison, retrait à l&apos;atelier, sur-mesure et entretien.</p>
        </div>
        <div className="space-y-3">
          {faq.map((entry) => (
            <details
              key={entry.question}
              className="group rounded-2xl bg-white border border-rose-powder/30 open:shadow-xs transition-shadow"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-4 sm:p-5 text-sm font-semibold text-dark [&::-webkit-details-marker]:hidden">
                <h3 className="font-semibold">{entry.question}</h3>
                <span className="text-plum text-lg leading-none shrink-0 transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted leading-relaxed">{entry.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
