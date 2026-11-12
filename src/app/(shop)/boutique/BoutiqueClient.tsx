'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal, Search, Sparkles, X, ChevronDown, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import type { Product, Category, Collection } from '@/lib/types';
import { FloralDivider } from '@/components/brand/FloralAccents';

export interface BoutiqueProps {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  /** Rayon affiché, fixé par l'adresse de la page (/boutique/bagues). */
  activeCategory?: string | null;
  /** Collection présélectionnée (/collections/esprit-marin). */
  initialCollection?: string | null;
  heading: { eyebrow: string; title: string; intro: string };
  /** Fil d'Ariane affiché au-dessus du titre sur les pages de rayon et de collection. */
  breadcrumb?: Array<{ name: string; path?: string }>;
}

const categoryHref = (slug: string | null) => (slug ? `/boutique/${slug}` : '/boutique');

function BoutiqueContent({
  products,
  categories,
  collections,
  activeCategory = null,
  initialCollection = null,
  heading,
  breadcrumb,
}: BoutiqueProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filtre');

  // Le curseur de prix couvre tout le catalogue : aucune création n'est cachée par défaut.
  const maxPrice = useMemo(
    () => Math.max(100, Math.ceil(Math.max(0, ...products.map((p) => p.price)) / 5) * 5),
    [products]
  );

  const [selectedCollection, setSelectedCollection] = useState<string>(initialCollection || 'all');
  const [priceRange, setPriceRange] = useState<number>(maxPrice);
  const [onlyUniquePieces, setOnlyUniquePieces] = useState<boolean>(false);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyNew, setOnlyNew] = useState<boolean>(initialFilter === 'nouveautes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>(initialFilter === 'nouveautes' ? 'newest' : 'popular');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const category = activeCategory ? categories.find((c) => c.slug === activeCategory) : null;
  const inCategory = useMemo(
    () => (category ? products.filter((p) => p.categoryId === category.id) : products),
    [products, category]
  );

  const filteredProducts = useMemo(() => {
    const collection = selectedCollection !== 'all' ? collections.find((c) => c.slug === selectedCollection) : null;
    const q = searchQuery.trim().toLowerCase();
    return inCategory
      .filter((p) => {
        if (collection && p.collectionId !== collection.id) return false;
        if (p.price > priceRange) return false;
        if (onlyNew && !p.isNew) return false;
        if (onlyUniquePieces && !p.isUniquePiece) return false;
        if (onlyInStock && p.stock <= 0) return false;
        if (q) {
          const haystack = `${p.name} ${p.shortDescription || ''} ${p.materials || ''}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') {
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.createdAt.localeCompare(a.createdAt);
        }
        return b.viewsCount - a.viewsCount; // popularité
      });
  }, [inCategory, collections, selectedCollection, priceRange, onlyUniquePieces, onlyInStock, onlyNew, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCollection('all');
    setPriceRange(maxPrice);
    setOnlyUniquePieces(false);
    setOnlyInStock(false);
    setOnlyNew(false);
    setSearchQuery('');
    setSortBy('popular');
    if (activeCategory) router.push('/boutique');
  };

  const title = !activeCategory && !initialCollection && onlyNew ? 'Les Nouveautés' : heading.title;

  // Les rayons sont de vrais liens : chaque rayon a sa propre page, lisible par les moteurs de recherche.
  const categoryLinks = (variant: 'pill' | 'side' | 'sheet') => {
    const entries: Array<{ slug: string | null; label: string; count: number }> = [
      { slug: null, label: variant === 'pill' ? 'Toutes' : 'Toutes les catégories', count: products.length },
      ...categories.map((c) => ({
        slug: c.slug,
        label: c.name,
        count: products.filter((p) => p.categoryId === c.id).length,
      })),
    ];
    return entries.map((entry) => {
      const active = (entry.slug || null) === (activeCategory || null);
      const key = entry.slug || 'all';
      const href = categoryHref(entry.slug);
      if (variant === 'pill') {
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 ${
              active ? 'bg-plum text-white shadow-xs' : 'bg-white border border-rose-powder/40 text-dark/80'
            }`}
          >
            {entry.label}
            {entry.slug === null ? ` (${entry.count})` : ''}
          </Link>
        );
      }
      if (variant === 'side') {
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors flex justify-between items-center ${
              active ? 'bg-rose-powder/30 text-plum font-bold' : 'text-dark/80 hover:bg-cream-warm'
            }`}
          >
            <span>{entry.label}</span>
            <span className="text-[10px] text-muted">{entry.count}</span>
          </Link>
        );
      }
      return (
        <Link
          key={key}
          href={href}
          aria-current={active ? 'page' : undefined}
          onClick={() => setMobileFiltersOpen(false)}
          className={`block w-full text-left text-xs py-2.5 px-3.5 rounded-xl transition-all ${
            active ? 'bg-plum text-white font-bold' : 'bg-white text-dark/80'
          }`}
        >
          {entry.label} ({entry.count})
        </Link>
      );
    });
  };

  const collectionButtons = (variant: 'side' | 'sheet') =>
    [{ slug: 'all', name: 'Toutes les collections' }, ...collections].map((col) => {
      const active = selectedCollection === col.slug;
      return (
        <button
          key={col.slug}
          type="button"
          aria-pressed={active}
          onClick={() => setSelectedCollection(col.slug)}
          className={
            variant === 'side'
              ? `w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors ${
                  active ? 'bg-rose-powder/30 text-plum font-bold' : 'text-dark/80 hover:bg-cream-warm'
                }`
              : `w-full text-left text-xs py-2.5 px-3.5 rounded-xl transition-all ${
                  active ? 'bg-plum text-white font-bold' : 'bg-white text-dark/80'
                }`
          }
        >
          {col.name}
        </button>
      );
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex flex-wrap items-center gap-2 text-xs text-muted mb-6" aria-label="Fil d'Ariane">
          {breadcrumb.map((item, i) => (
            <React.Fragment key={item.name}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />}
              {item.path ? (
                <Link href={item.path} className="hover:text-plum transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span className="text-dark font-medium" aria-current="page">
                  {item.name}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="text-center space-y-3 mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-plum">{heading.eyebrow}</span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-dark">{title}</h1>
        <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto">{heading.intro}</p>
        <FloralDivider />
      </div>

      {/* Recherche, tri et bouton filtres (mobile) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-rose-powder/30 shadow-xs mb-8">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            aria-label="Rechercher une création"
            placeholder="Rechercher une création..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-cream-warm rounded-full border border-rose-powder/40 focus:outline-none focus:border-plum"
          />
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center justify-center gap-1.5 px-4 py-2 min-h-[42px] rounded-full bg-rose-light text-plum text-xs font-semibold active:scale-95 transition-all shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Filtres</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted hidden sm:inline">Trier par :</span>
            <div className="relative">
              <select
                aria-label="Trier les créations"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-cream-warm border border-rose-powder/40 rounded-full px-4 py-2 min-h-[42px] pr-8 text-xs font-medium text-dark focus:outline-none focus:border-plum"
              >
                <option value="popular">Popularité</option>
                <option value="newest">Nouveautés d&apos;abord</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Rayons en pastilles défilantes (mobile) */}
      <nav className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 -mx-4 px-4 scrollbar-none" aria-label="Rayons">
        {categoryLinks('pill')}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Filtres (ordinateur) */}
        <aside className="hidden lg:block bg-white p-6 rounded-2xl border border-rose-powder/30 shadow-xs space-y-6 sticky top-28">
          <div className="flex items-center justify-between pb-4 border-b border-rose-powder/20">
            <h2 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
              <Filter className="w-4 h-4 text-plum" aria-hidden="true" />
              <span>Filtres</span>
            </h2>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-rose-old hover:text-plum transition-colors"
            >
              Réinitialiser
            </button>
          </div>

          <nav className="space-y-2.5" aria-label="Rayons">
            <h3 className="text-xs font-bold uppercase tracking-wider text-dark">Catégories</h3>
            <div className="space-y-1.5">{categoryLinks('side')}</div>
          </nav>

          {collections.length > 0 && (
            <div className="space-y-2.5 pt-4 border-t border-rose-powder/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-dark">Collections</h3>
              <div className="space-y-1.5">{collectionButtons('side')}</div>
            </div>
          )}

          <div className="space-y-2.5 pt-4 border-t border-rose-powder/20">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-dark">Prix maximum</span>
              <span className="font-bold text-plum">{priceRange} €</span>
            </div>
            <input
              type="range"
              aria-label="Prix maximum"
              min="15"
              max={maxPrice}
              step="5"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-plum"
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-rose-powder/20 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer text-dark/90">
              <input type="checkbox" checked={onlyUniquePieces} onChange={(e) => setOnlyUniquePieces(e.target.checked)} className="rounded accent-plum" />
              <span>Pièces uniques uniquement</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-dark/90">
              <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} className="rounded accent-plum" />
              <span>Nouveautés uniquement</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-dark/90">
              <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} className="rounded accent-plum" />
              <span>En stock uniquement</span>
            </label>
          </div>
        </aside>

        {/* Créations */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4 text-xs text-muted">
            <span>
              {filteredProducts.length} {filteredProducts.length > 1 ? 'créations trouvées' : 'création trouvée'}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-rose-powder/30 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-light flex items-center justify-center text-plum">
                <Sparkles className="w-8 h-8 opacity-60" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-xl font-bold text-dark">
                {inCategory.length === 0 ? 'Ce rayon se prépare à l’atelier' : 'Aucune création ne correspond à vos filtres'}
              </h2>
              <p className="text-xs text-muted max-w-md mx-auto">
                {inCategory.length === 0
                  ? 'Les prochaines créations de ce rayon arrivent bientôt. En attendant, toute la boutique reste à découvrir.'
                  : "Essayez d'élargir vos critères de prix ou de réinitialiser les filtres pour découvrir l'ensemble de la collection."}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-full bg-plum text-white text-xs font-semibold uppercase tracking-wider hover:bg-plum-dark transition-colors"
              >
                {inCategory.length === 0 ? 'Voir toute la boutique' : 'Réinitialiser les filtres'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} headingLevel="h2" eager={index < 3} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtres (mobile) */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Filtres">
          <div onClick={() => setMobileFiltersOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in" />
          <div className="relative w-4/5 max-w-sm bg-cream p-5 sm:p-6 ml-auto h-full max-h-[100dvh] overflow-y-auto space-y-6 shadow-2xl z-10 animate-in slide-in-from-right pb-12">
            <div className="flex items-center justify-between pb-4 border-b border-rose-powder/20">
              <h2 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-plum" aria-hidden="true" />
                <span>Tous les filtres</span>
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-powder/20 text-dark/80 active:scale-95 transition-all"
                aria-label="Fermer les filtres"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-2" aria-label="Rayons">
              <h3 className="text-xs font-bold uppercase tracking-wider text-dark">Catégories</h3>
              {categoryLinks('sheet')}
            </nav>

            {collections.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-rose-powder/20">
                <h3 className="text-xs font-bold uppercase tracking-wider text-dark">Collections</h3>
                {collectionButtons('sheet')}
              </div>
            )}

            <div className="space-y-2 pt-3 border-t border-rose-powder/20">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-dark uppercase">Budget max</span>
                <span className="font-bold text-plum font-serif text-sm">{priceRange} €</span>
              </div>
              <input
                type="range"
                aria-label="Budget maximum"
                min="15"
                max={maxPrice}
                step="5"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-plum"
              />
            </div>

            <div className="space-y-3 pt-3 border-t border-rose-powder/20">
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input type="checkbox" checked={onlyUniquePieces} onChange={(e) => setOnlyUniquePieces(e.target.checked)} className="w-4 h-4 rounded accent-plum" />
                <span className="font-medium text-dark">Pièces uniques seulement</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} className="w-4 h-4 rounded accent-plum" />
                <span className="font-medium text-dark">Nouveautés seulement</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} className="w-4 h-4 rounded accent-plum" />
                <span className="font-medium text-dark">En stock uniquement</span>
              </label>
            </div>

            <div className="flex flex-col gap-2.5 pt-4 border-t border-rose-powder/20 pb-4">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full min-h-[46px] py-3 rounded-full bg-plum text-white font-semibold text-xs active:scale-95 shadow-md flex items-center justify-center transition-all"
              >
                Voir les {filteredProducts.length} créations
              </button>
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setMobileFiltersOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 rounded-full bg-rose-powder/30 text-plum font-semibold text-xs active:scale-95 flex items-center justify-center transition-all"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// La clé remet les filtres à zéro quand on change de page ou de lien
// (Boutique, Nouveautés, un rayon, une collection) sans recharger le site.
function BoutiqueKeyed(props: BoutiqueProps) {
  const searchParams = useSearchParams();
  return (
    <BoutiqueContent
      key={`${props.activeCategory || ''}|${props.initialCollection || ''}|${searchParams.toString()}`}
      {...props}
    />
  );
}

export default function BoutiqueClient(props: BoutiqueProps) {
  return (
    <React.Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-24" />}>
      <BoutiqueKeyed {...props} />
    </React.Suspense>
  );
}
