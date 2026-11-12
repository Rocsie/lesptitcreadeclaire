'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Truck, Lock, ArrowRight, ShoppingBag, Store, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { apiFetch, formatPrice } from '@/lib/paths';
import ShopImage from '@/components/ui/ShopImage';
import { track } from '@/lib/track';

type Step = 1 | 2 | 3;

const INPUT =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum bg-white';
const LABEL = 'text-xs font-semibold text-dark block mb-1';

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, appliedPromo, isLoaded } = useCart();
  const { user } = useAuth();
  const { shippingPrice, freeShippingThreshold, pickupEnabled, paymentMode } = useSettings();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address1: '',
    address2: '',
    postalCode: '',
    city: '',
    customerNote: '',
  });
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'standard_delivery'>(
    pickupEnabled ? 'pickup' : 'standard_delivery'
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cancelNotice, setCancelNotice] = useState(false);

  const set = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  // Retour de la page de paiement sans avoir payé : la commande en attente est annulée,
  // le stock libéré, et le panier est toujours là.
  const cancelled = searchParams.get('annule');
  const cancelKey = searchParams.get('cle');
  useEffect(() => {
    if (!cancelled || !cancelKey) return;
    apiFetch('/api/orders/abandon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: cancelled, token: cancelKey }),
    })
      .catch(() => {})
      .finally(() => {
        setCancelNotice(true);
        router.replace('/checkout');
      });
  }, [cancelled, cancelKey, router]);

  const tracked = useRef(false);
  useEffect(() => {
    if (isLoaded && items.length > 0 && !tracked.current) {
      tracked.current = true;
      track('begin_checkout');
    }
  }, [isLoaded, items.length]);

  const promoActive = Boolean(appliedPromo?.active);
  const discountAmount = promoActive ? appliedPromo?.discountAmount || 0 : 0;
  const deliveryIsFree = (promoActive && appliedPromo?.freeShipping) || subtotal >= freeShippingThreshold;
  const deliveryPrice = deliveryIsFree ? 0 : shippingPrice;
  const shippingCost = shippingMethod === 'pickup' ? 0 : deliveryPrice;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const goToStep = (next: Step) => {
    setError('');
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToStep(2);
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shippingMethod === 'standard_delivery' && !/^\d{5}$/.test(formData.postalCode.replace(/\s+/g, ''))) {
      setError('Le code postal doit comporter 5 chiffres.');
      return;
    }
    goToStep(3);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');

    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: formData.email,
          customerFirstName: formData.firstName,
          customerLastName: formData.lastName,
          customerPhone: formData.phone,
          shippingMethod,
          shippingAddress: {
            address1: formData.address1,
            address2: formData.address2,
            postalCode: formData.postalCode,
            city: formData.city,
          },
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          promoCode: promoActive ? appliedPromo?.code : undefined,
          customerNote: formData.customerNote,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.orderNumber) {
        setError(data.error || "La commande n'a pas pu être enregistrée. Merci de réessayer.");
        setIsProcessing(false);
        return;
      }

      // Mode Stripe : direction la page de paiement. Le panier n'est vidé qu'une fois le paiement confirmé.
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      router.push(`/checkout/succes?commande=${encodeURIComponent(data.orderNumber)}&cle=${data.accessToken}`);
    } catch {
      setError('Connexion au serveur impossible. Vérifiez votre réseau, puis réessayez : rien n\'a été débité.');
      setIsProcessing(false);
    }
  };

  if (!isLoaded) {
    return <div className="max-w-5xl mx-auto px-4 py-24" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-powder/20 flex items-center justify-center text-plum">
          <ShoppingBag className="w-8 h-8 opacity-60" aria-hidden="true" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-dark">Votre panier est vide</h1>
        <p className="text-sm text-muted">Ajoutez une création à votre panier pour passer commande.</p>
        <Link
          href="/boutique"
          className="inline-flex items-center justify-center px-8 py-3 min-h-[44px] rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  const steps = ['Coordonnées', 'Livraison', 'Paiement'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center space-y-2 mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Finaliser ma commande</h1>
        <p className="text-xs text-muted">Les P&apos;tites Créa de Claire • Boutique L&apos;Atelier</p>
      </div>

      <ol className="flex items-center justify-center max-w-xl mx-auto mb-10" aria-label="Étapes de la commande">
        {steps.map((label, i) => {
          const n = (i + 1) as Step;
          return (
            <li key={label} className="flex items-center" aria-current={step === n ? 'step' : undefined}>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= n ? 'bg-plum text-white' : 'bg-rose-powder/30 text-muted'
                }`}
              >
                {n}
              </span>
              <span className="text-xs font-semibold text-dark hidden sm:inline ml-2">{label}</span>
              {i < steps.length - 1 && <span className="w-10 sm:w-14 h-0.5 bg-rose-powder/40 mx-2" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      {cancelNotice && (
        <p className="max-w-3xl mx-auto mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900" role="status">
          Le paiement a été annulé et rien n&apos;a été débité. Votre panier est conservé : vous pouvez reprendre votre commande.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-rose-powder/30 shadow-sm space-y-6">
          {error && (
            <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          {/* Étape 1 : coordonnées */}
          {step === 1 && (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-dark">1. Vos coordonnées</h2>

              {!user && (
                <p className="text-xs text-muted">
                  Déjà cliente ?{' '}
                  <Link href="/connexion?retour=/checkout" className="text-plum font-semibold hover:underline">
                    Connectez-vous
                  </Link>{' '}
                  pour retrouver vos informations. La commande sans compte est possible.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="co-firstName" className={LABEL}>Prénom *</label>
                  <input id="co-firstName" type="text" required autoComplete="given-name" value={formData.firstName} onChange={set('firstName')} className={INPUT} />
                </div>
                <div>
                  <label htmlFor="co-lastName" className={LABEL}>Nom *</label>
                  <input id="co-lastName" type="text" required autoComplete="family-name" value={formData.lastName} onChange={set('lastName')} className={INPUT} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="co-email" className={LABEL}>Email *</label>
                  <input id="co-email" type="email" required autoComplete="email" value={formData.email} onChange={set('email')} className={INPUT} />
                </div>
                <div>
                  <label htmlFor="co-phone" className={LABEL}>
                    Téléphone portable <span className="text-muted font-normal">(conseillé pour le suivi)</span>
                  </label>
                  <input id="co-phone" type="tel" autoComplete="tel" value={formData.phone} onChange={set('phone')} className={INPUT} />
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider active:scale-98 transition-all mt-2 flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Continuer vers la livraison</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          )}

          {/* Étape 2 : livraison ou retrait */}
          {step === 2 && (
            <form onSubmit={handleShippingSubmit} className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-dark">2. Mode de réception</h2>

              <div className="space-y-3" role="radiogroup" aria-label="Mode de réception">
                {pickupEnabled && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={shippingMethod === 'pickup'}
                    onClick={() => setShippingMethod('pickup')}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      shippingMethod === 'pickup'
                        ? 'border-plum bg-rose-light/50 shadow-xs ring-1 ring-plum/20'
                        : 'border-rose-powder/30 bg-white hover:border-plum/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Store className="w-5 h-5 text-plum mt-0.5 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-xs font-bold text-dark">Retrait en boutique L&apos;Atelier à Port-la-Nouvelle</p>
                          <p className="text-[11px] text-muted mt-0.5">
                            Gratuit. Un email vous prévient dès que votre commande est prête.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-eucalyptus uppercase shrink-0">Offert</span>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  role="radio"
                  aria-checked={shippingMethod === 'standard_delivery'}
                  onClick={() => setShippingMethod('standard_delivery')}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    shippingMethod === 'standard_delivery'
                      ? 'border-plum bg-rose-light/50 shadow-xs ring-1 ring-plum/20'
                      : 'border-rose-powder/30 bg-white hover:border-plum/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-plum mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold text-dark">Livraison suivie Colissimo à domicile</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          France métropolitaine. Emballage soigné et pochon cadeau inclus.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-dark shrink-0">
                      {deliveryIsFree ? <span className="text-eucalyptus">Offerte</span> : formatPrice(deliveryPrice)}
                    </span>
                  </div>
                </button>
              </div>

              {shippingMethod === 'standard_delivery' && (
                <div className="space-y-3 pt-4 border-t border-rose-powder/20">
                  <h3 className="text-xs font-bold uppercase text-dark">Adresse de livraison</h3>
                  <div>
                    <label htmlFor="co-address1" className={LABEL}>Numéro et voie *</label>
                    <input id="co-address1" type="text" required autoComplete="address-line1" value={formData.address1} onChange={set('address1')} className={INPUT} />
                  </div>
                  <div>
                    <label htmlFor="co-address2" className={LABEL}>Complément d&apos;adresse</label>
                    <input id="co-address2" type="text" autoComplete="address-line2" placeholder="Bâtiment, appartement, interphone" value={formData.address2} onChange={set('address2')} className={INPUT} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="co-postalCode" className={LABEL}>Code postal *</label>
                      <input id="co-postalCode" type="text" required inputMode="numeric" autoComplete="postal-code" maxLength={5} value={formData.postalCode} onChange={set('postalCode')} className={INPUT} />
                    </div>
                    <div>
                      <label htmlFor="co-city" className={LABEL}>Ville *</label>
                      <input id="co-city" type="text" required autoComplete="address-level2" value={formData.city} onChange={set('city')} className={INPUT} />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="co-note" className={LABEL}>Un mot pour Claire</label>
                <textarea id="co-note" rows={2} maxLength={600} placeholder="Emballage cadeau, précision sur la commande..." value={formData.customerNote} onChange={set('customerNote')} className={`${INPUT} resize-none`} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-6 py-3.5 min-h-[48px] rounded-full bg-cream-warm hover:bg-rose-powder/20 active:scale-95 text-dark text-xs font-semibold transition-all"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Continuer vers le paiement</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* Étape 3 : vérification et paiement */}
          {step === 3 && (
            <form onSubmit={handleOrderSubmit} className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-dark flex items-center justify-between">
                <span>3. Vérification et paiement</span>
                <Lock className="w-4 h-4 text-plum" aria-hidden="true" />
              </h2>

              <dl className="p-4 rounded-2xl bg-cream-warm border border-rose-powder/30 space-y-2 text-xs text-dark/80">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Commande au nom de</dt>
                  <dd className="font-semibold text-right">{formData.firstName} {formData.lastName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Confirmation envoyée à</dt>
                  <dd className="font-semibold text-right break-all">{formData.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Réception</dt>
                  <dd className="font-semibold text-right">
                    {shippingMethod === 'pickup'
                      ? "Retrait à la boutique L'Atelier"
                      : `${formData.address1}${formData.address2 ? `, ${formData.address2}` : ''}, ${formData.postalCode} ${formData.city}`}
                  </dd>
                </div>
              </dl>

              {paymentMode === 'stripe' && (
                <p className="p-3 rounded-xl bg-rose-light/40 border border-rose-powder/20 text-xs text-dark/80 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-plum shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Le paiement par carte se fait sur la page sécurisée de Stripe. Vos données bancaires ne passent jamais par notre site.
                  </span>
                </p>
              )}
              {paymentMode === 'simulation' && (
                <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2" role="note">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Boutique en mode démonstration : la commande est enregistrée mais aucun paiement n&apos;est prélevé.
                  </span>
                </p>
              )}
              {paymentMode === 'disabled' && (
                <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    La commande en ligne n&apos;est pas encore ouverte.{' '}
                    <Link href="/contact" className="font-semibold underline">Contactez la boutique</Link> pour réserver vos créations.
                  </span>
                </p>
              )}

              <label className="flex items-start gap-2.5 text-xs text-dark/80 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-plum shrink-0"
                />
                <span>
                  J&apos;ai lu et j&apos;accepte les{' '}
                  <Link href="/cgv" target="_blank" className="text-plum font-semibold underline">
                    conditions générales de vente
                  </Link>
                  .
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  disabled={isProcessing}
                  className="px-6 py-3.5 min-h-[48px] rounded-full bg-cream-warm hover:bg-rose-powder/20 active:scale-95 text-dark text-xs font-semibold transition-all disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || paymentMode === 'disabled'}
                  className="flex-1 min-h-[50px] py-4 rounded-full bg-gradient-to-r from-plum to-plum-dark text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {isProcessing
                      ? 'Validation en cours...'
                      : paymentMode === 'stripe'
                      ? `Payer ${formatPrice(total)}`
                      : `Valider la commande (${formatPrice(total)})`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Récapitulatif */}
        <aside className="lg:col-span-5 bg-cream-warm p-6 rounded-3xl border border-rose-powder/30 shadow-xs space-y-4" aria-label="Récapitulatif de la commande">
          <h2 className="font-serif text-lg font-bold text-dark flex items-center gap-2 pb-3 border-b border-rose-powder/20">
            <ShoppingBag className="w-4 h-4 text-plum" aria-hidden="true" />
            <span>Récapitulatif</span>
          </h2>

          <div className="divide-y divide-rose-powder/15 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId || 'def'}`} className="py-2.5 flex items-center gap-3">
                <ShopImage
                  src={item.image}
                  alt=""
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover border border-rose-powder/30 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-dark truncate">{item.name}</p>
                  {item.variantTitle && <p className="text-[10px] text-rose-old truncate">{item.variantTitle}</p>}
                  <p className="text-[11px] text-muted">Qté : {item.quantity}</p>
                </div>
                <span className="text-xs font-bold text-plum shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t border-rose-powder/20 text-xs text-dark/80">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {appliedPromo && discountAmount > 0 && (
              <div className="flex justify-between text-plum font-semibold">
                <span>Code {appliedPromo.code}</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            {appliedPromo && !promoActive && (
              <p className="text-[11px] text-amber-700">
                Le code {appliedPromo.code} s&apos;applique à partir de {formatPrice(appliedPromo.minOrderAmount)} d&apos;achat.
              </p>
            )}
            <div className="flex justify-between">
              <span>{shippingMethod === 'pickup' ? 'Retrait en boutique' : 'Livraison Colissimo'}</span>
              <span>
                {shippingCost === 0 ? <strong className="text-eucalyptus">Gratuit</strong> : formatPrice(shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-dark pt-2 border-t border-rose-powder/20">
              <span>Total TTC</span>
              <span className="font-serif text-xl text-plum">{formatPrice(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
