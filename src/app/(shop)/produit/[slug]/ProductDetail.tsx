'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingBag, ShieldCheck, Truck, CheckCircle2, MapPin, ChevronRight, Minus, Plus } from 'lucide-react';
import type { Category, Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useSettings } from '@/context/SettingsContext';
import ProductCard from '@/components/product/ProductCard';
import { formatPrice } from '@/lib/paths';
import ShopImage from '@/components/ui/ShopImage';
import { track } from '@/lib/track';

type Tab = 'desc' | 'materials' | 'care';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'desc', label: 'Description' },
  { id: 'materials', label: 'Matériaux & Dimensions' },
  { id: 'care', label: "Conseils d'Entretien" },
];

export default function ProductDetail({
  product,
  relatedProducts,
  category,
}: {
  product: Product;
  relatedProducts: Product[];
  category?: Category | null;
}) {
  const router = useRouter();
  const { addToCart, items } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { freeShippingThreshold, pickupEnabled, paymentMode } = useSettings();

  const variants = product.variants || [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    (variants.find((v) => v.stock > 0) || variants[0])?.id
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('desc');

  useEffect(() => {
    track('product_view', { slug: product.slug });
  }, [product.slug]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const isLiked = isFavorite(product.id);
  const images = product.images && product.images.length > 0 ? product.images : [{ url: '/images/hero-atelier.jpg' }];
  const currentImage = images[activeImageIndex]?.url || images[0].url;

  const unitPrice = product.price + (selectedVariant?.priceDiff || 0);
  const available = selectedVariant ? Math.min(product.stock, selectedVariant.stock) : product.stock;
  const inCart =
    items.find((i) => i.productId === product.id && (i.variantId || undefined) === selectedVariantId)?.quantity || 0;
  const remaining = Math.max(0, available - inCart);
  const soldOut = available <= 0 || product.status === 'SOLD_OUT';
  const canAdd = !soldOut && remaining > 0;
  const safeQuantity = Math.min(quantity, Math.max(1, remaining));
  const hasPromo = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const notPublished = product.status === 'DRAFT' || product.status === 'HIDDEN';
  const showUniqueBadge = product.isUniquePiece && !/pi[eè]ce unique/i.test(product.badgeText || '');

  const add = (open: boolean) => {
    if (!canAdd) return;
    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: unitPrice,
        image: images[0].url,
        stock: available,
        variantId: selectedVariant?.id,
        variantTitle: selectedVariant?.name,
      },
      safeQuantity,
      { open }
    );
    setQuantity(1);
  };

  const handleBuyNow = () => {
    add(false);
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-16">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-muted" aria-label="Fil d'Ariane">
        <Link href="/" className="hover:text-plum transition-colors">
          Accueil
        </Link>
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        <Link href="/boutique" className="hover:text-plum transition-colors">
          Boutique
        </Link>
        {category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            <Link href={`/boutique/${category.slug}`} className="hover:text-plum transition-colors">
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="text-dark font-medium truncate max-w-xs" aria-current="page">{product.name}</span>
      </nav>

      {notPublished && (
        <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs" role="status">
          Aperçu réservé à l&apos;administration : cette création n&apos;est pas visible sur la boutique (
          {product.status === 'DRAFT' ? 'brouillon' : 'masquée'}).
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Galerie */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-cream-warm border border-rose-powder/30 shadow-lg group">
            <ShopImage
              src={currentImage}
              alt={images[activeImageIndex]?.altText || product.name}
              fill
              preload
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5 z-10">
              {product.badgeText && <span className="badge-artisan">{product.badgeText}</span>}
              {showUniqueBadge && <span className="badge-gold">Pièce unique</span>}
              {hasPromo && (
                <span className="bg-plum text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">Promo</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              aria-pressed={isLiked}
              className={`absolute top-4 right-4 w-12 h-12 rounded-full backdrop-blur-md transition-all shadow-md flex items-center justify-center active:scale-90 ${
                isLiked ? 'bg-plum text-white' : 'bg-white/80 text-dark/70 hover:text-plum hover:bg-white'
              }`}
              aria-label={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto p-1 pb-2">
              {images.map((img, idx) => (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`Voir la photo ${idx + 1}`}
                  aria-current={activeImageIndex === idx}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-plum scale-105 shadow-md'
                      : 'border-rose-powder/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <ShopImage src={img.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fiche et achat */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span className="font-mono tracking-wider">Réf : {product.reference}</span>
              <span className="flex items-center gap-1 text-eucalyptus font-medium">
                <MapPin className="w-3.5 h-3.5 text-gold" aria-hidden="true" /> Port-la-Nouvelle
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark leading-tight">{product.name}</h1>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-plum">{formatPrice(unitPrice)}</span>
              {hasPromo && (
                <span className="text-base text-muted/60 line-through">
                  {formatPrice(product.compareAtPrice as number)}
                </span>
              )}
              <span className="text-xs text-muted">TTC</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-rose-powder/20 flex items-center justify-between gap-3 text-xs">
            <span className="text-muted font-medium">Disponibilité :</span>
            {soldOut ? (
              <span className="text-red-600 font-bold">Épuisé</span>
            ) : (
              <span className="text-eucalyptus font-bold flex items-center gap-1.5 text-right">
                <CheckCircle2 className="w-4 h-4 text-sage shrink-0" aria-hidden="true" />
                {available <= product.lowStockThreshold
                  ? available === 1
                    ? 'Dernier exemplaire'
                    : `Plus que ${available} exemplaires`
                  : "En stock à l'atelier"}
              </span>
            )}
          </div>

          {variants.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-dark block mb-2">
                Finitions &amp; Nuances :
              </legend>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const variantSoldOut = Math.min(product.stock, v.stock) <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={selectedVariantId === v.id}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                      }}
                      className={`min-h-[42px] px-4 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 flex items-center gap-2 ${
                        selectedVariantId === v.id
                          ? 'border-plum bg-rose-light text-plum shadow-xs ring-1 ring-plum/30'
                          : 'border-rose-powder/40 bg-white text-dark hover:border-plum'
                      } ${variantSoldOut ? 'opacity-50 line-through' : ''}`}
                    >
                      {v.color && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shrink-0"
                          style={{ backgroundColor: v.color }}
                        />
                      )}
                      <span>{v.name}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-rose-powder/40 rounded-full bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, safeQuantity - 1))}
                  disabled={!canAdd || safeQuantity <= 1}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-dark hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-90 transition-all disabled:opacity-30"
                  aria-label="Diminuer la quantité"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm font-bold text-dark min-w-[28px] text-center" aria-live="polite">
                  {safeQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(remaining, safeQuantity + 1))}
                  disabled={!canAdd || safeQuantity >= remaining}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-dark hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-90 transition-all disabled:opacity-30"
                  aria-label="Augmenter la quantité"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => add(true)}
                disabled={!canAdd}
                className="flex-1 min-h-[50px] py-3.5 px-6 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                <span>{soldOut ? 'En rupture' : remaining === 0 ? 'Déjà dans le panier' : 'Ajouter au panier'}</span>
              </button>
            </div>

            {!soldOut && remaining === 0 && (
              <p className="text-[11px] text-muted">
                Tous les exemplaires disponibles sont déjà dans votre panier.
              </p>
            )}

            {canAdd && paymentMode !== 'disabled' && (
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full min-h-[50px] py-3.5 px-6 rounded-full bg-gradient-to-r from-rose-old to-plum text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-98 text-center flex items-center justify-center"
              >
                Acheter maintenant
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-cream-warm border border-rose-powder/30 space-y-2 text-xs text-dark/80">
            {pickupEnabled && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-plum shrink-0" aria-hidden="true" />
                <span>
                  <strong>Retrait gratuit</strong> à la boutique L&apos;Atelier à Port-la-Nouvelle
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-plum shrink-0" aria-hidden="true" />
              <span>
                {freeShippingThreshold > 0
                  ? `Livraison offerte dès ${formatPrice(freeShippingThreshold)} d'achat en France métropolitaine`
                  : 'Livraison Colissimo en France métropolitaine'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-plum shrink-0" aria-hidden="true" />
              <span>Fait main avec passion par Claire • Pièce protégée dans son écrin</span>
            </div>
          </div>

          <div className="pt-4 border-t border-rose-powder/20">
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-rose-powder/30 scrollbar-none" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-all active:scale-95 ${
                    activeTab === tab.id
                      ? 'bg-plum text-white shadow-xs'
                      : 'bg-white border border-rose-powder/30 text-muted hover:text-dark'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="py-4 text-xs text-muted leading-relaxed" role="tabpanel">
              {activeTab === 'desc' && (
                <div className="space-y-2">
                  {(product.description || product.shortDescription) && (
                    <p className="whitespace-pre-line">{product.description || product.shortDescription}</p>
                  )}
                  <p className="italic text-plum font-serif text-sm pt-2">
                    &quot;Chaque création est façonnée individuellement à la main dans notre atelier de Port-la-Nouvelle.&quot;
                  </p>
                </div>
              )}

              {activeTab === 'materials' && (
                <div className="space-y-2">
                  {product.materials && (
                    <p>
                      <strong>Composition :</strong> {product.materials}
                    </p>
                  )}
                  {product.dimensions && (
                    <p>
                      <strong>Dimensions :</strong> {product.dimensions}
                    </p>
                  )}
                  {product.weightGrams ? (
                    <p>
                      <strong>Poids :</strong> {product.weightGrams} g
                    </p>
                  ) : null}
                  {!product.materials && !product.dimensions && !product.weightGrams && (
                    <p>Les détails de cette création sont disponibles sur simple demande auprès de Claire.</p>
                  )}
                </div>
              )}

              {activeTab === 'care' && (
                <p>
                  {product.careInstructions ||
                    "Conserver dans son pochon ou écrin d'origine. Éviter le contact direct avec le parfum, l'eau de mer et les produits ménagers pour préserver l'éclat des dorures et cristaux."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-rose-powder/20 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-plum">Pour compléter votre parure</span>
            <h2 className="font-serif text-3xl font-bold text-dark">Vous Aimerez Aussi</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} headingLevel="h3" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
