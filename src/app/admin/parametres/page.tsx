'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Mail, ShieldCheck, Truck, Store, CheckCircle2 } from 'lucide-react';
import { store } from '@/lib/store';

export default function AdminSettingsPage() {
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [shippingPrice, setShippingPrice] = useState('4.90');
  const [freeThreshold, setFreeThreshold] = useState('60.00');
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [stripeSimMode, setStripeSimMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/cms')
      .then((r) => r.json())
      .then((data) => {
        if (data.shipping_standard_price) setShippingPrice(data.shipping_standard_price);
        if (data.shipping_free_threshold) setFreeThreshold(data.shipping_free_threshold);
        if (data.pickup_enabled !== undefined) setPickupEnabled(data.pickup_enabled === 'true');
        if (data.stripe_sim_mode !== undefined) setStripeSimMode(data.stripe_sim_mode === 'true');
      })
      .catch(() => {});

    // Simuler/charger les logs d'emails
    setEmailLogs([
      { id: '1', recipient: 'sophie.martin@example.fr', subject: 'Confirmation de commande PCC-2026-000001', date: '09/10/2026 10:15', status: 'Délivré' },
      { id: '2', recipient: 'camille.durand@laposte.net', subject: 'Votre commande PCC-2026-000002 est en préparation', date: '10/10/2026 15:30', status: 'Délivré' },
      { id: '3', recipient: 'elodie.petit@orange.fr', subject: 'Votre création est prête à la boutique L\'Atelier !', date: '11/10/2026 09:40', status: 'Délivré' },
    ]);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_standard_price: shippingPrice,
          shipping_free_threshold: freeThreshold,
          pickup_enabled: String(pickupEnabled),
          stripe_sim_mode: String(stripeSimMode),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Erreur lors de l\'enregistrement des paramètres');
      }
    } catch (err) {
      alert('Erreur réseau lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Paramètres & Journal d&apos;Emails</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configuration des frais de port, moyens de paiement et traçabilité des emails transactionnels.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Frais de port & Retrait */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-plum" />
            <span>Paramètres de Livraison</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1">Frais de livraison standard (€)</label>
              <input
                type="number"
                step="0.1"
                value={shippingPrice}
                onChange={(e) => setShippingPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Seuil livraison offerte (€)</label>
              <input
                type="number"
                step="1"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={pickupEnabled}
              onChange={(e) => setPickupEnabled(e.target.checked)}
              className="rounded text-plum"
            />
            <span className="font-semibold">Activer le retrait gratuit à l&apos;Atelier à Port-la-Nouvelle</span>
          </label>
        </div>

        {/* Moyens de Paiement */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-plum" />
            <span>Passerelle de Paiement Stripe</span>
          </h2>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div>
              <p className="font-semibold text-gray-900">Mode Simulation / Démonstration</p>
              <p className="text-[11px] text-gray-500">
                Permet de tester le tunnel de commande et la décrémentation des stocks sans débiter de vraie carte.
              </p>
            </div>
            <input
              type="checkbox"
              checked={stripeSimMode}
              onChange={(e) => setStripeSimMode(e.target.checked)}
              className="rounded text-plum w-4 h-4"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            {saving ? 'Enregistrement en cours...' : saved ? '✓ Enregistré avec succès !' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>

      {/* Journal des emails transactionnels */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Mail className="w-4 h-4 text-plum" />
          <span>Journal des Emails Transactionnels Récents</span>
        </h2>

        <div className="divide-y divide-gray-100">
          {emailLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{log.subject}</p>
                <p className="text-[11px] text-gray-400">Destinataire : {log.recipient}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {log.status}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">{log.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
