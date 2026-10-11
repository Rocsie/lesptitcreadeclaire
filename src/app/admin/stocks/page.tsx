'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Minus, Search, CheckCircle2 } from 'lucide-react';
import { Product } from '@/lib/store';

export default function AdminStocksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filterLow, setFilterLow] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateStock = async (p: Product, newStock: number) => {
    if (newStock < 0) return;
    try {
      await fetch(`/api/products/${p.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, stock: newStock }),
      });
      fetchProducts();
    } catch {}
  };

  const filtered = products.filter((p) => {
    if (filterLow && p.stock > p.lowStockThreshold) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Gestion des Stocks</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Ajustez les unités disponibles en direct. Une commande payée décrémente automatiquement le stock.
          </p>
        </div>

        <button
          onClick={() => setFilterLow(!filterLow)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors ${
            filterLow
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>{filterLow ? 'Afficher tout' : 'Filtrer stocks faibles'}</span>
        </button>
      </div>

      {/* Tableau d'inventaire */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Création</th>
                <th className="p-4">Réf</th>
                <th className="p-4">Seuil Alerte</th>
                <th className="p-4">Stock Actuel</th>
                <th className="p-4">Ajustement Rapide</th>
                <th className="p-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const isLow = p.stock <= p.lowStockThreshold;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0]?.url || '/images/hero-atelier.jpg'}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        />
                        <span className="font-semibold text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-gray-700">{p.reference}</td>
                    <td className="p-4 text-gray-500">&le; {p.lowStockThreshold} unités</td>
                    <td className="p-4">
                      <span
                        className={`text-sm font-bold font-serif ${
                          p.stock === 0
                            ? 'text-red-600'
                            : isLow
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStock(p, p.stock - 1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900">{p.stock}</span>
                        <button
                          onClick={() => handleUpdateStock(p, p.stock + 1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {p.stock === 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                          Rupture
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Stock faible
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
