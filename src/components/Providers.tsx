'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { SettingsProvider } from '@/context/SettingsContext';
import type { PublicSettings, User } from '@/lib/types';

export default function Providers({
  settings,
  initialUser,
  children,
}: {
  settings: PublicSettings;
  initialUser: User | null;
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider value={settings}>
      <AuthProvider initialUser={initialUser}>
        <FavoritesProvider>
          <CartProvider>{children}</CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
