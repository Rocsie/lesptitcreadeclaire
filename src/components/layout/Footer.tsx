'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ShieldCheck, HeartHandshake, Sparkles, CheckCircle2 } from 'lucide-react';
import OctopusLogo from '@/components/brand/OctopusLogo';
import { FloralDivider, HandDrawnHeart } from '@/components/brand/FloralAccents';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setNewsletterStatus('success');
        setEmail('');
      } else {
        setNewsletterStatus('error');
      }
    } catch {
      setNewsletterStatus('success');
      setEmail('');
    }
  };

  return (
    <footer className="bg-cream-warm border-t border-rose-powder/30 pt-16 pb-8 relative overflow-hidden">
      {/* Réassurance artisanale en haut du footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-2xl bg-white/70 border border-rose-powder/20 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center text-plum shrink-0">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-dark uppercase tracking-wider">Fait main avec amour</h4>
              <p className="text-[11px] text-muted">Créations originales façonnées à l&apos;atelier</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center text-plum shrink-0">
              <MapPin className="w-5 h-5 text-eucalyptus" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-dark uppercase tracking-wider">Créatrice locale</h4>
              <p className="text-[11px] text-muted">Atelier-boutique à Port-la-Nouvelle</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center text-plum shrink-0">
              <HeartHandshake className="w-5 h-5 text-rose-old" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-dark uppercase tracking-wider">Pièces uniques & séries</h4>
              <p className="text-[11px] text-muted">Des bijoux rares qui ont une âme</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center text-plum shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold-soft" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-dark uppercase tracking-wider">Paiement 100% sécurisé</h4>
              <p className="text-[11px] text-muted">CB, Stripe & Retrait atelier gratuit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-rose-powder/20">
          {/* Colonne 1 : Identité */}
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
            <div className="flex items-center gap-3 pt-2 text-plum">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-rose-powder/30 hover:bg-rose-powder/60 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-rose-powder/30 hover:bg-rose-powder/60 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Colonne 2 : Horaires d'Hiver de L'Atelier */}
          <div>
            <h3 className="font-serif text-lg font-bold text-dark mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-plum" />
              <span>Horaires de la Boutique</span>
            </h3>
            <div className="space-y-2.5 text-xs text-dark/80 bg-white/50 p-4 rounded-xl border border-rose-powder/20">
              <div className="flex justify-between border-b border-rose-powder/15 pb-1.5">
                <span className="font-semibold text-plum">Lundi - Mardi</span>
                <span>10 h - 12 h / 14 h - 17 h</span>
              </div>
              <div className="flex justify-between border-b border-rose-powder/15 pb-1.5">
                <span className="font-semibold text-plum">Mercredi - Samedi</span>
                <span>10 h - 12 h / 15 h - 18 h 30</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-plum">Dimanche</span>
                <span>10 h - 12 h / 14 h - 17 h</span>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-2 italic flex items-center gap-1">
              <HandDrawnHeart size={12} color="rose" /> Retrait gratuit des commandes en boutique pendant ces horaires.
            </p>
          </div>

          {/* Colonne 3 : Liens & Navigation */}
          <div>
            <h3 className="font-serif text-lg font-bold text-dark mb-4">Découvrir</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link href="/boutique" className="hover:text-plum transition-colors">
                  Toutes nos créations
                </Link>
              </li>
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
                <Link href="/admin" className="text-plum/80 hover:text-plum font-medium">
                  Espace Gestionnaire (Admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Newsletter de l'Atelier */}
          <div>
            <h3 className="font-serif text-lg font-bold text-dark mb-2">Les Nouvelles de Claire</h3>
            <p className="text-xs text-muted mb-4">
              Recevez les avant-premières des nouvelles collections et les ouvertures d&apos;ateliers privés.
            </p>
            {newsletterStatus === 'success' ? (
              <div className="p-3 bg-sage/20 border border-sage/40 rounded-xl text-xs text-eucalyptus flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />
                <span>Merci ! Vous êtes inscrite à notre douce lettre d&apos;atelier.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white rounded-lg border border-rose-powder/40 focus:outline-none focus:border-plum"
                />
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                >
                  S&apos;inscrire
                </button>
                <p className="text-[10px] text-muted/70">
                  En vous inscrivant, vous acceptez de recevoir nos e-mails. Désinscription facile à tout moment.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Coordonnées & Port-la-Nouvelle */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted border-b border-rose-powder/15">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold" /> Boutique L&apos;Atelier, 11210 Port-la-Nouvelle
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-plum" /> 04 68 00 00 00
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-rose-old" /> contact@lesptitescreadeclaire.fr
            </span>
          </div>
          <div className="text-[11px] text-dark/70">
            Artisanat d&apos;art • Bijouterie fantaisie haut de gamme en Occitanie
          </div>
        </div>

        {/* Mentions légales et copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted/80">
          <p>© 2026 Les P&apos;tites Créa de Claire. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-4">
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
          </div>
        </div>
      </div>
    </footer>
  );
}
