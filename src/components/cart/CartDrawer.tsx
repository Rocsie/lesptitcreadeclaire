'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, Sparkles, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/paths';
import ShopImage from '@/components/ui/ShopImage';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    subtotal,
    totalItems,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    freeShippingThreshold,
    amountNeededForFreeShipping,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Tiroir ouvert : la page derrière ne défile plus, Échap ferme.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setIsApplying(true);
    setPromoMessage(null);
    const result = await applyPromoCode(promoInput.trim());
    setIsApplying(false);
    if (result.success) {
      setPromoMessage({ text: result.message });
      setPromoInput('');
    } else {
      setPromoMessage({ text: result.message, error: true });
    }
  };

  const discountAmount = appliedPromo?.discountAmount || 0;
  const total = Math.max(0, subtotal - discountAmount);
  const freeShippingReached = amountNeededForFreeShipping <= 0 || Boolean(appliedPromo?.freeShipping);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Mon panier">
      <div onClick={closeCart} className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in" />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 h-full max-h-[100dvh]">
        <div className="w-screen max-w-md bg-cream shadow-2xl flex flex-col justify-between animate-in slide-in-from-right h-full max-h-[100dvh]">
          {/* En-tête */}
          <div className="p-4 sm:p-5 border-b border-rose-powder/30 flex items-center justify-between bg-cream-warm shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-plum" aria-hidden="true" />
              <h2 className="font-serif text-xl font-bold text-dark">Mon Panier</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-powder/40 text-plum">
                {totalItems} {totalItems > 1 ? 'articles' : 'article'}
              </span>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="w-10 h-10 rounded-full flex items-center justify-center text-dark/70 hover:text-dark hover:bg-rose-powder/20 active:scale-95 transition-all"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Jauge de livraison offerte */}
          {freeShippingThreshold > 0 && items.length > 0 && (
            <div className="bg-rose-light/50 px-5 py-3 border-b border-rose-powder/20 shrink-0">
              {freeShippingReached ? (
                <p className="text-xs text-eucalyptus font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
                  La livraison à domicile vous est offerte.
                </p>
              ) : (
                <div>
                  <p className="text-xs text-dark/80 mb-1.5 flex items-center justify-between font-medium">
                    <span>
                      Plus que <strong className="text-plum font-bold">{formatPrice(amountNeededForFreeShipping)}</strong> pour la livraison offerte
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden="true" />
                  </p>
                  <div className="w-full h-1.5 bg-rose-powder/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-old to-plum transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Articles */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-rose-powder/15">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-rose-powder/20 flex items-center justify-center mb-4 text-plum">
                  <ShoppingBag className="w-8 h-8 opacity-60" aria-hidden="true" />
                </div>
                <p className="font-serif text-lg font-semibold text-dark">Votre panier est encore vide</p>
                <p className="text-xs text-muted mt-1 max-w-xs">
                  Laissez-vous charmer par nos créations uniques et bijoux faits main à Port-la-Nouvelle.
                </p>
                <Link
                  href="/boutique"
                  onClick={closeCart}
                  className="mt-6 px-6 py-3 min-h-[44px] inline-flex items-center justify-center rounded-full bg-plum text-white text-xs font-semibold uppercase tracking-wider hover:bg-plum-dark active:scale-95 transition-all shadow-sm"
                >
                  Découvrir la boutique
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.productId}-${item.variantId || 'default'}`} className="py-4 flex gap-3.5 sm:gap-4">
                  <ShopImage
                    src={item.image}
                    alt=""
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-xl object-cover border border-rose-powder/30 shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-semibold text-dark leading-snug line-clamp-2">{item.name}</h3>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="w-10 h-10 min-w-[40px] min-h-[40px] -mt-2 -mr-2 rounded-full flex items-center justify-center text-muted/60 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all shrink-0"
                          aria-label={`Retirer ${item.name} du panier`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.variantTitle && (
                        <p className="text-xs text-rose-old font-medium mt-0.5">Finition : {item.variantTitle}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-rose-powder/40 rounded-full bg-white p-0.5 shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-dark hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-90 transition-all"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-dark min-w-[22px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          disabled={item.quantity >= item.stock}
                          className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-dark hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-plum font-serif">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                    {item.quantity >= item.stock && (
                      <p className="text-[10px] text-muted mt-1">Quantité maximale disponible.</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totaux et passage en caisse */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 pb-8 sm:pb-5 border-t border-rose-powder/30 bg-cream-warm space-y-4 shrink-0">
              {!appliedPromo ? (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                    <input
                      type="text"
                      aria-label="Code promo"
                      placeholder="Code promo"
                      autoCapitalize="characters"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 text-xs bg-white rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="min-h-[42px] px-4 py-2 bg-plum hover:bg-plum-dark text-white font-semibold text-xs rounded-xl active:scale-95 transition-all shadow-xs disabled:opacity-50 flex items-center justify-center shrink-0"
                  >
                    {isApplying ? 'Vérification...' : 'Appliquer'}
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between bg-rose-light/70 px-3.5 py-2.5 rounded-xl border border-rose-powder/30 text-xs">
                  <div className="flex items-center gap-1.5 text-plum font-semibold">
                    <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {appliedPromo.code}
                      {appliedPromo.freeShipping
                        ? ' (livraison offerte)'
                        : appliedPromo.active
                        ? ` (-${formatPrice(appliedPromo.discountAmount)})`
                        : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removePromoCode();
                      setPromoMessage(null);
                    }}
                    className="text-muted hover:text-red-500 active:scale-95 text-xs font-semibold px-2 py-1 rounded"
                  >
                    Retirer
                  </button>
                </div>
              )}

              {appliedPromo && !appliedPromo.active ? (
                <p className="text-[11px] text-amber-700" role="status">
                  Ce code s&apos;applique à partir de {formatPrice(appliedPromo.minOrderAmount)} d&apos;achat.
                </p>
              ) : (
                promoMessage && (
                  <p
                    className={`text-[11px] ${promoMessage.error ? 'text-red-600' : 'text-eucalyptus font-medium'}`}
                    role="status"
                  >
                    {promoMessage.text}
                  </p>
                )
              )}

              <div className="space-y-1.5 text-xs text-dark/80">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                {appliedPromo && discountAmount > 0 && (
                  <div className="flex justify-between text-plum font-medium">
                    <span>Réduction ({appliedPromo.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 text-muted">
                  <span>Livraison</span>
                  <span className="text-right">Calculée à l&apos;étape suivante</span>
                </div>
                <div className="flex justify-between text-base font-bold text-dark pt-2 border-t border-rose-powder/20">
                  <span>Total estimé</span>
                  <span className="text-plum font-serif text-lg">{formatPrice(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full min-h-[50px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-plum to-plum-dark text-white font-semibold text-sm tracking-wide shadow-md hover:shadow-lg active:scale-98 transition-all"
              >
                <span>Commander</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <p className="text-center text-[10px] text-muted">
                Retrait gratuit à l&apos;atelier de Port-la-Nouvelle ou expédition soignée
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
