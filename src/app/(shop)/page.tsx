import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowRight, MapPin, Gem } from 'lucide-react';
import { store } from '@/lib/store';
import ProductCard from '@/components/product/ProductCard';
import OctopusLogo from '@/components/brand/OctopusLogo';
import { FloralCorner, WatercolorBrush, FloralDivider, HandDrawnHeart } from '@/components/brand/FloralAccents';
import ShopImage from '@/components/ui/ShopImage';
import JsonLd from '@/components/seo/JsonLd';
import { localBusinessJsonLd, pageMetadata, websiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: "Bijoux artisanaux à Port-la-Nouvelle | Les P'tites Créa de Claire",
  absoluteTitle: true,
  description:
    "Bijoux faits main à Port-la-Nouvelle (Aude) : boucles d'oreilles, bagues, broches et colliers en pièces uniques et petites séries. Retrait gratuit à l'atelier.",
  path: '/',
});

export default async function HomePage() {
  const [products, categories, hours, cms] = await Promise.all([
    store.getVisibleProducts(),
    store.getCategories(),
    store.getOpeningHours(),
    store.getCmsSettings(),
  ]);

  // Les nouveautés d'abord, puis les créations les plus récentes pour compléter la rangée.
  const byDate = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const newProducts = [...byDate.filter((p) => p.isNew), ...byDate.filter((p) => !p.isNew)].slice(0, 4);
  const exceptionalNotice = cms.exceptional_notice?.trim();

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 overflow-hidden">
      <JsonLd data={localBusinessJsonLd(cms, hours, products)} />
      <JsonLd data={websiteJsonLd()} />
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] sm:min-h-[88vh] flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-cream via-cream-warm to-cream">
        {/* Sur téléphone, les rameaux décoratifs passeraient par-dessus le texte : ils sont masqués. */}
        <FloralCorner position="top-left" className="top-2 left-2 hidden sm:block" />
        <FloralCorner position="top-right" className="top-2 right-2 hidden sm:block" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Colonne texte Hero */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-powder/30 border border-rose-powder/50 text-plum text-xs sm:text-sm font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>{cms.hero_badge || "Créations artisanales • Pièces uniques & petites séries • Port-la-Nouvelle"}</span>
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-dark font-bold leading-tight">
                {cms.hero_title || "Des créations uniques, imaginées et réalisées avec passion."}
              </h1>
              <div className="hidden sm:block">
                <WatercolorBrush className="w-64 max-w-full" />
              </div>
            </div>

            <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
              {cms.hero_subtitle || "Chaque bijou est façonné avec soin au cœur de notre atelier à Port-la-Nouvelle. Des pièces originales, étincelantes et colorées qui célèbrent la singularité de chacune."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/boutique"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-plum to-plum-dark text-white font-semibold text-sm tracking-wide shadow-md hover:shadow-xl hover:scale-105 transition-all text-center flex items-center justify-center gap-2 group"
              >
                <span>{cms.hero_cta_primary || "Découvrir la boutique"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/boutique?filtre=nouveautes"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-cream-warm border border-rose-powder/60 text-plum font-semibold text-sm tracking-wide transition-all text-center flex items-center justify-center gap-2 shadow-xs"
              >
                <span>{cms.hero_cta_secondary || "Voir les nouveautés"}</span>
                <Sparkles className="w-4 h-4 text-gold" />
              </Link>
            </div>

            {/* Note locale rassurante */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold" /> Atelier à Port-la-Nouvelle (11)
              </span>
              <span className="flex items-center gap-1.5">
                <HandDrawnHeart color="rose" size={14} /> Fait main en Occitanie
              </span>
            </div>
          </div>

          {/* Colonne visuelle Hero avec composition photographique & mascotte */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-4/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 group">
              <ShopImage
                src="/images/hero-atelier.jpg"
                alt="Boucles d'oreilles, bagues et broche artisanales des P'tites Créa de Claire"
                fill
                preload
                sizes="(min-width: 1024px) 448px, 92vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent" />

              {/* Badge flottant mascotte pieuvre en bas */}
              <div className="absolute bottom-4 inset-x-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-powder/40 shadow-lg flex items-center gap-3">
                <OctopusLogo size={42} variant="plum" />
                <div className="flex-1">
                  <span className="font-script text-xl text-plum block leading-tight">L&apos;Atelier</span>
                  <p className="text-[11px] text-dark/90 font-medium">
                    &quot;Des pièces rares façonnées avec minutie.&quot;
                  </p>
                </div>
                <Link
                  href="/boutique"
                  className="px-3 py-1.5 rounded-full bg-rose-light text-plum text-xs font-semibold hover:bg-plum hover:text-white transition-colors"
                >
                  Voir
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION NOUVEAUTÉS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-plum">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Fraîchement créées</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dark">
            Les Petites Nouveautés
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto">
            Découvrez les toutes dernières créations sorties de l&apos;établi : pièces uniques ou séries très limitées.
          </p>
          <FloralDivider />
        </div>

        {newProducts.length === 0 ? (
          <p className="text-center text-sm text-muted py-8">
            Les prochaines créations arrivent bientôt à l&apos;atelier.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/boutique"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-cream-warm hover:bg-white border border-rose-powder/50 text-plum font-semibold text-sm tracking-wide transition-all shadow-xs hover:shadow-md"
          >
            <span>Découvrir toutes les créations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 3. SECTION CATÉGORIES & COLLECTIONS */}
      <section className="bg-cream-warm/70 py-16 border-y border-rose-powder/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dark">
              Nos Univers & Catégories
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto">
              Boucles vibrantes, anneaux ciselés, broches étincelantes et trésors marins.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/boutique/${cat.slug}`}
                className="group flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-rose-powder/30 hover:border-gold/60 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-rose-powder/30 group-hover:border-plum transition-colors">
                  <ShopImage
                    src={cat.imageUrl}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-serif text-sm font-bold text-dark group-hover:text-plum transition-colors">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SECTION ARTISANAT : L'HISTOIRE DE CLAIRE & L'ATELIER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Photo de Claire à son établi */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/3 group">
              <ShopImage
                src="/images/claire-atelier.jpg"
                alt="Claire créatrice de bijoux artisanaux dans son atelier"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/40 via-transparent to-transparent" />
            </div>
            {/* Petit carton citation artisanal */}
            <div className="absolute -bottom-6 -right-4 sm:right-6 bg-cream p-4 rounded-2xl border border-rose-powder/40 shadow-xl max-w-xs hidden sm:block">
              <p className="font-script text-2xl text-plum mb-1 leading-none">Pièces avec une âme</p>
              <p className="text-[11px] text-muted">
                &quot;Chaque création est pensée pour garder ce qui fait tout son charme : sa précieuse singularité.&quot;
              </p>
            </div>
          </div>

          {/* Texte de l'Atelier */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-plum">
              <HandDrawnHeart color="rose" size={16} />
              <span>Savoir-faire & Authenticité</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dark leading-tight">
              Des créations faites avec passion à Port-la-Nouvelle
            </h2>

            <p className="text-sm sm:text-base text-muted leading-relaxed">
              {cms.about_story_text || "Chaque création est imaginée avec soin dans l'univers des P'tites Créa de Claire. Des bijoux originaux, colorés et réalisés en petites séries pour garder ce qui fait leur charme : leur singularité."}
            </p>

            <p className="text-sm text-muted leading-relaxed">
              Inspirée par la brise marine, le chatoiement des pierres fines et l&apos;éclat de la résine travaillée à la main, Claire façonne chaque détail avec minutie. Ici, pas de production de masse : chaque boucle d&apos;oreille, broche ou bague possède sa propre personnalité.
            </p>

            <div className="pt-2">
              <Link
                href="/a-propos"
                className="inline-flex items-center gap-2 text-sm font-semibold text-plum hover:text-plum-dark group"
              >
                <span>En savoir plus sur l&apos;histoire de l&apos;Atelier</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION VALEURS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-rose-powder/25 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-light flex items-center justify-center text-plum">
              <HandDrawnHeart color="plum" size={22} />
            </div>
            <h3 className="font-serif text-lg font-bold text-dark">Fait main</h3>
            <p className="text-xs text-muted leading-relaxed">
              Des créations délicatement réalisées à la main avec une exigence absolue de finition.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-rose-powder/25 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-light flex items-center justify-center text-plum">
              <Gem className="w-6 h-6 text-gold" />
            </div>
            <h3 className="font-serif text-lg font-bold text-dark">Pièces uniques</h3>
            <p className="text-xs text-muted leading-relaxed">
              Des modèles uniques ou disponibles en très petites séries pour vous sentir singulière.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-rose-powder/25 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-light flex items-center justify-center text-plum">
              <MapPin className="w-6 h-6 text-eucalyptus" />
            </div>
            <h3 className="font-serif text-lg font-bold text-dark">Créatrice locale</h3>
            <p className="text-xs text-muted leading-relaxed">
              Une boutique et un atelier d&apos;artisanat ancrés à Port-la-Nouvelle dans l&apos;Aude.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-rose-powder/25 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-light flex items-center justify-center text-plum">
              <Sparkles className="w-6 h-6 text-rose-old" />
            </div>
            <h3 className="font-serif text-lg font-bold text-dark">Créé avec passion</h3>
            <p className="text-xs text-muted leading-relaxed">
              Une attention chaleureuse portée à chaque gemme, fermoir et association de nuances.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CARTE HORAIRES & BOUTIQUE L'ATELIER (Fidèle aux affiches de Claire) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white via-cream-warm to-white border-2 border-rose-powder/40 shadow-xl text-center space-y-6 overflow-hidden">
          <FloralCorner position="top-left" className="top-1 left-1" />
          <FloralCorner position="top-right" className="top-1 right-1" />
          <FloralCorner position="bottom-left" className="bottom-1 left-1" />
          <FloralCorner position="bottom-right" className="bottom-1 right-1" />

          {/* En-tête affiche */}
          <div className="space-y-1">
            <span className="font-script text-3xl sm:text-4xl text-plum block">
              Boutique L&apos;Atelier
            </span>
            <span className="text-xs tracking-[0.25em] uppercase font-bold text-dark block">
              Les P&apos;tites Créa de Claire
            </span>
            <div className="flex justify-center my-2">
              <HandDrawnHeart color="gold" size={16} />
            </div>
          </div>

          {/* Bandeau Horaires d'Hiver */}
          <div className="inline-block relative">
            <span className="font-script text-3xl sm:text-4xl text-dark px-6 py-1.5 relative z-10 block">
              Horaires de la Boutique
            </span>
            <div className="absolute inset-0 bg-rose-powder/35 rounded-full -rotate-1 transform" />
          </div>

          <div className="flex justify-center">
            <HandDrawnHeart color="gold" size={14} />
          </div>

          {/* Cartouches horaires dynamiques */}
          <div className="max-w-lg mx-auto space-y-3.5">
            {hours.map((h) => (
              <div
                key={h.id}
                className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-white/90 border border-gold/40 shadow-xs hover:border-gold transition-colors"
              >
                <span className="font-script text-2xl text-plum">{h.dayGroup}</span>
                <span className="text-sm font-semibold text-dark mt-1 sm:mt-0">
                  {h.isClosed ? 'Fermé' : [h.morningHours, h.afternoonHours].filter(Boolean).join(' • ')}
                </span>
              </div>
            ))}
          </div>

          {exceptionalNotice && (
            <p className="max-w-lg mx-auto px-4 py-3 rounded-2xl bg-rose-light border border-rose-powder/50 text-sm text-plum font-medium">
              {exceptionalNotice}
            </p>
          )}

          {/* Mascotte pieuvre & signature */}
          <div className="pt-4 flex flex-col items-center justify-center space-y-2">
            <OctopusLogo size={52} variant="plum" />
            <span className="font-script text-2xl text-plum leading-none">L&apos;Atelier</span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-muted font-bold">
              Port-la-Nouvelle
            </span>
          </div>

          {/* Bouton contact & itinéraire */}
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-gold" />
              <span>Nous trouver à Port-la-Nouvelle</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
