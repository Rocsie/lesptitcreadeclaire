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

      <div className="p-4 rounded-2xl bg-white border border-gray-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-plum"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
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
                    <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400" /> {c.email}</p>
                    <p className="flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3 text-gray-400" /> {c.phone}</p>
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
