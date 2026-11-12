import type { PaymentMode } from './types';

function isRealKey(value: string | undefined, prefix: string): boolean {
  return Boolean(value && value.startsWith(prefix) && !value.includes('votre_'));
}

export function isStripeConfigured(): boolean {
  return isRealKey(process.env.STRIPE_SECRET_KEY, 'sk_');
}

export function isStripeWebhookConfigured(): boolean {
  return isRealKey(process.env.STRIPE_WEBHOOK_SECRET, 'whsec_');
}

/**
 * Mode de paiement effectif :
 * - simulation : le mode démonstration est activé dans l'administration, aucune carte n'est débitée ;
 * - stripe     : clé Stripe présente et mode démonstration coupé ;
 * - disabled   : mode démonstration coupé mais Stripe n'est pas configuré, la commande en ligne est fermée.
 */
export function resolvePaymentMode(simulationEnabled: boolean): PaymentMode {
  if (simulationEnabled) return 'simulation';
  return isStripeConfigured() ? 'stripe' : 'disabled';
}
