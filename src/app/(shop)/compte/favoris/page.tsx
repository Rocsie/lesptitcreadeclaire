'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, ArrowLeft, Sparkles } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { Product } from '@/lib/store';
import ProductCard from '@/components/product/ProductCard';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((all) => {
        if (Array.isArray(all)) {
          setProducts(all.filter((p) => favorites.includes(p.id)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favorites]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/compte"
          className="p-2 rounded-full bg-cream-warm hover:bg-rose-powder/30 text-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark flex items-center gap-2">
            <span>Mes Favoris</span>
            <Heart className="w-6 h-6 text-rose-old fill-current" />
          </h1>
          <p className="text-xs text-muted">
            Retrouvez tous vos bijoux coups de cœur enregistrés.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted">Chargement des favoris...</div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-rose-powder/30 space-y-4 max-w-lg mx-auto">
          <Heart className="w-12 h-12 text-rose-powder mx-auto" />
          <h2 className="font-serif text-xl font-bold text-dark">Votre liste de favoris est vide</h2>
          <p className="text-xs text-muted">
            Cliquez sur le petit cœur sur n&apos;importe quel bijou pour le garder précieusement de côté.
          </p>
          <Link
            href="/boutique"
            className="inline-block px-8 py-3 rounded-full bg-plum text-white text-xs font-semibold uppercase tracking-wider"
          >
            Explorer la boutique
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
