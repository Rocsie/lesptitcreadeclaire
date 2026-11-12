'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Search, Trash2 } from 'lucide-react';
import { apiFetch, formatPrice } from '@/lib/paths';
import type { NewsletterSubscriber, Order } from '@/lib/types';

interface Client {
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrder: string;
}

// Le fichier clientes est déduit des commandes : une ligne par adresse email.
function buildClients(orders: Order[]): Client[] {
  const map = new Map<string, Client>();
  for (const o of orders) {
    const key = o.customerEmail.toLowerCase();
    const counted = !['PENDING', 'CANCELLED', 'REFUNDED'].includes(o.status);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        name: `${o.customerFirstName} ${o.customerLastName}`.trim(),
        email: o.customerEmail,
        phone: o.customerPhone || '',
        ordersCount: counted ? 1 : 0,
        totalSpent: counted ? o.total : 0,
        lastOrder: o.createdAt,
      });
      continue;
    }
    if (counted) {
      existing.ordersCount += 1;
      existing.totalSpent += o.total;
    }
    if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt;
    if (!existing.phone && o.customerPhone) existing.phone = o.customerPhone;
  }
  return [...map.values()].sort((a, b) => b.lastOrder.localeCompare(a.lastOrder));
}

export default function AdminClientsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [newsletter, setNewsletter] = useState<NewsletterSubscriber[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/orders').then((r) => r.json()),
      apiFetch('/api/newsletter').then((r) => r.json()),
    ])
      .then(([ords, subs]) => {
        if (Array.isArray(ords)) setOrders(ords);
        if (Array.isArray(subs)) setNewsletter(subs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const clients = buildClients(orders).filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  );

  const removeSubscriber = async (email: string) => {
    if (!confirm(`Retirer ${email} de la lettre d'information ?`)) return;
    const res = await apiFetch(`/api/newsletter?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    if (res.ok) setNewsletter((prev) => prev.filter((n) => n.email !== email));
  };

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(newsletter.map((n) => n.email).join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt('Copiez les adresses ci-dessous :', newsletter.map((n) => n.email).join(', '));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Clientes</h1>
        <p className="text-xs text-gray-500 mt-0.5">Coordonnées et historique d&apos;achat, à partir des commandes passées.</p>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            aria-label="Rechercher une cliente"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-plum"
          />
        </div>
      </div>

      {/* Mobile */}
      <div className="block md:hidden space-y-3">
        {clients.map((c) => (
          <div key={c.email} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{c.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Dernière commande : {new Date(c.lastOrder).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-serif font-bold text-base text-plum block">{formatPrice(c.totalSpent)}</span>
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {c.ordersCount} commande{c.ordersCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
              {c.phone ? (
                <a
                  href={`tel:${c.phone.replace(/\s+/g, '')}`}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Appeler</span>
                </a>
              ) : (
                <div className="min-h-[42px] px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-xs font-medium flex items-center justify-center border border-gray-100">
                  Pas de tél.
                </div>
              )}
              <a
                href={`mailto:${c.email}`}
                className="min-h-[42px] px-3 py-2 rounded-xl bg-rose-powder/20 hover:bg-rose-powder/35 text-plum text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-powder/40 transition-all"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Email</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Ordinateur */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Cliente</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Commandes payées</th>
                <th className="p-4">Total dépensé</th>
                <th className="p-4">Dernière commande</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.email} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4 font-semibold text-gray-900">{c.name}</td>
                  <td className="p-4 text-gray-500">
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-plum transition-colors">
                      <Mail className="w-3 h-3 text-gray-400" aria-hidden="true" /> {c.email}
                    </a>
                    {c.phone && (
                      <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 mt-0.5 hover:text-plum transition-colors">
                        <Phone className="w-3 h-3 text-gray-400" aria-hidden="true" /> {c.phone}
                      </a>
                    )}
                  </td>
                  <td className="p-4 font-bold text-gray-900">{c.ordersCount}</td>
                  <td className="p-4 font-serif font-bold text-sm text-plum">{formatPrice(c.totalSpent)}</td>
                  <td className="p-4 text-gray-500">{new Date(c.lastOrder).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && clients.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs">
          {q ? 'Aucune cliente ne correspond à votre recherche.' : 'Aucune cliente pour le moment : la liste se remplit avec les commandes.'}
        </div>
      )}

      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Abonnées à la lettre d&apos;information ({newsletter.length})</h2>
            <p className="text-gray-500 mt-0.5">Adresses inscrites depuis le pied de page du site.</p>
          </div>
          {newsletter.length > 0 && (
            <button
              type="button"
              onClick={copyEmails}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold transition-colors self-start"
            >
              {copied ? 'Adresses copiées' : 'Copier toutes les adresses'}
            </button>
          )}
        </div>
        {newsletter.length === 0 ? (
          <p className="text-gray-500">Aucune inscription pour le moment.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {newsletter.map((n) => (
              <li key={n.email} className="py-2 flex items-center justify-between gap-3">
                <span className="truncate">
                  <span className="font-semibold text-gray-900">{n.email}</span>
                  <span className="text-gray-400"> • {new Date(n.createdAt).toLocaleDateString('fr-FR')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeSubscriber(n.email)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  aria-label={`Retirer ${n.email}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
