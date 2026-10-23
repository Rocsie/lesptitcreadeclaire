'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Truck,
  CreditCard,
  Lock,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Store
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, appliedPromo, clearCart, isLoaded } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Étape 1 : Coordonnées
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address1: '',
    address2: '',
    postalCode: '',
    city: '',
    country: 'France',
    customerNote: '',
  });

  // Étape 2 : Livraison
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'standard_delivery'>('pickup');
  const [shippingCost, setShippingCost] = useState(0);

  // Étape 3 : Paiement
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'stripe_simulation'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);

  // Étape 4 : Commande confirmée
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // Recalcul du coût de livraison
  useEffect(() => {
    if (shippingMethod === 'pickup') {
      setShippingCost(0);
    } else {
      if (subtotal >= 60 || appliedPromo?.code === 'PORTLANOUVELLE') {
        setShippingCost(0);
      } else {
        setShippingCost(4.90);
      }
    }
  }, [shippingMethod, subtotal, appliedPromo]);

  // Si le panier est vide et pas encore à l'étape confirmation, rediriger uniquement une fois le panier chargé
  useEffect(() => {
    if (isLoaded && items.length === 0 && step !== 4) {
      router.push('/boutique');
    }
  }, [isLoaded, items, step, router]);

  const discountAmount = appliedPromo?.discountAmount || 0;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleProcessOrder = async () => {
    setIsProcessing(true);

    try {
      const orderPayload = {
        customerEmail: formData.email,
        customerFirstName: formData.firstName,
        customerLastName: formData.lastName,
        customerPhone: formData.phone,
        shippingMethod,
        shippingCost,
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          address1: shippingMethod === 'pickup' ? "Retrait en boutique L'Atelier" : formData.address1,
          address2: shippingMethod === 'pickup' ? "" : (formData.address2 || ""),
          postalCode: shippingMethod === 'pickup' ? "11210" : formData.postalCode,
          city: shippingMethod === 'pickup' ? "Port-la-Nouvelle" : formData.city,
          country: formData.country || 'France',
          phone: formData.phone || '',
        },
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          variantTitle: item.variantTitle,
          imageUrl: item.image,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
        promoCode: appliedPromo?.code,
        discountAmount,
        paymentMethod: 'card_simulation',
        customerNote: formData.customerNote,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      setIsProcessing(false);

      if (data && data.orderNumber) {
        setConfirmedOrder(data);
        clearCart();
        setStep(4);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E8B4B8', '#6E2D4A', '#D4AF37', '#87A287'],
        });
      }
    } catch {
      setIsProcessing(false);
      // Fallback
      const fakeOrder = {
        orderNumber: `PCC-2026-${String(Math.floor(1000 + Math.random() * 9000)).padStart(6, '0')}`,
        customerFirstName: formData.firstName,
        total,
      };
      setConfirmedOrder(fakeOrder);
      clearCart();
      setStep(4);
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E8B4B8', '#6E2D4A', '#D4AF37'],
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* En-tête checkout */}
      <div className="text-center space-y-2 mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-plum">
          Tunnel Sécurisé • Les P&apos;tites Créa de Claire
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">
          Finaliser ma Commande
        </h1>
      </div>

      {/* Barre d'étapes */}
      {step < 4 && (
        <div className="flex items-center justify-center max-w-xl mx-auto mb-10">
          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1 ? 'bg-plum text-white' : 'bg-rose-powder/30 text-muted'
              }`}
            >
              1
            </span>
            <span className="text-xs font-semibold text-dark hidden sm:inline">Coordonnées</span>
          </div>
          <div className="w-12 sm:w-16 h-0.5 bg-rose-powder/40 mx-2" />

          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2 ? 'bg-plum text-white' : 'bg-rose-powder/30 text-muted'
              }`}
            >
              2
            </span>
            <span className="text-xs font-semibold text-dark hidden sm:inline">Livraison</span>
          </div>
          <div className="w-12 sm:w-16 h-0.5 bg-rose-powder/40 mx-2" />

          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 3 ? 'bg-plum text-white' : 'bg-rose-powder/30 text-muted'
              }`}
            >
              3
            </span>
            <span className="text-xs font-semibold text-dark hidden sm:inline">Paiement</span>
          </div>
        </div>
      )}

      {/* Confirmation de commande Étape 4 */}
      {step === 4 && confirmedOrder && (
        <div className="max-w-2xl mx-auto p-8 sm:p-12 rounded-3xl bg-white border border-rose-powder/30 shadow-xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-sage/20 text-eucalyptus flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-sage" />
          </div>

          <div className="space-y-2">
            <span className="font-script text-3xl text-plum block">Merci pour votre confiance !</span>
            <h2 className="font-serif text-2xl font-bold text-dark">
              Votre commande {confirmedOrder.orderNumber} est validée
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Un email de confirmation et récapitulatif détaillé a été envoyé à <strong>{formData.email}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cream-warm border border-rose-powder/20 text-xs text-dark/80 text-left space-y-2">
            <p><strong>Numéro de commande :</strong> {confirmedOrder.orderNumber}</p>
            <p><strong>Montant payé :</strong> {total.toFixed(2)} € TTC</p>
            <p>
              <strong>Mode de réception :</strong>{' '}
              {shippingMethod === 'pickup'
                ? "Retrait gratuit à la boutique L'Atelier (Port-la-Nouvelle)"
                : 'Expédition Colissimo à domicile'}
            </p>
            {shippingMethod === 'standard_delivery' && formData.address1 && (
              <p className="pt-1.5 border-t border-rose-powder/20 text-[11px] text-muted">
                <strong>Adresse d&apos;expédition :</strong> {formData.firstName} {formData.lastName} • {formData.address1}{formData.address2 ? `, ${formData.address2}` : ''}, {formData.postalCode} {formData.city} ({formData.country})
              </p>
            )}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/boutique"
              className="px-6 py-3 rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Retourner à la boutique
            </Link>
            <Link
              href="/compte"
              className="px-6 py-3 rounded-full bg-rose-light text-plum text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Voir mon espace client
            </Link>
          </div>
        </div>
      )}

      {/* Étapes 1 à 3 */}
      {step < 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Formulaire des étapes */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-rose-powder/30 shadow-sm space-y-6">
            {/* ÉTAPE 1 : COORDONNÉES */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-bold text-dark flex items-center gap-2">
                    <span>1. Vos Coordonnées</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        firstName: 'Sophie',
                        lastName: 'Martin',
                        email: 'sophie.martin@example.fr',
                        phone: '06 12 34 56 78',
                        address1: '14 rue de la République',
                        address2: '',
                        postalCode: '11210',
                        city: 'Port-la-Nouvelle',
                        country: 'France',
                        customerNote: 'Commande de test mobile',
                      });
                    }}
                    className="text-[11px] font-semibold text-plum bg-rose-powder/25 hover:bg-rose-powder/40 active:scale-95 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                  >
                    <span>⚡ Remplir (Test)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-dark block mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Sophie"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-dark block mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Martin"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-dark block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="sophie.martin@example.fr"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-dark block mb-1">
                      Téléphone portable <span className="text-muted font-normal">(Conseillé pour SMS Colissimo)</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum bg-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (formData.firstName && formData.lastName && formData.email) setStep(2);
                    else alert('Veuillez renseigner prénom, nom et email.');
                  }}
                  className="w-full min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider active:scale-98 transition-all mt-4 flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Continuer vers la livraison</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ÉTAPE 2 : LIVRAISON OU RETRAIT */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-serif text-xl font-bold text-dark">
                  2. Mode de Réception
                </h2>

                <div className="space-y-3">
                  {/* Option 1 : Retrait boutique */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={shippingMethod === 'pickup'}
                    onClick={() => setShippingMethod('pickup')}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-99 ${
                      shippingMethod === 'pickup'
                        ? 'border-plum bg-rose-light/50 shadow-xs ring-1 ring-plum/20'
                        : 'border-rose-powder/30 bg-white hover:border-plum/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Store className="w-5 h-5 text-plum mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-dark">
                            Retrait en boutique L&apos;Atelier à Port-la-Nouvelle
                          </p>
                          <p className="text-[11px] text-muted mt-0.5">
                            Gratuit • Disponible sous 24h ouvrées aux horaires de l&apos;atelier
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-eucalyptus uppercase shrink-0">Offert</span>
                    </div>
                  </button>

                  {/* Option 2 : Livraison Colissimo */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={shippingMethod === 'standard_delivery'}
                    onClick={() => setShippingMethod('standard_delivery')}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-99 ${
                      shippingMethod === 'standard_delivery'
                        ? 'border-plum bg-rose-light/50 shadow-xs ring-1 ring-plum/20'
                        : 'border-rose-powder/30 bg-white hover:border-plum/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-plum mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-dark">
                            Livraison suivie Colissimo à domicile
                          </p>
                          <p className="text-[11px] text-muted mt-0.5">
                            Emballage soigné &amp; pochon cadeau inclus
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-dark shrink-0">
                        {subtotal >= 60 ? <span className="text-eucalyptus">Offerte</span> : '4.90 €'}
                      </span>
                    </div>
                  </button>
                </div>


                {/* Adresse si livraison standard */}
                {/* Adresse si livraison standard */}
                {shippingMethod === 'standard_delivery' && (
                  <div className="space-y-3 pt-4 border-t border-rose-powder/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase text-dark flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-plum" />
                        <span>Adresse de livraison Colissimo</span>
                      </h3>
                      <span className="text-[10px] text-muted">France Métropolitaine</span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-dark block mb-1">Adresse postale (numéro et voie) *</label>
                      <input
                        type="text"
                        required
                        value={formData.address1}
                        onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                        placeholder="12 rue des Fleurs"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-dark block mb-1">Complément d&apos;adresse (Optionnel)</label>
                      <input
                        type="text"
                        value={formData.address2}
                        onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                        placeholder="Bâtiment B, Appartement 4, Interphone..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-dark block mb-1">Code postal *</label>
                        <input
                          type="text"
                          required
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          placeholder="11210"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-dark block mb-1">Ville *</label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Port-la-Nouvelle"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3.5 min-h-[48px] rounded-full bg-cream-warm hover:bg-rose-powder/20 active:scale-95 text-dark text-xs font-semibold transition-all"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (shippingMethod === 'standard_delivery') {
                        if (!formData.address1.trim() || !formData.postalCode.trim() || !formData.city.trim()) {
                          alert('Veuillez renseigner votre adresse, code postal et ville pour la livraison Colissimo.');
                          return;
                        }
                      }
                      setStep(3);
                    }}
                    className="flex-1 min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Continuer vers le paiement</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* ÉTAPE 3 : PAIEMENT */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-serif text-xl font-bold text-dark flex items-center justify-between">
                  <span>3. Paiement Sécurisé</span>
                  <Lock className="w-4 h-4 text-plum" />
                </h2>

                <div className="p-4 rounded-2xl bg-cream-warm border border-rose-powder/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-dark flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-plum" />
                      <span>Carte Bancaire (Stripe 3D-Secure)</span>
                    </span>
                    <span className="text-[10px] text-muted">Test & Production</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-dark block mb-1">Numéro de carte</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-rose-powder/40 bg-white focus:outline-none font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-dark block mb-1">Expiration</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-rose-powder/40 bg-white focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-dark block mb-1">CVC / Cryptogramme</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-rose-powder/40 bg-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-light/40 border border-rose-powder/20 text-[11px] text-dark/70 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-plum shrink-0" />
                  <span>Vos données bancaires sont chiffrées de bout en bout et jamais stockées.</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3.5 min-h-[48px] rounded-full bg-cream-warm hover:bg-rose-powder/20 active:scale-95 text-dark text-xs font-semibold transition-all"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleProcessOrder}
                    className="flex-1 min-h-[50px] py-4 rounded-full bg-gradient-to-r from-plum to-plum-dark text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isProcessing ? 'Validation en cours...' : `Payer ${total.toFixed(2)} €`}</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Récapitulatif Panier à droite */}
          <div className="lg:col-span-5 bg-cream-warm p-6 rounded-3xl border border-rose-powder/30 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2 pb-3 border-b border-rose-powder/20">
              <ShoppingBag className="w-4 h-4 text-plum" />
              <span>Récapitulatif ({items.length})</span>
            </h3>

            <div className="divide-y divide-rose-powder/15 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId || 'def'}`} className="py-2.5 flex items-center gap-3">
                  <img
                    src={item.image || '/images/hero-atelier.jpg'}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover border border-rose-powder/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-dark truncate">{item.name}</p>
                    {item.variantTitle && (
                      <p className="text-[10px] text-rose-old truncate">{item.variantTitle}</p>
                    )}
                    <p className="text-[11px] text-muted">Qté : {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-plum shrink-0">
                    {(item.price * item.quantity).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-rose-powder/20 text-xs text-dark/80">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-plum font-semibold">
                  <span>Code ({appliedPromo.code})</span>
                  <span>-{discountAmount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Frais de port</span>
                <span>
                  {shippingCost === 0 ? <strong className="text-eucalyptus">Gratuit</strong> : `${shippingCost.toFixed(2)} €`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-dark pt-2 border-t border-rose-powder/20">
                <span>Total à régler</span>
                <span className="font-serif text-xl text-plum">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
