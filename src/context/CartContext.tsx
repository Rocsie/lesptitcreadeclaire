'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  appliedPromo: { code: string; discountAmount: number; description?: string } | null;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number; description?: string } | null>(null);

  const freeShippingThreshold = 60.0;

  // Hydrater depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pcc_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      // Ignored
    }
  }, []);

  // Sauvegarder dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pcc_cart', JSON.stringify(items));
    } catch (e) {
      // Ignored
    }
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.productId === newItem.productId && i.variantId === newItem.variantId
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIndex].quantity + quantity, newItem.stock || 99);
        updated[existingIndex].quantity = newQty;
        return updated;
      } else {
        return [...prev, { ...newItem, quantity }];
      }
    });
    setIsOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems(prev =>
      prev.map(item => {
        if (item.productId === productId && item.variantId === variantId) {
          return { ...item, quantity: Math.min(quantity, item.stock || 99) };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string, variantId?: string) => {
    setItems(prev =>
      prev.filter(item => !(item.productId === productId && item.variantId === variantId))
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedPromo(null);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const applyPromoCode = async (code: string) => {
    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedPromo({
          code: code.toUpperCase(),
          discountAmount: data.discountAmount,
          description: data.message,
        });
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Code invalide.' };
      }
    } catch (e) {
      // Fallback local promo validation
      if (code.toUpperCase() === 'BIENVENUE10') {
        const discount = subtotal * 0.1;
        setAppliedPromo({ code: 'BIENVENUE10', discountAmount: discount, description: '10% de bienvenue appliqué' });
        return { success: true, message: '10% de bienvenue appliqué !' };
      }
      return { success: false, message: 'Code promotionnel introuvable.' };
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  return (
    <CartContext.Provider
      value={{
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
