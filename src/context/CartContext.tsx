'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createLocalStore, useHydrated, useLocalStore } from '@/lib/local-store';
import { apiFetch } from '@/lib/paths';
import { track } from '@/lib/track';
import type { CouponValidation, DiscountType, Product } from '@/lib/types';
import { useSettings } from './SettingsContext';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  variantId?: string;
  variantTitle?: string;
  quantity: number;
  stock: number;
}

interface StoredPromo {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  description?: string;
}

export interface AppliedPromo {
  code: string;
  discountAmount: number;
  freeShipping: boolean;
  description?: string;
  /** Faux quand le panier est repassé sous le minimum d'achat du code. */
  active: boolean;
  minOrderAmount: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number, options?: { open?: boolean }) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  appliedPromo: AppliedPromo | null;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  isLoaded: boolean;
}

const EMPTY_ITEMS: CartItem[] = [];

const cartStore = createLocalStore<CartItem[]>('pcc_cart', EMPTY_ITEMS, (raw) => {
  if (!Array.isArray(raw)) return EMPTY_ITEMS;
  return raw
    .filter((i) => i && typeof i.productId === 'string' && Number(i.quantity) > 0)
    .map((i) => ({
      productId: i.productId,
      name: String(i.name || ''),
      price: Number(i.price) || 0,
      image: String(i.image || ''),
      variantId: i.variantId || undefined,
      variantTitle: i.variantTitle || undefined,
      quantity: Math.max(1, Math.floor(Number(i.quantity))),
      stock: Math.max(0, Math.floor(Number(i.stock) || 0)),
    }));
});

const promoStore = createLocalStore<StoredPromo | null>('pcc_promo', null, (raw) => {
  const p = raw as StoredPromo | null;
  return p && typeof p.code === 'string' && typeof p.discountType === 'string' ? p : null;
});

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const sameLine = (item: CartItem, productId: string, variantId?: string) =>
  item.productId === productId && (item.variantId || undefined) === (variantId || undefined);

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useLocalStore(cartStore);
  const promo = useLocalStore(promoStore);
  const isLoaded = useHydrated();
  const [isOpen, setIsOpen] = useState(false);
  const { freeShippingThreshold } = useSettings();

  // Au chargement, le panier enregistré est recalé sur le catalogue :
  // prix et stock à jour, créations retirées de la vente enlevées.
  useEffect(() => {
    if (cartStore.getSnapshot().length === 0) return;
    let cancelled = false;
    apiFetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((products: Product[] | null) => {
        if (cancelled || !Array.isArray(products)) return;
        cartStore.set((prev) =>
          prev.flatMap((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return [];
            const variant = item.variantId ? product.variants?.find((v) => v.id === item.variantId) : undefined;
            if (item.variantId && !variant) return [];
            const stock = variant ? Math.min(product.stock, variant.stock) : product.stock;
            if (stock <= 0) return [];
            return [
              {
                ...item,
                name: product.name,
                price: round2(product.price + (variant?.priceDiff || 0)),
                stock,
                quantity: Math.min(item.quantity, stock),
              },
            ];
          })
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback<CartContextType['addToCart']>((newItem, quantity = 1, options) => {
    const max = Math.max(0, newItem.stock);
    if (max === 0) return;
    cartStore.set((prev) => {
      const existing = prev.find((i) => sameLine(i, newItem.productId, newItem.variantId));
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, ...newItem, quantity: Math.min(i.quantity + quantity, max) } : i
        );
      }
      return [...prev, { ...newItem, quantity: Math.min(Math.max(1, quantity), max) }];
    });
    track('add_to_cart');
    if (options?.open !== false) setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    cartStore.set((prev) => prev.filter((item) => !sameLine(item, productId, variantId)));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }
      cartStore.set((prev) =>
        prev.map((item) =>
          sameLine(item, productId, variantId)
            ? { ...item, quantity: Math.min(quantity, Math.max(1, item.stock)) }
            : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    cartStore.set(EMPTY_ITEMS);
    promoStore.set(null);
  }, []);

  const subtotal = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const amountNeededForFreeShipping = Math.max(0, round2(freeShippingThreshold - subtotal));

  // La remise est recalculée à chaque changement du panier, jamais figée au moment de la saisie.
  const appliedPromo = useMemo<AppliedPromo | null>(() => {
    if (!promo) return null;
    const active = subtotal >= promo.minOrderAmount;
    let discountAmount = 0;
    if (active && promo.discountType === 'PERCENTAGE') {
      discountAmount = round2((subtotal * Math.min(100, promo.discountValue)) / 100);
    } else if (active && promo.discountType === 'FIXED_AMOUNT') {
      discountAmount = round2(Math.min(promo.discountValue, subtotal));
    }
    return {
      code: promo.code,
      discountAmount,
      freeShipping: active && promo.discountType === 'FREE_SHIPPING',
      description: promo.description,
      active,
      minOrderAmount: promo.minOrderAmount,
    };
  }, [promo, subtotal]);

  const applyPromoCode = useCallback(
    async (code: string) => {
      try {
        const res = await apiFetch('/api/promos/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, subtotal }),
        });
        const data = (await res.json()) as CouponValidation;
        if (data.valid && data.code && data.discountType) {
          promoStore.set({
            code: data.code,
            discountType: data.discountType,
            discountValue: data.discountValue || 0,
            minOrderAmount: data.minOrderAmount || 0,
            description: data.message,
          });
          return { success: true, message: data.message };
        }
        return { success: false, message: data.message || 'Code invalide.' };
      } catch {
        return { success: false, message: 'Impossible de vérifier le code pour le moment. Réessayez dans un instant.' };
      }
    },
    [subtotal]
  );

  const removePromoCode = useCallback(() => promoStore.set(null), []);

  const value: CartContextType = {
    items,
    isOpen,
    openCart,
    closeCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    isLoaded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
