'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Product, store } from '@/lib/store';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import ProductCard from '@/components/product/ProductCard';
import { HandDrawnHeart } from '@/components/brand/FloralAccents';

function ProductDetailContent() {

  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'materials' | 'care'>('desc');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    fetch(`/api/products/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setProduct(data);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Produits similaires
    fetch('/api/products')
      .then((res) => res.json())
      .then((all) => {
        if (Array.isArray(all)) {
          setRelatedProducts(all.filter((p) => p.slug !== slug).slice(0, 3));
        }
      })
      .catch(() => {});
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-3 border-rose-powder border-t-plum rounded-full animate-spin mx-auto mb-4" />
        <p className="font-serif text-lg text-dark">Chargement de la création...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="font-serif text-3xl font-bold text-dark">Création introuvable</h1>
        <p className="text-sm text-muted">Ce bijou a peut-être été déplacé ou n&apos;est plus disponible.</p>
        <Link
          href="/boutique"
          className="inline-block px-8 py-3 rounded-full bg-plum text-white text-xs font-semibold uppercase tracking-wider"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const isLiked = mounted ? isFavorite(product.id) : false;
  const images = product.images && product.images.length > 0 ? product.images : [{ url: '/images/hero-atelier.jpg' }];
  const currentImage = images[activeImageIndex]?.url || images[0].url;

  const handleAddToCart = () => {
    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: currentImage,
        stock: product.stock,
        variantId: selectedVariant?.id,
        variantTitle: selectedVariant?.name,
      },
      quantity
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-16">
      {/* Fil d'ariane (Breadcrumb) */}
      <nav className="flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-plum transition-colors">Accueil</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/boutique" className="hover:text-plum transition-colors">Boutique</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-dark font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Grille principale : Galerie à gauche, Fiche descriptive à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Galerie Photos */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-cream-warm border border-rose-powder/30 shadow-lg group">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              {product.badgeText && <span className="badge-artisan">{product.badgeText}</span>}
              {product.isUniquePiece && <span className="badge-gold">Pièce unique</span>}
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="bg-plum text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  Promo
                </span>
              )}
            </div>

            {/* Favoris */}
            <button
              onClick={() => toggleFavorite(product.id)}
              className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all shadow-md ${
                isLiked ? 'bg-plum text-white' : 'bg-white/80 text-dark/70 hover:text-plum hover:bg-white'
              }`}
              aria-label="Sauvegarder dans les favoris"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Miniatures */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? 'border-plum scale-105 shadow-md' : 'border-rose-powder/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Détails du produit & Achat */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span className="font-mono tracking-wider">Réf: {product.reference}</span>
              <span className="flex items-center gap-1 text-eucalyptus font-medium">
                <MapPin className="w-3.5 h-3.5 text-gold" /> Port-la-Nouvelle
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark leading-tight">
              {product.name}
            </h1>

            {/* Prix */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-plum">
                {product.price.toFixed(2)} €
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-base text-muted/60 line-through">
                  {product.compareAtPrice.toFixed(2)} €
                </span>
              )}
              <span className="text-xs text-muted">TTC</span>
            </div>
          </div>

          {/* État du stock */}
          <div className="p-3 rounded-xl bg-white border border-rose-powder/20 flex items-center justify-between text-xs">
            <span className="text-muted font-medium">Disponibilité :</span>
            {product.stock > 0 ? (
              <span className="text-eucalyptus font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sage" />
                {product.stock <= product.lowStockThreshold
                  ? `Plus que ${product.stock} exemplaires en stock !`
                  : 'En stock à l\'atelier'}
              </span>
            ) : (
              <span className="text-red-600 font-bold">Épuisé</span>
            )}
          </div>

          {/* Variantes si existantes */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-dark block">
                Finitions &amp; Nuances :
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 flex items-center gap-2 ${
                      selectedVariant?.id === v.id
                        ? 'border-plum bg-rose-light text-plum shadow-xs ring-1 ring-plum/30'
                        : 'border-rose-powder/40 bg-white text-dark hover:border-plum'
                    }`}
                  >
                    {v.color && (
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shrink-0"
                        style={{ backgroundColor: v.color }}
                      />
                    )}
                    <span>{v.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantité & Boutons d'achat */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Sélecteur quantité avec cibles tactiles larges */}
              <div className="flex items-center border border-rose-powder/40 rounded-full bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-dark text-lg font-bold hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-90 transition-all"
                  aria-label="Diminuer la quantité"
                >
                  -
                </button>
                <span className="px-3 text-sm font-bold text-dark min-w-[28px] text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-dark text-lg font-bold hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-90 transition-all"
                  aria-label="Augmenter la quantité"
                >
                  +
                </button>
              </div>

              {/* Ajouter au panier */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 min-h-[48px] py-3.5 px-6 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{product.stock <= 0 ? 'En rupture' : 'Ajouter au panier'}</span>
              </button>
            </div>

            {/* Acheter maintenant */}
            {product.stock > 0 && (
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-gradient-to-r from-rose-old to-plum text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-98 text-center"
              >
                Acheter maintenant
              </button>
            )}
          </div>

          {/* Réassurance sous le bouton */}
          <div className="p-4 rounded-2xl bg-cream-warm border border-rose-powder/30 space-y-2 text-xs text-dark/80">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-plum shrink-0" />
              <span><strong>Retrait gratuit</strong> à la boutique L&apos;Atelier à Port-la-Nouvelle</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-plum shrink-0" />
              <span>Livraison offerte dès 60€ d&apos;achat en France métropolitaine</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-plum shrink-0" />
              <span>Fait main avec passion par Claire • Pièce protégée dans son écrin</span>
            </div>
          </div>

          {/* Onglets descriptifs adaptés au mobile */}
          <div className="pt-4 border-t border-rose-powder/20">
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-rose-powder/30 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('desc')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-all active:scale-95 ${
                  activeTab === 'desc'
                    ? 'bg-plum text-white shadow-xs'
                    : 'bg-white border border-rose-powder/30 text-muted hover:text-dark'
                }`}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('materials')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-all active:scale-95 ${
                  activeTab === 'materials'
                    ? 'bg-plum text-white shadow-xs'
                    : 'bg-white border border-rose-powder/30 text-muted hover:text-dark'
                }`}
              >
                Matériaux &amp; Dimensions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('care')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-all active:scale-95 ${
                  activeTab === 'care'
                    ? 'bg-plum text-white shadow-xs'
                    : 'bg-white border border-rose-powder/30 text-muted hover:text-dark'
                }`}
              >
                Conseils d&apos;Entretien
              </button>
            </div>


            <div className="py-4 text-xs text-muted leading-relaxed">
              {activeTab === 'desc' && (
                <div className="space-y-2">
                  <p>{product.description || product.shortDescription}</p>
                  <p className="italic text-plum font-serif text-sm pt-2">
                    &quot;Chaque création est façonnée individuellement à la main dans notre atelier de Port-la-Nouvelle.&quot;
                  </p>
                </div>
              )}

              {activeTab === 'materials' && (
                <div className="space-y-2">
                  {product.materials && (
                    <p><strong>Composition :</strong> {product.materials}</p>
                  )}
                  {product.dimensions && (
                    <p><strong>Dimensions :</strong> {product.dimensions}</p>
                  )}
                  {product.weightGrams && (
                    <p><strong>Poids :</strong> {product.weightGrams} g (très confortable à porter)</p>
                  )}
                </div>
              )}

              {activeTab === 'care' && (
                <div className="space-y-2">
                  <p>{product.careInstructions || "Conserver dans son pochon ou écrin d'origine. Éviter le contact direct avec le parfum, l'eau de mer et les produits ménagers pour préserver l'éclat des dorures et cristaux."}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Créations similaires */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-rose-powder/20 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-plum">Pour compléter votre parure</span>
            <h2 className="font-serif text-3xl font-bold text-dark">Vous Aimerez Aussi</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-rose border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-warm-gray font-serif text-lg">Chargement de la création artisanale...</p>
          </div>
        </div>
      }
    >
      <ProductDetailContent />
    </React.Suspense>
  );
}
