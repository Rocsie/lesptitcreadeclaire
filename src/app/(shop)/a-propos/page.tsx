import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowRight, Gem } from 'lucide-react';
import OctopusLogo from '@/components/brand/OctopusLogo';
import { FloralCorner, FloralDivider, HandDrawnHeart } from '@/components/brand/FloralAccents';
import ShopImage from '@/components/ui/ShopImage';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, localBusinessJsonLd, pageMetadata } from '@/lib/seo';
import { store } from '@/lib/store';

export const metadata: Metadata = pageMetadata({
  title: "L'atelier de Claire, créatrice de bijoux à Port-la-Nouvelle",
  absoluteTitle: true,
  description:
    "L'histoire des P'tites Créa de Claire : un atelier-boutique de bijoux faits main à Port-la-Nouvelle, entre mer, lagunes et garrigue.",
  path: '/a-propos',
  image: '/images/claire-atelier.jpg',
});

export default async function AboutPage() {
  const [cms, hours] = await Promise.all([store.getCmsSettings(), store.getOpeningHours()]);
  const storyTitle = cms.about_story_title?.trim() || "L'Histoire des P'tites Créa de Claire";
  const storyText = cms.about_story_text?.trim();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16">
      <JsonLd data={localBusinessJsonLd(cms, hours)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Accueil', path: '/' },
          { name: "L'atelier et Claire", path: '/a-propos' },
        ])}
      />
      {/* En-tête */}
      <div className="text-center space-y-3 relative">
        <FloralCorner position="top-left" className="-top-6 left-0" />
        <FloralCorner position="top-right" className="-top-6 right-0" />

        <OctopusLogo size={56} variant="plum" className="justify-center mx-auto mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest text-plum">
          Au cœur de notre savoir-faire
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-dark">{storyTitle}</h1>
        <p className="text-sm text-muted max-w-xl mx-auto font-light">
          Une aventure artisanale née de l&apos;amour des belles matières, des couleurs vibrantes et du littoral audois.
        </p>
        <FloralDivider />
      </div>

      {/* Récit & Photo Atelier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/3 group">
            <ShopImage
              src="/images/claire-atelier.jpg"
              alt="Claire à son établi d'artisan bijoutier"
              fill
              preload
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4 text-sm text-muted leading-relaxed">
          <h2 className="font-serif text-2xl font-bold text-dark">
            Bienvenue dans l&apos;Atelier à Port-la-Nouvelle
          </h2>
          {storyText ? (
            <p className="whitespace-pre-line">{storyText}</p>
          ) : (
            <p>
              Nichée entre mer Méditerranée, lagunes et garrigues de l&apos;Aude, la boutique <strong>L&apos;Atelier, Les P&apos;tites Créa de Claire</strong> est née d&apos;une passion authentique : imaginer des bijoux qui ont une âme et apportent de la joie au quotidien.
            </p>
          )}
          <p>
            Chaque modèle est pensé et façonné à la main. Qu&apos;il s&apos;agisse de résines travaillées avec des poudres étincelantes, de cristaux facettés captant la lumière du sud ou de broches poétiques inspirées par les créatures marines, chaque pièce est le fruit d&apos;heures de minutie.
          </p>
          <div className="p-4 rounded-2xl bg-cream-warm border border-rose-powder/30 italic text-dark text-xs flex items-center gap-2">
            <HandDrawnHeart color="rose" size={16} />
            <span>
              &quot;Je privilégie les pièces uniques ou les petites séries pour que chacune de mes créations reste rare et singulière.&quot; Claire
            </span>
          </div>
        </div>
      </div>

      {/* Nos Engagements Artisanaux */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-rose-powder/30 shadow-sm space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-plum">Ce qui nous anime</span>
          <h2 className="font-serif text-3xl font-bold text-dark">Nos Valeurs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-cream-warm/70 space-y-2">
            <HandDrawnHeart color="plum" size={24} className="mx-auto" />
            <h3 className="font-serif text-base font-bold text-dark">100% Fait Main</h3>
            <p className="text-xs text-muted">
              Assemblage, coulage de résine, choix des pierres et finitions réalisés individuellement à l&apos;atelier.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-cream-warm/70 space-y-2">
            <Gem className="w-6 h-6 text-gold mx-auto" />
            <h3 className="font-serif text-base font-bold text-dark">Singularité & Petites Séries</h3>
            <p className="text-xs text-muted">
              Pas de bijoux standardisés. Nous célébrons l&apos;originalité et la personnalité unique de chaque femme.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-cream-warm/70 space-y-2">
            <MapPin className="w-6 h-6 text-eucalyptus mx-auto" />
            <h3 className="font-serif text-base font-bold text-dark">Boutique Locale Ouverte</h3>
            <p className="text-xs text-muted">
              Un lieu chaleureux à Port-la-Nouvelle où vous pouvez venir échanger, essayer et retirer vos commandes.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          href="/boutique"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md"
        >
          <span>Découvrir nos créations faites main</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
