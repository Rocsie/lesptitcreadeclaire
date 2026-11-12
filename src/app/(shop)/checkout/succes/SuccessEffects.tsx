'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useCart } from '@/context/CartContext';

// Commande payée : le panier est vidé et quelques confettis fêtent l'achat.
export function OrderConfirmedEffects({ orderNumber }: { orderNumber: string }) {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    const key = `pcc_confetti_${orderNumber}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
    } catch {
      // stockage de session indisponible : les confettis rejouent au pire une fois de plus
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E8B4B8', '#6E2D4A', '#D4AF37', '#87A287'],
    });
  }, [clearCart, orderNumber]);

  return null;
}

// Paiement pas encore confirmé par la banque : la page se rafraîchit toute seule.
export function PendingRefresh() {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 4000);
    const stop = setTimeout(() => clearInterval(timer), 60_000);
    return () => {
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, [router]);

  return null;
}
