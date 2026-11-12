'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { useHydrated } from '@/lib/local-store';
import type { Product } from '@/lib/types';
import ProductCard from '@/components/product/ProductCard';

export default function FavoritesClient({ products }: { products: Product[] }) {
  const { favorites } = useFavorites();
  const hydrated = useHydrated();
  const liked = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/boutique"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-cream-warm hover:bg-rose-powder/30 text-dark transition-colors"
          aria-label="Retour à la boutique"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark flex items-center gap-2">
            <span>Mes Favoris</span>
            <Heart className="w-6 h-6 text-rose-old fill-current" aria-hidden="true" />
          </h1>
          <p className="text-xs text-muted">Vos coups de cœur, gardés sur cet appareil.</p>
        </div>
      </div>

      {!hydrated ? (
        <div className="py-20" aria-busy="true" />
      ) : liked.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-rose-powder/30 space-y-4 max-w-lg mx-auto">
          <Heart className="w-12 h-12 text-rose-powder mx-auto" aria-hidden="true" />
          <h2 className="font-serif text-xl font-bold text-dark">Votre liste de favoris est vide</h2>
          <p className="text-xs text-muted">
            Touchez le petit cœur d&apos;un bijou pour le garder de côté et le retrouver ici.
          </p>
          <Link
            href="/boutique"
            className="inline-block px-8 py-3 rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Explorer la boutique
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {liked.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
