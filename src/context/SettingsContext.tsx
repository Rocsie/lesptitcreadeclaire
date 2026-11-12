'use client';

import React, { createContext, useContext } from 'react';
import type { PublicSettings } from '@/lib/types';

const DEFAULT_SETTINGS: PublicSettings = {
  shippingPrice: 4.9,
  freeShippingThreshold: 60,
  pickupEnabled: true,
  paymentMode: 'simulation',
};

const SettingsContext = createContext<PublicSettings>(DEFAULT_SETTINGS);

// Réglages de la boutique (frais de port, seuil de gratuité, mode de paiement),
// lus côté serveur dans l'administration puis transmis à tout le site.
export function SettingsProvider({ value, children }: { value: PublicSettings; children: React.ReactNode }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): PublicSettings {
  return useContext(SettingsContext);
}
