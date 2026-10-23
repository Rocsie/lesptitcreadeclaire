'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  ShoppingBag,
  MapPin,
  Heart,
  LogOut,
  Clock,
  CheckCircle2,
  Package,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/lib/store';

export default function CustomerAccountPage() {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');

  useEffect(() => {
    if (!user) {
      router.push('/connexion');
      return;
    }

    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filtrer par email si disponible
          setOrders(data);
        }
      })
      .catch(() => {});
  }, [user, router]);

  if (!user) return null;

  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
    PAID: { label: 'Payée', color: 'bg-blue-100 text-blue-800' },
    CONFIRMED: { label: 'Confirmée', color: 'bg-indigo-100 text-indigo-800' },
    PREPARING: { label: 'En préparation', color: 'bg-purple-100 text-purple-800' },
    READY_FOR_PICKUP: { label: 'Prête à la boutique', color: 'bg-emerald-100 text-emerald-800' },
    SHIPPED: { label: 'Expédiée', color: 'bg-teal-100 text-teal-800' },
    DELIVERED: { label: 'Livrée / Retirée', color: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    REFUNDED: { label: 'Remboursée', color: 'bg-gray-100 text-gray-800' },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* En-tête profil */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-rose-powder/30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-rose-light text-plum font-serif text-2xl font-bold flex items-center justify-center border border-rose-powder/40">
            {user.firstName ? user.firstName[0] : 'C'}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-dark">
              Bonjour, {user.firstName} {user.lastName}
            </h1>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="px-4 py-2 rounded-full bg-plum text-white text-xs font-semibold hover:bg-plum-dark transition-colors shadow-xs"
            >
              Accéder au Dashboard Admin
            </Link>
          )}
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-powder/30 hover:bg-rose-powder/50 text-dark text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Onglets navigation */}
      <div className="flex gap-4 border-b border-rose-powder/20 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors relative flex items-center gap-2 ${
            activeTab === 'orders' ? 'text-plum' : 'text-muted hover:text-dark'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Mes Commandes ({orders.length})</span>
          {activeTab === 'orders' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-plum" />}
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors relative flex items-center gap-2 ${
            activeTab === 'addresses' ? 'text-plum' : 'text-muted hover:text-dark'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Mes Adresses</span>
          {activeTab === 'addresses' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-plum" />}
        </button>

        <Link
          href="/compte/favoris"
          className="pb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted hover:text-dark flex items-center gap-2"
        >
          <Heart className="w-4 h-4 text-rose-old" />
          <span>Mes Favoris</span>
        </Link>
      </div>

      {/* CONTENU ONGLETS */}

      {/* 1. Onglet Commandes */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-rose-powder/30 space-y-4">
              <ShoppingBag className="w-12 h-12 text-plum/50 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-dark">Vous n&apos;avez pas encore de commande</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Explorez nos bijoux artisanaux faits main pour trouver votre coup de cœur.
              </p>
              <Link
                href="/boutique"
                className="inline-block px-6 py-2.5 rounded-full bg-plum text-white text-xs font-semibold uppercase tracking-wider"
              >
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order) => {
                const statusInfo = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
                return (
                  <div
                    key={order.id}
                    className="p-6 rounded-2xl bg-white border border-rose-powder/30 shadow-xs space-y-4 hover:border-plum/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-rose-powder/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-dark">{order.orderNumber}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR')} • {order.items?.length || 0} article(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-serif text-lg font-bold text-plum">
                          {order.total.toFixed(2)} €
                        </span>
                        <button
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="px-3 py-1.5 rounded-full bg-cream-warm hover:bg-rose-powder/30 text-dark text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <span>{selectedOrder?.id === order.id ? 'Masquer détails' : 'Voir détails'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Détails déroulants de la commande */}
                    {selectedOrder?.id === order.id && (
                      <div className="pt-2 space-y-4 animate-in fade-in duration-200">
                        <div className="divide-y divide-rose-powder/15 bg-cream-warm/60 p-4 rounded-xl">
                          {order.items?.map((item) => (
                            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.imageUrl || '/images/hero-atelier.jpg'}
                                  alt={item.productName}
                                  className="w-10 h-10 rounded-lg object-cover border border-rose-powder/20"
                                />
                                <div>
                                  <p className="font-semibold text-dark">{item.productName}</p>
                                  {item.variantTitle && (
                                    <p className="text-[10px] text-rose-old">{item.variantTitle}</p>
                                  )}
                                  <p className="text-[11px] text-muted">Qté : {item.quantity}</p>
                                </div>
                              </div>
                              <span className="font-bold text-plum">{item.totalPrice.toFixed(2)} €</span>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-dark/80 p-3 bg-white rounded-xl border border-rose-powder/20">
                          <div>
                            <p className="font-bold text-plum mb-1">Mode de livraison :</p>
                            <p>
                              {order.shippingMethod === 'pickup'
                                ? "Retrait gratuit à la boutique L'Atelier (Port-la-Nouvelle)"
                                : 'Livraison Colissimo à domicile'}
                            </p>
                            {order.shippingMethod !== 'pickup' && order.shippingAddress?.address1 && (
                              <p className="text-[11px] text-muted mt-1">
                                <strong>Adresse :</strong> {order.shippingAddress.address1}{order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ''}, {order.shippingAddress.postalCode} {order.shippingAddress.city}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-plum mb-1">Paiement :</p>
                            <p>Carte Bancaire sécurisée (Statut: {order.paymentStatus})</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Onglet Adresses */}
      {activeTab === 'addresses' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-powder/30 space-y-4">
          <h3 className="font-serif text-lg font-bold text-dark">Mon Carnet d&apos;Adresses</h3>
          <div className="p-4 rounded-2xl border border-rose-powder/30 bg-cream-warm flex justify-between items-start">
            <div>
              <span className="badge-artisan mb-2">Adresse par défaut</span>
              <p className="font-bold text-sm text-dark mt-1">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted">14 Rue de la Mer</p>
              <p className="text-xs text-muted">11210 Port-la-Nouvelle, France</p>
              <p className="text-xs text-muted mt-1">Tél : {user.phone || 'Non renseigné'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
