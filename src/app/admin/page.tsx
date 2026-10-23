'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Package,
  Eye,
  Store,
  Sparkles
} from 'lucide-react';
import { Order, Product } from '@/lib/store';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/analytics').then((r) => r.json()),
    ])
      .then(([ords, prods, stats]) => {
        if (Array.isArray(ords)) setOrders(ords);
        if (Array.isArray(prods)) setProducts(prods);
        if (stats) setAnalytics(stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
    .reduce((sum, o) => sum + o.total, 0);

  const averageCart = orders.length > 0 ? totalRevenue / orders.length : 0;
  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);

  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
    PAID: { label: 'Payée', color: 'bg-blue-100 text-blue-800' },
    CONFIRMED: { label: 'Confirmée', color: 'bg-indigo-100 text-indigo-800' },
    PREPARING: { label: 'En préparation', color: 'bg-purple-100 text-purple-800' },
    READY_FOR_PICKUP: { label: 'Prête à l\'Atelier', color: 'bg-emerald-100 text-emerald-800' },
    SHIPPED: { label: 'Expédiée', color: 'bg-teal-100 text-teal-800' },
    DELIVERED: { label: 'Terminée', color: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    REFUNDED: { label: 'Remboursée', color: 'bg-gray-100 text-gray-800' },
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Tableau de bord</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Aperçu des ventes, des commandes et des stocks de l&apos;atelier en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/produits"
            className="px-4 py-2 bg-plum hover:bg-plum-dark text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            <span>Ajouter une création</span>
          </Link>
        </div>
      </div>

      {/* Cartes KPI (Aujourd'hui, semaine, mois) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Chiffre d'Affaires */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Chiffre d&apos;Affaires
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 font-serif">
              {totalRevenue.toFixed(2)} €
            </div>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +14.2% ce mois
            </p>
          </div>
        </div>

        {/* Commandes */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Commandes Totales
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 font-serif">
              {orders.length}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Dont {orders.filter((o) => o.shippingMethod === 'pickup').length} en retrait à Port-la-Nouvelle
            </p>
          </div>
        </div>

        {/* Panier Moyen */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Panier Moyen
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 font-serif">
              {averageCart.toFixed(2)} €
            </div>
            <p className="text-[11px] text-purple-600 font-medium mt-1">
              Excellente valeur par client
            </p>
          </div>
        </div>

        {/* Alertes Stocks Faibles */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Stocks Faibles (&lt; 3)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700 font-serif">
              {lowStockProducts.length}
            </div>
            <Link
              href="/admin/stocks"
              className="text-[11px] text-amber-800 font-semibold hover:underline block mt-1"
            >
              Gérer l&apos;inventaire →
            </Link>
          </div>
        </div>
      </div>

      {/* Graphique d'évolution des ventes et répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graphique Ventes Hebdomadaires */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Activité des Ventes Récentes</h2>
            <span className="text-xs text-gray-500">7 derniers jours</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-gray-100 pb-2">
            {[
              { day: 'Lun', height: '40%', val: '63 €' },
              { day: 'Mar', height: '60%', val: '95 €' },
              { day: 'Mer', height: '30%', val: '45 €' },
              { day: 'Jeu', height: '80%', val: '124 €' },
              { day: 'Ven', height: '55%', val: '88 €' },
              { day: 'Sam', height: '90%', val: '142 €' },
              { day: 'Dim', height: '70%', val: '110 €' },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-[10px] font-bold text-plum opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.val}
                </div>
                <div
                  className="w-full max-w-[36px] bg-gradient-to-t from-plum to-rose-old rounded-t-lg transition-all group-hover:brightness-110"
                  style={{ height: bar.height }}
                />
                <span className="text-[11px] font-medium text-gray-500">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition des canaux (Instagram, Google, Direct) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Sources de Trafic</h2>
          <div className="space-y-3 pt-2">
            {[
              { name: 'Instagram', percent: 54, color: 'bg-rose-500' },
              { name: 'Facebook', percent: 22, color: 'bg-blue-600' },
              { name: 'Recherche Google', percent: 16, color: 'bg-emerald-500' },
              { name: 'Direct / Bouche à oreille', percent: 8, color: 'bg-amber-500' },
            ].map((src, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">{src.name}</span>
                  <span className="font-bold text-gray-900">{src.percent}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${src.color} rounded-full`} style={{ width: `${src.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grille inférieure : Dernières commandes & Produits en alerte */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dernières Commandes */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Dernières Commandes</h2>
            <Link href="/admin/commandes" className="text-xs font-semibold text-plum hover:underline">
              Voir tout ({orders.length}) →
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {orders.slice(0, 4).map((order) => {
              const status = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
              return (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {order.customerFirstName} {order.customerLastName} •{' '}
                      {order.shippingMethod === 'pickup' ? (
                        <span className="text-plum font-semibold">Retrait atelier</span>
                      ) : (
                        <span className="text-blue-700 font-semibold">
                          Colissimo {order.shippingAddress?.city ? `(${order.shippingAddress.city})` : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 font-serif text-sm">
                      {order.total.toFixed(2)} €
                    </span>
                    <p className="text-[10px] text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Produits en alerte stock */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Alertes de Stock</h2>
            <Link href="/admin/stocks" className="text-xs font-semibold text-plum hover:underline">
              Gérer →
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={p.images?.[0]?.url || '/images/hero-atelier.jpg'}
                    alt={p.name}
                    className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                  />
                  <div>
                    <p className="font-semibold text-gray-800 truncate max-w-[130px]">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.reference}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                  {p.stock} restant{p.stock > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
