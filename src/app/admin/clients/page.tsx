'use client';

import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, ShoppingBag, Search } from 'lucide-react';
import { Order } from '@/lib/store';

export default function AdminClientsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      });
  }, []);

  // Déduire les clients uniques à partir des commandes et de l'utilisateur démo
  const clientsMap: Record<string, any> = {};

  // Client démo Sophie
  clientsMap['sophie.martin@example.fr'] = {
    name: 'Sophie Martin',
    email: 'sophie.martin@example.fr',
    phone: '06 12 34 56 78',
    ordersCount: 0,
    totalSpent: 0,
    lastOrder: '2026-10-09',
  };

  orders.forEach((o) => {
    if (!clientsMap[o.customerEmail]) {
      clientsMap[o.customerEmail] = {
        name: `${o.customerFirstName} ${o.customerLastName}`,
        email: o.customerEmail,
        phone: o.customerPhone || 'Non renseigné',
        ordersCount: 0,
        totalSpent: 0,
        lastOrder: o.createdAt,
      };
    }
    clientsMap[o.customerEmail].ordersCount += 1;
    clientsMap[o.customerEmail].totalSpent += o.total;
    clientsMap[o.customerEmail].lastOrder = o.createdAt;
  });

  const clients = Object.values(clientsMap).filter((c: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Fichier Clients</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Consultez la liste des clientes, leur historique de dépenses et leurs coordonnées.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-plum"
          />
        </div>
      </div>

      {/* Vue Mobile (Cartes clientes adaptées au téléphone) */}
      <div className="block md:hidden space-y-3">
        {clients.map((c: any) => (
          <div key={c.email} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Dernier achat : {new Date(c.lastOrder).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="text-right">
                <span className="font-serif font-bold text-base text-plum block">
                  {c.totalSpent.toFixed(2)} €
                </span>
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {c.ordersCount} commande{c.ordersCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
              {c.phone && c.phone !== 'Non renseigné' ? (
                <a
                  href={`tel:${c.phone.replace(/\s+/g, '')}`}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200 active:scale-95 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Appeler</span>
                </a>
              ) : (
                <div className="min-h-[42px] px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-xs font-medium flex items-center justify-center border border-gray-100">
                  Pas de tél.
                </div>
              )}
              <a
                href={`mailto:${c.email}`}
                className="min-h-[42px] px-3 py-2 rounded-xl bg-rose-powder/20 hover:bg-rose-powder/35 text-plum text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-powder/40 active:scale-95 transition-all truncate"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Email</span>
              </a>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-400 text-xs">
            Aucun client ne correspond à votre recherche.
          </div>
        )}
      </div>

      {/* Vue Bureau (Tableau traditionnel) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto min-w-[650px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Cliente</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Commandes</th>
                <th className="p-4">Total Dépensé</th>
                <th className="p-4">Dernier Achat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c: any) => (
                <tr key={c.email} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-gray-900">{c.name}</p>
                  </td>
                  <td className="p-4 text-gray-500">
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-plum transition-colors">
                      <Mail className="w-3 h-3 text-gray-400" /> {c.email}
                    </a>
                    {c.phone && c.phone !== 'Non renseigné' && (
                      <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 mt-0.5 hover:text-plum transition-colors">
                        <Phone className="w-3 h-3 text-gray-400" /> {c.phone}
                      </a>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-gray-900">{c.ordersCount} commande{c.ordersCount > 1 ? 's' : ''}</span>
                  </td>
                  <td className="p-4 font-serif font-bold text-sm text-plum">
                    {c.totalSpent.toFixed(2)} €
                  </td>
                  <td className="p-4 text-gray-400">
                    {new Date(c.lastOrder).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
