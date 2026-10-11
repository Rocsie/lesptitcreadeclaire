'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, ShoppingBag, Eye, ArrowUpRight } from 'lucide-react';
import { Product } from '@/lib/store';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return <div className="text-xs text-gray-500">Chargement des statistiques...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Statistiques & Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Suivi des visites, des tunnels de conversion et des sources de trafic Instagram/Facebook.
          </p>
        </div>

        <div className="flex bg-white rounded-xl border border-gray-200 p-1 text-xs font-semibold">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              period === 'today' ? 'bg-plum text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => setPeriod('7d')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              period === '7d' ? 'bg-plum text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7 derniers jours
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              period === '30d' ? 'bg-plum text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30 derniers jours
          </button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Visiteurs Uniques</span>
          <div className="text-2xl font-bold text-gray-900 font-serif">{stats.totalVisitors}</div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Forte affluence Instagram
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Pages Vues</span>
          <div className="text-2xl font-bold text-gray-900 font-serif">{stats.pageViews}</div>
          <p className="text-[11px] text-gray-400">~ 2.9 pages par visiteur</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Taux de Conversion</span>
          <div className="text-2xl font-bold text-plum font-serif">{stats.conversionRate} %</div>
          <p className="text-[11px] text-emerald-600 font-medium">Supérieur à la moyenne e-commerce</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Chiffre d&apos;Affaires</span>
          <div className="text-2xl font-bold text-gray-900 font-serif">{stats.totalRevenue.toFixed(2)} €</div>
          <p className="text-[11px] text-gray-500">Panier moyen : {stats.averageCart.toFixed(2)} €</p>
        </div>
      </div>

      {/* Tunnel d'achat & Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-gray-200 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Entonnoir de Conversion</h2>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>1. Visites boutique</span>
                <span>842 (100%)</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-plum rounded-full w-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>2. Fiches produits consultées</span>
                <span>512 (60.8%)</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-old rounded-full w-[60.8%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>3. Ajouts au panier</span>
                <span>124 (14.7%)</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-powder rounded-full w-[14.7%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>4. Commandes confirmées</span>
                <span>29 (3.4%)</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[3.4%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-gray-200 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Origine des Visiteuses</h2>
          <div className="space-y-3 pt-2">
            {stats.trafficSources?.map((src: any, i: number) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">{src.name}</span>
                  <span className="font-bold text-plum">{src.percent}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-plum/80 rounded-full" style={{ width: `${src.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
