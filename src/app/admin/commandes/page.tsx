'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Store,
  ChevronRight,
  Eye,
  FileText
} from 'lucide-react';
import { Order } from '@/lib/store';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus as any });
        }
      }
    } catch {}
  };

  const statusOptions = [
    { value: 'ALL', label: 'Tous les statuts' },
    { value: 'PAID', label: 'Payée' },
    { value: 'CONFIRMED', label: 'Confirmée' },
    { value: 'PREPARING', label: 'En préparation' },
    { value: 'READY_FOR_PICKUP', label: 'Prête à l\'Atelier' },
    { value: 'SHIPPED', label: 'Expédiée' },
    { value: 'DELIVERED', label: 'Terminée' },
    { value: 'CANCELLED', label: 'Annulée' },
    { value: 'REFUNDED', label: 'Remboursée' },
  ];

  const statusBadges: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
    PAID: { label: 'Payée', color: 'bg-blue-100 text-blue-800' },
    CONFIRMED: { label: 'Confirmée', color: 'bg-indigo-100 text-indigo-800' },
    PREPARING: { label: 'En préparation', color: 'bg-purple-100 text-purple-800' },
    READY_FOR_PICKUP: { label: 'Prête au retrait', color: 'bg-emerald-100 text-emerald-800' },
    SHIPPED: { label: 'Expédiée', color: 'bg-teal-100 text-teal-800' },
    DELIVERED: { label: 'Terminée', color: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    REFUNDED: { label: 'Remboursée', color: 'bg-gray-100 text-gray-800' },
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = `${o.customerFirstName} ${o.customerLastName}`.toLowerCase().includes(q);
      const matchEmail = o.customerEmail.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Gestion des Commandes</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Suivez les expéditions, gérez les retraits en boutique et mettez à jour les statuts en 1 clic.
        </p>
      </div>

      {/* Barre de filtre et recherche */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-gray-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Numéro, client, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-plum"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-plum"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table des commandes */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Numéro</th>
                <th className="p-4">Date</th>
                <th className="p-4">Client</th>
                <th className="p-4">Réception</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Aucune commande trouvée.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = statusBadges[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-gray-900">{order.orderNumber}</td>
                      <td className="p-4 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-900">
                          {order.customerFirstName} {order.customerLastName}
                        </p>
                        <p className="text-[10px] text-gray-400">{order.customerEmail}</p>
                      </td>
                      <td className="p-4">
                        {order.shippingMethod === 'pickup' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-plum">
                            <Store className="w-3.5 h-3.5" /> Retrait atelier
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                            <Truck className="w-3.5 h-3.5" /> Colissimo
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-serif font-bold text-sm text-gray-900">
                        {order.total.toFixed(2)} €
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200 cursor-pointer ${badge.color}`}
                        >
                          <option value="PAID">Payée</option>
                          <option value="CONFIRMED">Confirmée</option>
                          <option value="PREPARING">En préparation</option>
                          <option value="READY_FOR_PICKUP">Prête à l&apos;Atelier</option>
                          <option value="SHIPPED">Expédiée</option>
                          <option value="DELIVERED">Terminée</option>
                          <option value="CANCELLED">Annulée (Restocker)</option>
                          <option value="REFUNDED">Remboursée</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-plum hover:text-white text-gray-700 font-semibold text-xs transition-colors"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Détails Commande */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold font-serif text-gray-900">
                  Commande {selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-gray-500">
                  Passée le {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Articles achetés (snapshot figé) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Articles Achetés (Prix figés à la vente)
              </h3>
              <div className="divide-y divide-gray-100 bg-gray-50 rounded-2xl p-4">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl || '/images/hero-atelier.jpg'}
                        alt={item.productName}
                        className="w-11 h-11 rounded-lg object-cover border border-gray-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{item.productName}</p>
                        {item.variantTitle && (
                          <p className="text-[10px] text-plum">{item.variantTitle}</p>
                        )}
                        <p className="text-[11px] text-gray-500">
                          {item.quantity} x {item.unitPrice.toFixed(2)} €
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">{item.totalPrice.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coordonnées & Livraison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs p-4 rounded-2xl border border-gray-100">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Client</h4>
                <p>{selectedOrder.customerFirstName} {selectedOrder.customerLastName}</p>
                <p className="text-gray-500">{selectedOrder.customerEmail}</p>
                <p className="text-gray-500">{selectedOrder.customerPhone || 'Pas de tél'}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Mode de Réception</h4>
                <p>
                  {selectedOrder.shippingMethod === 'pickup'
                    ? "Retrait boutique L'Atelier (Port-la-Nouvelle)"
                    : 'Colissimo Domicile'}
                </p>
                <p className="text-gray-500 mt-1">
                  Sous-total : {selectedOrder.subtotal.toFixed(2)} €
                </p>
                <p className="text-gray-500">
                  Frais de port : {selectedOrder.shippingCost.toFixed(2)} €
                </p>
                <p className="font-bold text-plum text-sm mt-1">
                  Total : {selectedOrder.total.toFixed(2)} €
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
