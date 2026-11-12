'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Eye, Sparkles } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { formatPrice } from '@/lib/paths';
import ShopImage from '@/components/ui/ShopImage';

interface ProductCardProps {
  product: Product;
  /** Niveau du titre : h2 dans une liste de produits, h3 sous un titre de section. */
  headingLevel?: 'h2' | 'h3';
  /** Charge la photo tout de suite (premières cartes visibles à l'arrivée sur la page). */
  eager?: boolean;
}

export default function ProductCard({ product, headingLevel = 'h3', eager = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const Heading = headingLevel;

  const isLiked = isFavorite(product.id);
  const primaryImage = product.images?.[0]?.url || '/images/hero-atelier.jpg';
  const imageAlt = product.images?.[0]?.altText?.trim() || product.name;

  // Ajout rapide : la première finition encore disponible est choisie.
  const variant = product.variants?.find((v) => v.stock > 0) || product.variants?.[0];
  const available = variant ? Math.min(product.stock, variant.stock) : product.stock;
  const soldOut = available <= 0;
  const hasPromo = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  // Pas de double étiquette quand le texte libre dit déjà "Pièce unique".
  const showUniqueBadge = product.isUniquePiece && !/pi[eè]ce unique/i.test(product.badgeText || '');

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price + (variant?.priceDiff || 0),
      image: primaryImage,
      stock: available,
      variantTitle: variant?.name,
      variantId: variant?.id,
    });
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <div className="group relative artisan-card overflow-hidden flex flex-col justify-between">
      <div className="relative aspect-square w-full overflow-hidden bg-cream-warm rounded-t-2xl">
        <Link href={`/produit/${product.slug}`} className="relative block w-full h-full" tabIndex={-1}>
          <ShopImage
            src={primaryImage}
            alt={imageAlt}
            fill
            preload={eager}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 ${
              soldOut ? 'opacity-70' : ''
            }`}
          />
        </Link>

        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
          {soldOut ? (
            <span className="bg-dark/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">Épuisé</span>
          ) : (
            product.badgeText && <span className="badge-artisan shadow-xs backdrop-blur-md">{product.badgeText}</span>
          )}
          {showUniqueBadge && <span className="badge-gold shadow-xs">Pièce unique</span>}
          {hasPromo && !soldOut && (
            <span className="bg-plum text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">Promo</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-pressed={isLiked}
          className={`absolute top-2.5 right-2.5 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-90 shadow-sm z-10 ${
            isLiked ? 'bg-plum text-white' : 'bg-white/85 text-dark/70 hover:text-plum hover:bg-white'
          }`}
          aria-label={isLiked ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
        >
          <Heart className={`w-4.5 h-4.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {/* Ajout rapide au survol (ordinateur) */}
        <div className="absolute inset-x-3 bottom-3 z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 hidden sm:block">
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={soldOut}
            className="w-full py-2.5 px-4 rounded-xl bg-white/95 hover:bg-plum hover:text-white text-dark font-medium text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2 backdrop-blur-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white/95 disabled:hover:text-dark"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>{soldOut ? 'Épuisé' : 'Ajout rapide'}</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted mb-1">
            <span className="font-medium tracking-wide">Fait main à Port-la-Nouvelle</span>
            {product.stock <= product.lowStockThreshold && product.stock > 0 && (
              <span className="text-amber-700 font-semibold flex items-center gap-0.5 shrink-0">
                <Sparkles className="w-2.5 h-2.5" aria-hidden="true" /> Plus que {product.stock}
              </span>
            )}
          </div>

          <Link href={`/produit/${product.slug}`} className="block">
            <Heading className="font-serif text-base sm:text-lg font-bold text-dark group-hover:text-plum transition-colors line-clamp-1 leading-snug">
              {product.name}
            </Heading>
          </Link>

          {product.shortDescription && (
            <p className="text-xs text-muted/80 line-clamp-2 mt-1 leading-relaxed">{product.shortDescription}</p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-rose-powder/20 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold text-plum font-serif">{formatPrice(product.price)}</span>
            {hasPromo && (
              <span className="text-xs text-muted/60 line-through">{formatPrice(product.compareAtPrice as number)}</span>
            )}
          </div>

          {/* Bouton d'ajout direct sur mobile */}
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={soldOut}
            className="sm:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-plum hover:bg-plum-dark text-white active:scale-90 transition-transform shadow-xs flex items-center justify-center disabled:opacity-40"
            aria-label={soldOut ? `${product.name} est épuisé` : `Ajouter ${product.name} au panier`}
          >
            <ShoppingBag className="w-4.5 h-4.5" />
          </button>

          <Link
            href={`/produit/${product.slug}`}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-plum hover:text-plum-dark"
          >
            <span>Détails</span>
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
