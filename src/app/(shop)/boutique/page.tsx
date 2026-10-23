'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal, Search, Sparkles, X, ChevronDown } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { Product, Category, Collection } from '@/lib/store';
import { FloralDivider } from '@/components/brand/FloralAccents';

function BoutiqueContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('categorie');
  const initialFilter = searchParams.get('filtre');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(100);
  const [onlyUniquePieces, setOnlyUniquePieces] = useState<boolean>(false);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>(initialFilter === 'nouveautes' ? 'newest' : 'popular');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/collections').then((r) => r.json()),
    ])
      .then(([prods, cats, cols]) => {
        if (Array.isArray(prods)) setProducts(prods);
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(cols)) setCollections(cols);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
    if (initialFilter === 'nouveautes') {
      setSortBy('newest');
    }
  }, [initialCategory, initialFilter]);

  // Filtrage et tri
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Catégorie
        if (selectedCategory !== 'all') {
          const cat = categories.find((c) => c.slug === selectedCategory);
          if (cat && p.categoryId !== cat.id) return false;
        }
        // Collection
        if (selectedCollection !== 'all') {
          const col = collections.find((c) => c.slug === selectedCollection);
          if (col && p.collectionId !== col.id) return false;
        }
        // Prix max
        if (p.price > priceRange) return false;
        // Pièce unique
        if (onlyUniquePieces && !p.isUniquePiece) return false;
        // En stock
        if (onlyInStock && p.stock <= 0) return false;
        // Recherche textuelle
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.shortDescription?.toLowerCase().includes(q);
          const matchMat = p.materials?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchMat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        return b.viewsCount - a.viewsCount; // Popularité
      });
  }, [
    products,
    categories,
    collections,
    selectedCategory,
    selectedCollection,
    priceRange,
    onlyUniquePieces,
    onlyInStock,
    searchQuery,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedCollection('all');
    setPriceRange(100);
    setOnlyUniquePieces(false);
    setOnlyInStock(false);
    setSearchQuery('');
    setSortBy('popular');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* En-tête de la page Boutique */}
      <div className="text-center space-y-3 mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-plum">
          Nos Créations Façon Atelier
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-dark">
          La Boutique
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto">
          Bijoux colorés, pièces uniques & petites séries façonnées à la main à Port-la-Nouvelle.
        </p>
        <FloralDivider />
      </div>

      {/* Barre de contrôle supérieure : Recherche, Tri & Bouton Filtre Mobile */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-rose-powder/30 shadow-xs mb-8">
        {/* Recherche instantanée */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher une création..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-cream-warm rounded-full border border-rose-powder/40 focus:outline-none focus:border-plum"
          />
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          {/* Bouton pour ouvrir filtres sur mobile */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center justify-center gap-1.5 px-4 py-2 min-h-[42px] rounded-full bg-rose-light text-plum text-xs font-semibold active:scale-95 transition-all shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtres</span>
          </button>

          {/* Sélecteur de Tri */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted hidden sm:inline">Trier par :</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-cream-warm border border-rose-powder/40 rounded-full px-4 py-2 min-h-[42px] pr-8 text-xs font-medium text-dark focus:outline-none focus:border-plum"
              >
                <option value="popular">Popularité</option>
                <option value="newest">Nouveautés d&apos;abord</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres rapides sous forme de pilules défilantes sur mobile */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 -mx-4 px-4 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 shadow-2xs ${
            selectedCategory === 'all'
              ? 'bg-plum text-white shadow-xs'
              : 'bg-white border border-rose-powder/40 text-dark/80'
          }`}
        >
          Toutes ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 shadow-2xs ${
              selectedCategory === cat.slug
                ? 'bg-plum text-white shadow-xs'
                : 'bg-white border border-rose-powder/40 text-dark/80'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Layout principal : Filtres à gauche, Grille de produits à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

        {/* Sidebar Filtres Desktop */}
        <aside className="hidden lg:block bg-white p-6 rounded-2xl border border-rose-powder/30 shadow-xs space-y-6 sticky top-28">
          <div className="flex items-center justify-between pb-4 border-b border-rose-powder/20">
            <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
              <Filter className="w-4 h-4 text-plum" />
              <span>Filtres</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-rose-old hover:text-plum transition-colors"
            >
              Réinitialiser
            </button>
          </div>

          {/* Catégories */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark">Catégories</h4>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors flex justify-between items-center ${
                  selectedCategory === 'all'
                    ? 'bg-rose-powder/30 text-plum font-bold'
                    : 'text-dark/80 hover:bg-cream-warm'
                }`}
              >
                <span>Toutes les catégories</span>
                <span className="text-[10px] text-muted">{products.length}</span>
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors flex justify-between items-center ${
                      selectedCategory === cat.slug
                        ? 'bg-rose-powder/30 text-plum font-bold'
                        : 'text-dark/80 hover:bg-cream-warm'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-muted">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collections */}
          <div className="space-y-2.5 pt-4 border-t border-rose-powder/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark">Collections</h4>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCollection('all')}
                className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors ${
                  selectedCollection === 'all'
                    ? 'bg-rose-powder/30 text-plum font-bold'
                    : 'text-dark/80 hover:bg-cream-warm'
                }`}
              >
                Toutes les collections
              </button>
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollection(col.slug)}
                  className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors ${
                    selectedCollection === col.slug
                      ? 'bg-rose-powder/30 text-plum font-bold'
                      : 'text-dark/80 hover:bg-cream-warm'
                  }`}
                >
                  {col.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filtre Prix max */}
          <div className="space-y-2.5 pt-4 border-t border-rose-powder/20">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-dark">Prix maximum</span>
              <span className="font-bold text-plum">{priceRange} €</span>
            </div>
            <input
              type="range"
              min="15"
              max="100"
              step="5"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-plum"
            />
          </div>

          {/* Disponibilité & Spécificités */}
          <div className="space-y-3 pt-4 border-t border-rose-powder/20 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer text-dark/90">
              <input
                type="checkbox"
                checked={onlyUniquePieces}
                onChange={(e) => setOnlyUniquePieces(e.target.checked)}
                className="rounded accent-plum text-plum"
              />
              <span>Pièces uniques uniquement</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-dark/90">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded accent-plum text-plum"
              />
              <span>En stock uniquement</span>
            </label>
          </div>
        </aside>

        {/* Grille des produits */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4 text-xs text-muted">
            <span>
              {filteredProducts.length} {filteredProducts.length > 1 ? 'créations trouvées' : 'création trouvée'}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-rose-powder/30 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-light flex items-center justify-center text-plum">
                <Sparkles className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="font-serif text-xl font-bold text-dark">
                Aucune création ne correspond à vos filtres
              </h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                Essayez d&apos;élargir vos critères de prix ou de réinitialiser les filtres pour découvrir l&apos;ensemble de la collection.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-full bg-plum text-white text-xs font-semibold uppercase tracking-wider hover:bg-plum-dark transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Filtres Mobile complet & tactile */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setMobileFiltersOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />
          <div className="relative w-4/5 max-w-sm bg-cream p-5 sm:p-6 ml-auto h-full max-h-[100dvh] overflow-y-auto space-y-6 shadow-2xl z-10 animate-in slide-in-from-right duration-200 pb-12">
            <div className="flex items-center justify-between pb-4 border-b border-rose-powder/20">
              <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-plum" />
                <span>Tous les filtres</span>
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-powder/20 text-dark/80 active:scale-95 transition-all"
                aria-label="Fermer les filtres"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Catégories mobile */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-dark">Catégories</h4>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left text-xs py-2.5 px-3.5 rounded-xl transition-all ${
                  selectedCategory === 'all' ? 'bg-plum text-white font-bold' : 'bg-white text-dark/80'
                }`}
              >
                Toutes les catégories ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left text-xs py-2.5 px-3.5 rounded-xl transition-all ${
                    selectedCategory === cat.slug ? 'bg-plum text-white font-bold' : 'bg-white text-dark/80'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Collections mobile */}
            <div className="space-y-2 pt-3 border-t border-rose-powder/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-dark">Collections</h4>
              <button
                onClick={() => setSelectedCollection('all')}
                className={`w-full text-left text-xs py-2.5 px-3.5 rounded-xl transition-all ${
                  selectedCollection === 'all' ? 'bg-plum text-white font-bold' : 'bg-white text-dark/80'
                }`}
              >
                Toutes les collections
              </button>
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollection(col.slug)}
                  className={`w-full text-left text-xs py-2.5 px-3.5 rounded-xl transition-all ${
                    selectedCollection === col.slug ? 'bg-plum text-white font-bold' : 'bg-white text-dark/80'
                  }`}
                >
                  {col.name}
                </button>
              ))}
            </div>

            {/* Prix mobile */}
            <div className="space-y-2 pt-3 border-t border-rose-powder/20">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-dark uppercase">Budget max</span>
                <span className="font-bold text-plum font-serif text-sm">{priceRange} €</span>
              </div>
              <input
                type="range"
                min="15"
                max="100"
                step="5"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-plum"
              />
            </div>

            {/* Options mobile */}
            <div className="space-y-3 pt-3 border-t border-rose-powder/20">
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={onlyUniquePieces}
                  onChange={(e) => setOnlyUniquePieces(e.target.checked)}
                  className="w-4 h-4 rounded text-plum"
                />
                <span className="font-medium text-dark">Pièces uniques seulement</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded text-plum"
                />
                <span className="font-medium text-dark">En stock uniquement</span>
              </label>
            </div>

            <div className="flex flex-col gap-2.5 pt-4 border-t border-rose-powder/20 pb-4">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full min-h-[46px] py-3 rounded-full bg-plum text-white font-semibold text-xs active:scale-95 shadow-md flex items-center justify-center transition-all"
              >
                Voir les {filteredProducts.length} créations
              </button>
              <button
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

export default function BoutiquePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="w-10 h-10 border-3 border-rose-powder border-t-plum rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif text-lg text-dark">Chargement de la boutique...</p>
        </div>
      }
    >
      <BoutiqueContent />
    </Suspense>
  );
}
