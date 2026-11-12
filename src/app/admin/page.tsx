'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ShoppingBag, CreditCard, AlertTriangle, Package } from 'lucide-react';
import type { AnalyticsReport } from '@/lib/analytics';
import { apiFetch, formatPrice, withBase } from '@/lib/paths';
import LaunchChecklist from '@/components/admin/LaunchChecklist';
import { ORDER_STATUS_LABELS, type Order } from '@/lib/types';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/orders').then((r) => (r.ok ? r.json() : Promise.reject())),
      apiFetch('/api/analytics?days=7').then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([ords, stats]) => {
        if (Array.isArray(ords)) setOrders(ords);
        setReport(stats);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Chargement du tableau de bord...</p>;
  if (error || !report) {
    return (
      <p className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
        Les données n&apos;ont pas pu être chargées. Rechargez la page ou reconnectez-vous.
      </p>
    );
  }

  const lowStock = report.lowStockProducts;
  const change = report.revenueChangePercent;
  const maxRevenue = Math.max(1, ...report.daily.map((d) => d.revenue));
  const toPrepare = orders.filter((o) => ['PAID', 'CONFIRMED', 'PREPARING'].includes(o.status)).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Tableau de bord</h1>
          <p className="text-xs text-gray-500 mt-0.5">Ventes, commandes et stocks de l&apos;atelier.</p>
        </div>
        <Link
          href="/admin/produits"
          className="px-4 py-2.5 bg-plum hover:bg-plum-dark text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start"
        >
          <Package className="w-4 h-4" aria-hidden="true" />
          <span>Ajouter une création</span>
        </Link>
      </div>

      <LaunchChecklist hideWhenDone />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ventes sur 7 jours</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 font-serif">{formatPrice(report.totalRevenue)}</div>
            {change === null ? (
              <p className="text-[11px] text-gray-500 mt-1">Total depuis l&apos;ouverture : {formatPrice(report.allTime.revenue)}</p>
            ) : (
              <p className={`text-[11px] font-medium flex items-center gap-1 mt-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="w-3 h-3" aria-hidden="true" /> : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
                {change >= 0 ? '+' : ''}
                {change} % par rapport aux 7 jours précédents
              </p>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Commandes à traiter</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 font-serif">{toPrepare}</div>
            <p className="text-[11px] text-gray-500 mt-1">
              {report.allTime.orders} vente{report.allTime.orders > 1 ? 's' : ''} depuis l&apos;ouverture
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Panier moyen</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 font-serif">{formatPrice(report.allTime.averageCart)}</div>
            <p className="text-[11px] text-gray-500 mt-1">Sur toutes les ventes</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stocks faibles</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700 font-serif">{lowStock.length}</div>
            <Link href="/admin/stocks" className="text-[11px] text-amber-800 font-semibold hover:underline block mt-1">
              Gérer l&apos;inventaire
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Ventes des 7 derniers jours</h2>
            <span className="text-xs text-gray-500">
              {report.totalOrders} commande{report.totalOrders > 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-gray-100 pb-2">
            {report.daily.map((day) => (
              <div key={day.date} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                <div className="text-[10px] font-bold text-plum h-3">{day.revenue > 0 ? formatPrice(day.revenue) : ''}</div>
                <div
                  className={`w-full max-w-[36px] rounded-t-lg ${day.revenue > 0 ? 'bg-gradient-to-t from-plum to-rose-old' : 'bg-gray-100'}`}
                  style={{ height: day.revenue > 0 ? `${Math.max(6, (day.revenue / maxRevenue) * 70)}%` : '3px' }}
                  title={`${day.orders} commande${day.orders > 1 ? 's' : ''}`}
                />
                <span className="text-[11px] font-medium text-gray-500 capitalize">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Provenance des visites</h2>
            <span className="text-xs text-gray-500">7 jours</span>
          </div>
          {report.trafficSources.length === 0 ? (
            <p className="text-xs text-gray-500">
              Pas encore de visite mesurée sur cette période. Les chiffres se remplissent au fil des passages sur la boutique.
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              {report.trafficSources.map((src) => (
                <div key={src.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700">{src.name}</span>
                    <span className="font-bold text-gray-900">{src.percent} %</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-plum/80 rounded-full" style={{ width: `${src.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/analytics" className="text-xs font-semibold text-plum hover:underline inline-block">
            Voir les statistiques
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Dernières commandes</h2>
            <Link href="/admin/commandes" className="text-xs font-semibold text-plum hover:underline">
              Voir tout ({orders.length})
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">Aucune commande pour le moment.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.slice(0, 5).map((order) => {
                const status = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
                return (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
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
                    <div className="text-right shrink-0">
                      <span className="font-bold text-gray-900 font-serif text-sm">{formatPrice(order.total)}</span>
                      <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Alertes de stock</h2>
            <Link href="/admin/stocks" className="text-xs font-semibold text-plum hover:underline">
              Gérer
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">Tous les stocks sont au-dessus de leur seuil d&apos;alerte.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {lowStock.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={withBase(p.images?.[0]?.url || '/images/hero-atelier.jpg')}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.reference}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[11px] shrink-0 ${
                      p.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.stock === 0 ? 'Rupture' : `${p.stock} restant${p.stock > 1 ? 's' : ''}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
