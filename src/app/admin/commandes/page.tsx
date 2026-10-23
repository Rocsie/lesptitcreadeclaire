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
  FileText,
  Copy,
  Check,
  ExternalLink,
  Printer,
  MapPin,
  Phone,
  Mail,
  Package,
  Calendar,
  X
} from 'lucide-react';
import { Order } from '@/lib/store';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [isSavingTracking, setIsSavingTracking] = useState<boolean>(false);
  const [trackingSaveSuccess, setTrackingSaveSuccess] = useState<boolean>(false);

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

  const formatColissimoAddress = (order: Order) => {
    const addr = order.shippingAddress;
    const recipientName = addr?.name || `${order.customerFirstName} ${order.customerLastName}`;
    const lines = [
      recipientName,
      addr?.address1 || '',
      addr?.address2 || '',
      `${addr?.postalCode || ''} ${addr?.city || ''}`.trim(),
      addr?.country || 'France',
      `Tél : ${order.customerPhone || 'Non renseigné'}`,
      `Email : ${order.customerEmail}`
    ].filter(Boolean);
    return lines.join('\n');
  };

  // Copie robuste compatible téléphone, HTTP LAN, untun et HTTPS
  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {}

    // Fallback document.execCommand pour contextes non sécurisés (HTTP sur réseau local ou mobile)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      return false;
    }
  };

  const handleCopyAddress = async (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = formatColissimoAddress(order);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedOrderId(order.id);
      setTimeout(() => {
        setCopiedOrderId(null);
      }, 2500);
    } else {
      // Dernier recours si le presse-papier est verrouillé
      prompt("Copiez l'adresse ci-dessous :", text);
    }
  };

  const handleSaveTracking = async (orderId: string) => {
    setIsSavingTracking(true);
    setTrackingSaveSuccess(false);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: trackingInput }),
      });
      if (res.ok) {
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, adminNotes: trackingInput });
        }
        setTrackingSaveSuccess(true);
        setTimeout(() => setTrackingSaveSuccess(false), 3000);
      }
    } catch {}
    setIsSavingTracking(false);
  };

  const handlePrintSlip = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) {
      // Si bloqué par un bloqueur de popup sur mobile, imprimer la page courante
      window.print();
      return;
    }
    const addr = order.shippingAddress;
    const recipientName = addr?.name || `${order.customerFirstName} ${order.customerLastName}`;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bordereau Colissimo - ${order.orderNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #1f2937; line-height: 1.4; margin: 0; }
            .container { border: 2px dashed #cbd5e1; padding: 20px; border-radius: 12px; max-width: 620px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6E2D4A; padding-bottom: 12px; margin-bottom: 16px; }
            .brand { color: #6E2D4A; font-size: 18px; font-weight: bold; }
            .sender { font-size: 11px; color: #64748b; margin-top: 4px; }
            .order-meta { text-align: right; font-size: 12px; color: #475569; }
            .order-number { font-size: 16px; font-weight: bold; color: #0f172a; font-family: monospace; }
            .box { background: #f8fafc; border: 2px solid #2563eb; border-radius: 10px; padding: 16px; margin: 16px 0; }
            .box-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #2563eb; letter-spacing: 0.05em; margin-bottom: 8px; }
            .recipient-name { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 6px; }
            .recipient-address { font-size: 15px; color: #1e293b; }
            .recipient-contact { margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th { text-align: left; padding: 8px; background: #f1f5f9; color: #475569; font-weight: 600; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            .footer-msg { margin-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; font-style: italic; }
            .btn-print { margin: 20px auto 0; display: block; padding: 12px 28px; font-size: 14px; font-weight: bold; background: #6E2D4A; color: white; border: none; border-radius: 9999px; cursor: pointer; }
            @media print { .btn-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <div class="brand">Les P'tites Créa de Claire</div>
                <div class="sender">
                  Boutique L'Atelier • Port-la-Nouvelle (11210)<br/>
                  Artisanat d'Art fait main
                </div>
              </div>
              <div class="order-meta">
                <div class="order-number">${order.orderNumber}</div>
                <div>Date : ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</div>
                <div>Mode : <strong>Colissimo Suivi</strong></div>
              </div>
            </div>

            <div class="box">
              <div class="box-title">📦 Destinataire du colis (Colissimo)</div>
              <div class="recipient-name">${recipientName}</div>
              <div class="recipient-address">
                ${addr?.address1 || ''}<br/>
                ${addr?.address2 ? addr.address2 + '<br/>' : ''}
                <strong style="font-size: 16px;">${addr?.postalCode || ''} ${addr?.city || ''}</strong><br/>
                ${addr?.country || 'France'}
              </div>
              <div class="recipient-contact">
                <strong>Tél :</strong> ${order.customerPhone || 'Non renseigné'} • <strong>Email :</strong> ${order.customerEmail}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Article(s) commandé(s)</th>
                  <th>Réf.</th>
                  <th style="text-align: center;">Qté</th>
                  <th style="text-align: right;">Prix</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td><strong>${item.productName}</strong> ${item.variantTitle ? `<br/><span style="color: #6E2D4A; font-size: 11px;">${item.variantTitle}</span>` : ''}</td>
                    <td style="font-family: monospace; font-size: 11px;">${item.productReference || '-'}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right; font-weight: bold;">${item.totalPrice.toFixed(2)} €</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer-msg">
              Merci pour votre commande artisanale • Les P'tites Créa de Claire
            </div>
          </div>
          <button class="btn-print" onclick="window.print()">🖨️ Imprimer ce bordereau d'expédition</button>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      const matchCity = (o.shippingAddress?.city || '').toLowerCase().includes(q);
      const matchPostal = (o.shippingAddress?.postalCode || '').toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchEmail && !matchCity && !matchPostal) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-serif">Gestion des Commandes</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Suivez les expéditions Colissimo, gérez les retraits en boutique et visualisez instantanément les adresses de livraison.
        </p>
      </div>

      {/* Barre de filtre et recherche */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Numéro, client, ville, CP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm sm:text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-plum"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto text-xs font-semibold px-3 py-2.5 sm:py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-plum"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. VUE MOBILE ADAPTÉE (Écrans de smartphones < 768px) */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-400 text-xs">
            Aucune commande trouvée.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const badge = statusBadges[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
            const isDelivery = order.shippingMethod !== 'pickup';

            return (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3"
              >
                {/* En-tête de carte */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-gray-100">
                  <div>
                    <span className="font-mono font-bold text-sm text-gray-900 block">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-serif font-bold text-base text-gray-900 block">
                      {order.total.toFixed(2)} €
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Client info */}
                <div className="text-xs text-gray-700">
                  <p className="font-semibold text-gray-900">
                    {order.customerFirstName} {order.customerLastName}
                  </p>
                  <p className="text-[11px] text-gray-500">{order.customerEmail}</p>
                  {order.customerPhone && (
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" /> {order.customerPhone}
                    </a>
                  )}
                </div>

                {/* Mode de réception & Adresse */}
                <div className="pt-2 border-t border-gray-100">
                  {!isDelivery ? (
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-plum/5 text-plum text-xs font-semibold">
                      <Store className="w-4 h-4 text-plum shrink-0" />
                      <span>Retrait en boutique L&apos;Atelier</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          <Truck className="w-3 h-3 text-blue-600" />
                          <span>Colissimo à domicile</span>
                        </span>
                        {order.shippingAddress && (
                          <span className="text-[11px] font-bold text-blue-900">
                            📍 {order.shippingAddress.postalCode} {order.shippingAddress.city}
                          </span>
                        )}
                      </div>

                      {order.shippingAddress?.address1 && (
                        <p className="text-[11px] text-gray-700">
                          {order.shippingAddress.address1}
                          {order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ''}
                        </p>
                      )}

                      {/* Bouton de copie rapide en pleine largeur sur mobile */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyAddress(order, e)}
                        className="w-full py-2 px-3 rounded-lg bg-white border border-blue-200 text-blue-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:bg-blue-50 transition-colors"
                      >
                        {copiedOrderId === order.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">✓ Adresse copiée !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-blue-600" />
                            <span>Copier l&apos;adresse Colissimo</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Changement de statut & Bouton détails */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="w-full py-2.5 px-2 text-[11px] font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-800"
                  >
                    <option value="PAID">Payée</option>
                    <option value="CONFIRMED">Confirmée</option>
                    <option value="PREPARING">En préparation</option>
                    <option value="READY_FOR_PICKUP">Prête à l&apos;Atelier</option>
                    <option value="SHIPPED">Expédiée</option>
                    <option value="DELIVERED">Terminée</option>
                    <option value="CANCELLED">Annulée (Restock)</option>
                    <option value="REFUNDED">Remboursée</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder(order);
                      setTrackingInput(order.adminNotes || '');
                      setTrackingSaveSuccess(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-plum hover:bg-plum-dark text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Détails</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. VUE TABLEAU TABLETTE & DESKTOP (Écrans >= 768px) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Numéro</th>
                <th className="p-4">Date</th>
                <th className="p-4">Client</th>
                <th className="p-4">Réception &amp; Destination</th>
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
                  const isDelivery = order.shippingMethod !== 'pickup';

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
                        {!isDelivery ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-plum/5 text-plum font-semibold text-xs">
                            <Store className="w-3.5 h-3.5 text-plum" />
                            <span>Retrait atelier</span>
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                <Truck className="w-3 h-3 text-blue-600" />
                                <span>Colissimo</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyAddress(order, e)}
                                title="Copier l'adresse de livraison pour La Poste Colissimo"
                                className="p-1 rounded-md hover:bg-blue-100 text-blue-600 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                              >
                                {copiedOrderId === order.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copié</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copier</span>
                                  </>
                                )}
                              </button>
                            </div>
                            {order.shippingAddress && (
                              <p
                                className="text-[11px] text-gray-700 font-medium truncate max-w-[220px]"
                                title={`${order.shippingAddress.address1 || ''}, ${order.shippingAddress.postalCode || ''} ${order.shippingAddress.city || ''}`}
                              >
                                📍 {order.shippingAddress.postalCode} {order.shippingAddress.city}
                              </p>
                            )}
                          </div>
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
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            setTrackingInput(order.adminNotes || '');
                            setTrackingSaveSuccess(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-plum hover:text-white text-gray-700 font-semibold text-xs transition-colors"
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

      {/* Modal Détails Commande (Optimisé mobile & tactile) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-7 space-y-4 sm:space-y-5 shadow-2xl max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            {/* Header modal */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold font-serif text-gray-900">
                    Commande {selectedOrder.orderNumber}
                  </h2>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusBadges[selectedOrder.status]?.color || 'bg-gray-100'}`}>
                    {statusBadges[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Passée le {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 active:scale-95 transition-all shrink-0"
                aria-label="Fermer la modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BOX LIVRAISON COLISSIMO AVEC ADRESSE COMPLÈTE & OUTILS */}
            {selectedOrder.shippingMethod !== 'pickup' ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-200 space-y-4 shadow-2xs">
                <div className="flex flex-col gap-2.5 pb-3 border-b border-blue-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-blue-950">
                          Adresse de Livraison Colissimo
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 font-bold text-[10px]">
                          À affranchir
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-700">
                        Copiez l&apos;adresse ci-dessous pour acheter l&apos;étiquette sur La Poste.
                      </p>
                    </div>
                  </div>

                  {/* Actions rapides tactiles */}
                  <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(selectedOrder)}
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                    >
                      {copiedOrderId === selectedOrder.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">✓ Adresse copiée !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-blue-600" />
                          <span>Copier l&apos;adresse</span>
                        </>
                      )}
                    </button>

                    <a
                      href="https://www.laposte.fr/colissimo-en-ligne/parcours/caracteristiques?redirectType=parcours&depositMode=D_BAL&deliveryMode=L_PR"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all text-center"
                    >
                      <span>Acheter l&apos;étiquette (La Poste)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handlePrintSlip(selectedOrder)}
                      title="Imprimer le bordereau d'expédition Colissimo"
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimer bordereau</span>
                    </button>
                  </div>
                </div>

                {/* Détail clair des champs formatés */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-2 bg-white/90 p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                    <div className="flex items-center justify-between text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                      <span>Destinataire du colis</span>
                      <span className="text-blue-600 font-medium">Pour l&apos;étiquette</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">
                      {selectedOrder.shippingAddress?.name || `${selectedOrder.customerFirstName} ${selectedOrder.customerLastName}`}
                    </p>
                    <div className="text-gray-700 space-y-0.5 text-xs">
                      <p className="font-medium text-gray-900">
                        {selectedOrder.shippingAddress?.address1 || 'Adresse non renseignée'}
                      </p>
                      {selectedOrder.shippingAddress?.address2 && (
                        <p className="text-gray-600">{selectedOrder.shippingAddress.address2}</p>
                      )}
                      <p className="font-bold text-blue-900 text-sm">
                        {selectedOrder.shippingAddress?.postalCode} {selectedOrder.shippingAddress?.city}
                      </p>
                      <p className="text-gray-500 font-medium">{selectedOrder.shippingAddress?.country || 'France'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-white/90 p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                      Coordonnées cliente (Requis pour SMS Colissimo)
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {selectedOrder.customerPhone ? (
                          <a href={`tel:${selectedOrder.customerPhone}`} className="font-semibold text-blue-700 underline">
                            {selectedOrder.customerPhone}
                          </a>
                        ) : (
                          <span className="text-gray-400">Non renseigné</span>
                        )}
                        {selectedOrder.customerPhone && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold">
                            Suivi SMS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-800">
                        <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{selectedOrder.customerEmail}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500 text-[11px] pt-1.5 border-t border-gray-100">
                        <span>Frais de port facturés :</span>
                        <strong className="text-gray-900">{selectedOrder.shippingCost.toFixed(2)} €</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Saisie ou mémorisation du numéro de suivi Colissimo */}
                <div className="pt-2 border-t border-blue-200/60 space-y-2">
                  <label className="text-[11px] font-bold text-blue-950 block">
                    Numéro de suivi Colissimo (après achat de votre étiquette) :
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="Ex: 6A00000000000 ou 8L..."
                      className="px-3.5 py-2.5 sm:py-2 text-sm sm:text-xs rounded-xl border border-blue-200 bg-white focus:outline-none focus:border-blue-600 font-mono w-full sm:w-72"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveTracking(selectedOrder.id)}
                      disabled={isSavingTracking}
                      className="min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs active:scale-95 transition-all whitespace-nowrap"
                    >
                      {isSavingTracking ? 'Enregistrement...' : 'Enregistrer le n° de suivi'}
                    </button>
                    {trackingSaveSuccess && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Enregistré !</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-plum/5 border border-plum/20 flex items-start gap-3">
                <Store className="w-5 h-5 text-plum mt-0.5 shrink-0" />
                <div className="text-xs">
                  <h4 className="font-bold text-plum">Retrait en boutique L&apos;Atelier (Port-la-Nouvelle)</h4>
                  <p className="text-gray-600 mt-0.5">
                    Aucune étiquette Colissimo nécessaire. La cliente viendra récupérer sa commande directement en boutique.
                  </p>
                  <p className="text-gray-500 mt-1">
                    Téléphone : <strong>{selectedOrder.customerPhone || 'Non renseigné'}</strong> • Email : <strong>{selectedOrder.customerEmail}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Articles achetés (snapshot figé) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Articles Achetés (Prix figés à la vente)
              </h3>
              <div className="divide-y divide-gray-100 bg-gray-50 rounded-2xl p-3 sm:p-4">
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

            {/* Récapitulatif financier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3.5 sm:p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Détails client</h4>
                <p className="font-semibold text-gray-800">{selectedOrder.customerFirstName} {selectedOrder.customerLastName}</p>
                <p className="text-gray-500">{selectedOrder.customerEmail}</p>
                <p className="text-gray-500">{selectedOrder.customerPhone || 'Pas de tél'}</p>
                {selectedOrder.customerNote && (
                  <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <strong>Note cliente :</strong> {selectedOrder.customerNote}
                  </p>
                )}
              </div>
              <div className="space-y-1 sm:text-right">
                <h4 className="font-bold text-gray-900 mb-1">Montant &amp; Paiement</h4>
                <p className="text-gray-500">
                  Sous-total articles : {selectedOrder.subtotal.toFixed(2)} €
                </p>
                <p className="text-gray-500">
                  Frais de port : {selectedOrder.shippingCost.toFixed(2)} €
                </p>
                {selectedOrder.discountAmount > 0 && (
                  <p className="text-emerald-700 font-semibold">
                    Réduction ({selectedOrder.promoCode || 'Code'}) : -{selectedOrder.discountAmount.toFixed(2)} €
                  </p>
                )}
                <p className="font-bold text-plum text-base pt-1 border-t border-gray-200">
                  Total : {selectedOrder.total.toFixed(2)} €
                </p>
              </div>
            </div>

            {/* Footer boutons tactile */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-100 active:bg-gray-200 text-gray-800 text-xs font-semibold text-center transition-colors"
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
