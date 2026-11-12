'use client';

import React, { useState, useEffect } from 'react';
import type { AnalyticsReport } from '@/lib/analytics';
import { apiFetch, formatPrice } from '@/lib/paths';

const PERIODS = [
  { days: 1, label: "Aujourd'hui" },
  { days: 7, label: '7 derniers jours' },
  { days: 30, label: '30 derniers jours' },
];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(7);
  const [reports, setReports] = useState<Record<number, AnalyticsReport>>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/analytics?days=${days}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: AnalyticsReport) => {
        if (!cancelled) setReports((prev) => ({ ...prev, [days]: data }));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const stats = reports[days];

  const funnel = stats
    ? [
        { label: 'Visiteuses', value: stats.totalVisitors },
        { label: 'Fiches produits consultées', value: stats.productViews },
        { label: 'Ajouts au panier', value: stats.addToCart },
        { label: 'Commandes commencées', value: stats.checkouts },
        { label: 'Commandes payées', value: stats.totalOrders },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Statistiques</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Visites mesurées par le site, sans cookie, et ventes réelles de la boutique.
          </p>
        </div>

        <div className="flex bg-white rounded-xl border border-gray-200 p-1 text-xs font-semibold self-start" role="group" aria-label="Période">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              aria-pressed={days === p.days}
              onClick={() => setDays(p.days)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                days === p.days ? 'bg-plum text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && !stats && (
        <p className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          Les statistiques n&apos;ont pas pu être chargées. Rechargez la page.
        </p>
      )}
      {!stats && !error && <p className="text-xs text-gray-500">Chargement des statistiques...</p>}

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Visiteuses uniques</span>
              <div className="text-2xl font-bold text-gray-900 font-serif">{stats.totalVisitors}</div>
              <p className="text-[11px] text-gray-400">Comptées une fois par jour</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Pages vues</span>
              <div className="text-2xl font-bold text-gray-900 font-serif">{stats.pageViews}</div>
              <p className="text-[11px] text-gray-400">
                {stats.totalVisitors > 0
                  ? `${(stats.pageViews / stats.totalVisitors).toFixed(1).replace('.', ',')} pages par visite`
                  : 'Aucune visite sur la période'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Taux de conversion</span>
              <div className="text-2xl font-bold text-plum font-serif">{String(stats.conversionRate).replace('.', ',')} %</div>
              <p className="text-[11px] text-gray-400">Commandes payées / visiteuses</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Chiffre d&apos;affaires</span>
              <div className="text-2xl font-bold text-gray-900 font-serif">{formatPrice(stats.totalRevenue)}</div>
              <p className="text-[11px] text-gray-500">
                {stats.totalOrders} commande{stats.totalOrders > 1 ? 's' : ''} • panier moyen {formatPrice(stats.averageCart)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-gray-200 space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Du passage à l&apos;achat</h2>
              <div className="space-y-3 pt-2 text-xs">
                {funnel.map((step, i) => (
                  <div key={step.label} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>
                        {i + 1}. {step.label}
                      </span>
                      <span>{step.value}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${i === funnel.length - 1 ? 'bg-emerald-500' : 'bg-plum'}`}
                        style={{ width: `${(step.value / funnelMax) * 100}%`, opacity: 1 - i * 0.12 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-gray-200 space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Provenance des visiteuses</h2>
              {stats.trafficSources.length === 0 ? (
                <p className="text-xs text-gray-500">Pas encore de visite mesurée sur cette période.</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {stats.trafficSources.map((src) => (
                    <div key={src.name} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-800">{src.name}</span>
                        <span className="font-bold text-plum">
                          {src.count} ({src.percent} %)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-plum/80 rounded-full" style={{ width: `${src.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Créations les plus vendues sur la période</h2>
            {stats.topProducts.length === 0 ? (
              <p className="text-xs text-gray-500">Aucune vente sur cette période.</p>
            ) : (
              <div className="divide-y divide-gray-100 text-xs">
                {stats.topProducts.map((p) => (
                  <div key={p.name} className="py-2.5 flex items-center justify-between gap-3">
                    <span className="font-semibold text-gray-900 truncate">{p.name}</span>
                    <span className="text-gray-600 shrink-0">
                      {p.quantity} vendue{p.quantity > 1 ? 's' : ''} • <strong className="text-plum">{formatPrice(p.revenue)}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
