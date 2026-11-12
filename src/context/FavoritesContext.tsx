'use client';

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { createLocalStore, useLocalStore } from '@/lib/local-store';

interface FavoritesContextType {
  favorites: string[]; // identifiants de produits
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  count: number;
}

const EMPTY: string[] = [];

const favoritesStore = createLocalStore<string[]>('pcc_favorites', EMPTY, (raw) =>
  Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : EMPTY
);

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const favorites = useLocalStore(favoritesStore);

  const toggleFavorite = useCallback((productId: string) => {
    favoritesStore.set((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite: (productId: string) => favorites.includes(productId),
      count: favorites.length,
    }),
    [favorites, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
