import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import OctopusLogo from '@/components/brand/OctopusLogo';
import { HandDrawnHeart } from '@/components/brand/FloralAccents';
import MadeByOcDigital from '@/components/brand/MadeByOcDigital';
import NewsletterForm from './NewsletterForm';
import { socialProfileUrl } from '@/lib/seo';
import type { Category, OpeningHour } from '@/lib/types';

interface FooterProps {
  hours: OpeningHour[];
  cms: Record<string, string>;
  categories: Category[];
}

function formatHours(h: OpeningHour): string {
  if (h.isClosed) return 'Fermé';
  return [h.morningHours, h.afternoonHours].filter(Boolean).join(' / ') || 'Sur rendez-vous';
}

// Horaires, coordonnées et réseaux viennent de l'administration (Contenu du site, Horaires).
export default function Footer({ hours, cms, categories }: FooterProps) {
  // Seuls de vrais profils sont affichés : un lien vers la page d'accueil d'Instagram ne sert à rien.
  const instagram = socialProfileUrl(cms.instagram_url);
  const facebook = socialProfileUrl(cms.facebook_url);
  const phone = cms.contact_phone?.trim();
  const email = cms.contact_email?.trim();
  const address = cms.contact_address?.trim() || "Boutique L'Atelier, 11210 Port-la-Nouvelle";

  return (
    <footer className="bg-cream-warm border-t border-rose-powder/30 pt-16 pb-8 relative overflow-hidden">
      {/* Réassurance artisanale en haut du footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-2xl bg-white/70 border border-rose-powder/20 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center text-plum shrink-0">
              <Sparkles className="w-5 h-5 text-gold" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark uppercase tracking-wider">Fait main avec amour</p>
              <p className="text-[11px] text-muted">Créations originales façonnées à l&apos;atelier</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center text-plum shrink-0">
              <MapPin className="w-5 h-5 text-eucalyptus" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark uppercase tracking-wider">Créatrice locale</p>
              <p className="text-[11px] text-muted">Atelier-boutique à Port-la-Nouvelle</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center text-plum shrink-0">
              <HeartHandshake className="w-5 h-5 text-rose-old" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark uppercase tracking-wider">Pièces uniques & séries</p>
              <p className="text-[11px] text-muted">Des bijoux rares qui ont une âme</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center text-plum shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold-soft" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark uppercase tracking-wider">Paiement sécurisé</p>
              <p className="text-[11px] text-muted">Carte bancaire, retrait gratuit à l&apos;atelier</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-rose-powder/20">
          {/* Identité */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <OctopusLogo size={42} variant="plum" />
              <div>
                <span className="font-script text-2xl text-plum block leading-tight">L&apos;Atelier</span>
                <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-dark">
                  Les P&apos;tites Créa de Claire
                </span>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Bijoux artisanaux, montures fines, résines pailletées et inspirations du littoral méditerranéen. Imaginés et réalisés à la main dans notre atelier à Port-la-Nouvelle.
            </p>
            {(instagram || facebook) && (
              <div className="flex items-center gap-3 pt-2 text-plum">
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-rose-powder/30 hover:bg-rose-powder/60 flex items-center justify-center transition-colors"
                    aria-label="Instagram (nouvel onglet)"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-rose-powder/30 hover:bg-rose-powder/60 flex items-center justify-center transition-colors"
                    aria-label="Facebook (nouvel onglet)"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Horaires */}
          <div>
            <h3 className="font-serif text-lg font-bold text-dark mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-plum" aria-hidden="true" />
              <span>Horaires de la Boutique</span>
            </h3>
            <div className="space-y-2.5 text-xs text-dark/80 bg-white/50 p-4 rounded-xl border border-rose-powder/20">
              {hours.length === 0 && <p className="text-muted">Horaires communiqués à la boutique.</p>}
              {hours.map((h, i) => (
                <div
                  key={h.id}
                  className={`flex justify-between gap-3 ${i < hours.length - 1 ? 'border-b border-rose-powder/15 pb-1.5' : ''}`}
                >
                  <span className="font-semibold text-plum">{h.dayGroup}</span>
                  <span className="text-right">{formatHours(h)}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted mt-2 italic flex items-center gap-1">
              <HandDrawnHeart size={12} color="rose" /> Retrait gratuit des commandes en boutique pendant ces horaires.
            </p>
          </div>

          {/* Liens */}
          <div>
            <h3 className="font-serif text-lg font-bold text-dark mb-4">Découvrir</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link href="/boutique" className="hover:text-plum transition-colors">
                  Toutes nos créations
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/boutique/${category.slug}`} className="hover:text-plum transition-colors">
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/boutique?filtre=nouveautes" className="hover:text-plum transition-colors">
                  Les petites nouveautés
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-plum transition-colors">
                  Collections & thématiques
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="hover:text-plum transition-colors">
                  L&apos;histoire de l&apos;Atelier & Claire
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-plum transition-colors">
                  Nous contacter & localisation
                </Link>
              </li>
              <li>
                <Link href="/compte" className="hover:text-plum transition-colors">
                  Mon compte
                </Link>
              </li>
            </ul>
          </div>

          {/* Lettre d'information */}
          <div>
            <h3 className="font-serif text-lg font-bold text-dark mb-2">Les Nouvelles de Claire</h3>
            <p className="text-xs text-muted mb-4">
              Recevez les avant-premières des nouvelles collections et les actualités de l&apos;atelier.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Coordonnées */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted border-b border-rose-powder/15">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold" aria-hidden="true" /> {address}
            </span>
            {phone && (
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:text-plum transition-colors">
                <Phone className="w-3.5 h-3.5 text-plum" aria-hidden="true" /> {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-plum transition-colors">
                <Mail className="w-3.5 h-3.5 text-rose-old" aria-hidden="true" /> {email}
              </a>
            )}
          </div>
          <div className="text-[11px] text-dark/70">Artisanat d&apos;art • Bijouterie fantaisie en Occitanie</div>
        </div>

        {/* Mentions légales et copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted/80">
          <p>© {new Date().getFullYear()} Les P&apos;tites Créa de Claire. Tous droits réservés.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/mentions-legales" className="hover:text-plum transition-colors">
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-plum transition-colors">
              CGV
            </Link>
            <Link href="/confidentialite" className="hover:text-plum transition-colors">
              Confidentialité & RGPD
            </Link>
            <Link href="/cookies" className="hover:text-plum transition-colors">
              Gestion des cookies
            </Link>
            <Link href="/admin" className="hover:text-plum transition-colors">
              Espace gestionnaire
            </Link>
          </div>
        </div>

        {/* Signature du studio qui a réalisé le site */}
        <div className="mt-6 pt-5 border-t border-rose-powder/15 flex justify-center">
          <MadeByOcDigital background="var(--color-cream-warm)" className="text-[11px] text-muted" />
        </div>
      </div>
    </footer>
  );
}
