'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Eye, Sparkles } from 'lucide-react';
import { Product } from '@/lib/store';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLiked = mounted ? isFavorite(product.id) : false;
  const primaryImage = product.images?.[0]?.url || '/images/hero-atelier.jpg';
  const secondaryImage = product.images?.[1]?.url || primaryImage;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: primaryImage,
      stock: product.stock,
      variantTitle: product.variants?.[0]?.name,
      variantId: product.variants?.[0]?.id,
    });
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <div className="group relative artisan-card overflow-hidden flex flex-col justify-between">
      {/* Container Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-cream-warm rounded-t-2xl">
        <Link href={`/produit/${product.slug}`} className="block w-full h-full">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Badges en haut à gauche */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.badgeText && (
            <span className="badge-artisan shadow-xs backdrop-blur-md">
              {product.badgeText}
            </span>
          )}
          {product.isUniquePiece && (
            <span className="badge-gold shadow-xs">
              Pièce unique
            </span>
          )}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="bg-plum text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Promo
            </span>
          )}
        </div>

        {/* Bouton Favoris en haut à droite */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2.5 right-2.5 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-90 shadow-sm z-10 ${
            isLiked
              ? 'bg-plum text-white'
              : 'bg-white/85 text-dark/70 hover:text-plum hover:bg-white'
          }`}
          aria-label="Ajouter aux favoris"
        >
          <Heart className={`w-4.5 h-4.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {/* Bouton Ajout rapide qui apparaît au survol sur desktop */}
        <div className="absolute inset-x-3 bottom-3 z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hidden sm:block">
          <button
            onClick={handleQuickAdd}
            disabled={product.stock <= 0}
            className="w-full py-2.5 px-4 rounded-xl bg-white/95 hover:bg-plum hover:text-white text-dark font-medium text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{product.stock <= 0 ? 'Épuisé' : 'Ajout rapide'}</span>
          </button>
        </div>
      </div>

      {/* Détails du produit */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-muted mb-1">
            <span className="font-medium tracking-wide">Fait main à Port-la-Nouvelle</span>
            {product.stock <= product.lowStockThreshold && product.stock > 0 && (
              <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Plus que {product.stock} en stock !
              </span>
            )}
          </div>

          <Link href={`/produit/${product.slug}`} className="block">
            <h3 className="font-serif text-base sm:text-lg font-bold text-dark group-hover:text-plum transition-colors line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {product.shortDescription && (
            <p className="text-xs text-muted/80 line-clamp-2 mt-1 leading-relaxed">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Prix et Action Mobile */}
        <div className="mt-4 pt-3 border-t border-rose-powder/20 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold text-plum font-serif">
              {product.price.toFixed(2)} €
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-muted/60 line-through">
                {product.compareAtPrice.toFixed(2)} €
              </span>
            )}
          </div>

          {/* Bouton mobile direct et confortable */}
          <button
            onClick={handleQuickAdd}
            disabled={product.stock <= 0}
            className="sm:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-plum hover:bg-plum-dark text-white active:scale-90 transition-transform shadow-xs flex items-center justify-center disabled:opacity-40"
            aria-label="Ajouter au panier"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
          </button>


          {/* Lien Découvrir sur desktop */}
          <Link
            href={`/produit/${product.slug}`}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-plum hover:text-plum-dark"
          >
            <span>Détails</span>
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
