'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, MapPin, Heart, LogOut, ChevronDown, UserRound, Truck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/paths';
import ShopImage from '@/components/ui/ShopImage';
import { ORDER_STATUS_LABELS, type Order } from '@/lib/types';

type Tab = 'orders' | 'addresses' | 'profile';

const INPUT =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum bg-white';
const LABEL = 'text-xs font-semibold text-dark block mb-1';

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'en attente',
  COMPLETED: 'payé',
  FAILED: 'non abouti',
  REFUNDED: 'remboursé',
};

export default function AccountClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const { user, logout, isAdmin, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [profileMessage, setProfileMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  // Carnet d'adresses : les adresses de livraison déjà utilisées, sans doublon.
  const addresses = orders
    .filter((o) => o.shippingMethod !== 'pickup' && o.shippingAddress?.address1)
    .map((o) => o.shippingAddress)
    .filter(
      (a, i, all) =>
        all.findIndex((b) => b.address1 === a.address1 && b.postalCode === a.postalCode && b.city === a.city) === i
    );

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMessage(null);
    const result = await updateProfile(profile);
    setSaving(false);
    setProfileMessage(
      result.success ? { text: 'Vos informations sont enregistrées.' } : { text: result.error || 'Erreur.', error: true }
    );
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setPasswordMessage(null);
    const result = await updateProfile(passwords);
    setSaving(false);
    if (result.success) {
      setPasswords({ currentPassword: '', newPassword: '' });
      setPasswordMessage({ text: 'Votre mot de passe est modifié.' });
    } else {
      setPasswordMessage({ text: result.error || 'Erreur.', error: true });
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: typeof ShoppingBag }> = [
    { id: 'orders', label: `Mes commandes (${orders.length})`, icon: ShoppingBag },
    { id: 'addresses', label: 'Mes adresses', icon: MapPin },
    { id: 'profile', label: 'Mon profil', icon: UserRound },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-rose-powder/30 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-rose-light text-plum font-serif text-2xl font-bold flex items-center justify-center border border-rose-powder/40 shrink-0">
            {(user.firstName || 'C')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold text-dark">
              Bonjour, {user.firstName} {user.lastName}
            </h1>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-full bg-plum text-white text-xs font-semibold hover:bg-plum-dark transition-colors shadow-xs"
            >
              Ouvrir l&apos;administration
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/');
              router.refresh();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-rose-powder/30 hover:bg-rose-powder/50 text-dark text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-4 border-b border-rose-powder/20 overflow-x-auto scrollbar-none" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors relative flex items-center gap-2 shrink-0 ${
              activeTab === tab.id ? 'text-plum' : 'text-muted hover:text-dark'
            }`}
          >
            <tab.icon className="w-4 h-4" aria-hidden="true" />
            <span>{tab.label}</span>
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-plum" />}
          </button>
        ))}
        <Link
          href="/compte/favoris"
          className="pb-3 px-3 text-xs font-bold uppercase tracking-wider text-muted hover:text-dark flex items-center gap-2 shrink-0"
        >
          <Heart className="w-4 h-4 text-rose-old" aria-hidden="true" />
          <span>Mes favoris</span>
        </Link>
      </div>

      {/* Commandes */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-rose-powder/30 space-y-4">
              <ShoppingBag className="w-12 h-12 text-plum/50 mx-auto" aria-hidden="true" />
              <h2 className="font-serif text-lg font-bold text-dark">Vous n&apos;avez pas encore de commande</h2>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Explorez nos bijoux artisanaux faits main pour trouver votre coup de cœur.
              </p>
              <Link
                href="/boutique"
                className="inline-block px-6 py-3 rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const status = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
              const open = openOrderId === order.id;
              const tracking = order.trackingNumber;
              return (
                <div
                  key={order.id}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-rose-powder/30 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-dark">{order.orderNumber}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR')} • {order.items?.length || 0} article
                        {(order.items?.length || 0) > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-serif text-lg font-bold text-plum">{formatPrice(order.total)}</span>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenOrderId(open ? null : order.id)}
                        className="px-3.5 py-2 rounded-full bg-cream-warm hover:bg-rose-powder/30 text-dark text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <span>{open ? 'Masquer' : 'Voir le détail'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="pt-4 border-t border-rose-powder/20 space-y-4 animate-in fade-in">
                      <div className="divide-y divide-rose-powder/15 bg-cream-warm/60 px-4 rounded-xl">
                        {order.items?.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <ShopImage
                                src={item.imageUrl}
                                alt=""
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-lg object-cover border border-rose-powder/20 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-dark truncate">{item.productName}</p>
                                {item.variantTitle && <p className="text-[10px] text-rose-old">{item.variantTitle}</p>}
                                <p className="text-[11px] text-muted">Qté : {item.quantity}</p>
                              </div>
                            </div>
                            <span className="font-bold text-plum shrink-0">{formatPrice(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-dark/80 p-4 bg-white rounded-xl border border-rose-powder/20">
                        <div>
                          <p className="font-bold text-plum mb-1">Réception</p>
                          <p>
                            {order.shippingMethod === 'pickup'
                              ? "Retrait gratuit à la boutique L'Atelier (Port-la-Nouvelle)"
                              : 'Livraison Colissimo à domicile'}
                          </p>
                          {order.shippingMethod !== 'pickup' && order.shippingAddress?.address1 && (
                            <p className="text-[11px] text-muted mt-1">
                              {order.shippingAddress.address1}
                              {order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ''},{' '}
                              {order.shippingAddress.postalCode} {order.shippingAddress.city}
                            </p>
                          )}
                          {tracking && (
                            <a
                              href={`https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(tracking)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 text-plum font-semibold hover:underline"
                            >
                              <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                              Suivre mon colis ({tracking})
                            </a>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-plum mb-1">Montant</p>
                          <p>Articles : {formatPrice(order.subtotal)}</p>
                          {order.discountAmount > 0 && <p>Réduction : -{formatPrice(order.discountAmount)}</p>}
                          <p>Livraison : {order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'gratuite'}</p>
                          <p className="text-[11px] text-muted mt-1">
                            Paiement {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
                            {order.paymentMethod === 'simulation' ? ' (mode démonstration)' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Adresses */}
      {activeTab === 'addresses' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-powder/30 space-y-4">
          <h2 className="font-serif text-lg font-bold text-dark">Mes adresses de livraison</h2>
          {addresses.length === 0 ? (
            <p className="text-xs text-muted">
              Aucune adresse enregistrée pour le moment. Elle sera ajoutée ici après votre première commande livrée à domicile.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((a, i) => (
                <div key={i} className="p-4 rounded-2xl border border-rose-powder/30 bg-cream-warm text-xs text-muted">
                  <p className="font-bold text-sm text-dark">{a.name || `${user.firstName} ${user.lastName}`}</p>
                  <p>{a.address1}</p>
                  {a.address2 && <p>{a.address2}</p>}
                  <p>
                    {a.postalCode} {a.city}, {a.country || 'France'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profil */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleProfileSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-powder/30 space-y-4">
            <h2 className="font-serif text-lg font-bold text-dark">Mes informations</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="acc-firstName" className={LABEL}>Prénom</label>
                <input id="acc-firstName" type="text" required autoComplete="given-name" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label htmlFor="acc-lastName" className={LABEL}>Nom</label>
                <input id="acc-lastName" type="text" required autoComplete="family-name" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className={INPUT} />
              </div>
            </div>
            <div>
              <label htmlFor="acc-phone" className={LABEL}>Téléphone</label>
              <input id="acc-phone" type="tel" autoComplete="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={INPUT} />
            </div>
            <p className="text-[11px] text-muted">Email du compte : {user.email}</p>
            {profileMessage && (
              <p className={`text-xs ${profileMessage.error ? 'text-red-700' : 'text-eucalyptus font-medium'}`} role="status">
                {profileMessage.text}
              </p>
            )}
            <button type="submit" disabled={saving} className="px-6 py-3 rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50">
              Enregistrer
            </button>
          </form>

          <form onSubmit={handlePasswordSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-powder/30 space-y-4">
            <h2 className="font-serif text-lg font-bold text-dark">Changer de mot de passe</h2>
            <div>
              <label htmlFor="acc-current" className={LABEL}>Mot de passe actuel</label>
              <input id="acc-current" type="password" required autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label htmlFor="acc-new" className={LABEL}>Nouveau mot de passe</label>
              <input id="acc-new" type="password" required minLength={8} autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className={INPUT} />
              <p className="text-[11px] text-muted mt-1">8 caractères minimum.</p>
            </div>
            {passwordMessage && (
              <p className={`text-xs ${passwordMessage.error ? 'text-red-700' : 'text-eucalyptus font-medium'}`} role="status">
                {passwordMessage.text}
              </p>
            )}
            <button type="submit" disabled={saving} className="px-6 py-3 rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50">
              Modifier le mot de passe
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
