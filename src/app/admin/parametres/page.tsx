'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ShieldCheck, Truck, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/paths';
import LaunchChecklist from '@/components/admin/LaunchChecklist';
import type { EmailLog, PaymentMode } from '@/lib/types';

interface SystemStatus {
  paymentMode: PaymentMode;
  stripeConfigured: boolean;
  stripeWebhookConfigured: boolean;
  stripeWebhookUrl: string;
  smtpConfigured: boolean;
  emailLogs: EmailLog[];
}

const EMAIL_STATUS: Record<string, { label: string; color: string }> = {
  SENT: { label: 'Envoyé', color: 'bg-emerald-100 text-emerald-800' },
  FAILED: { label: 'Échec', color: 'bg-red-100 text-red-800' },
  NOT_CONFIGURED: { label: 'Non envoyé', color: 'bg-amber-100 text-amber-800' },
  SIMULATED: { label: 'Démonstration', color: 'bg-gray-100 text-gray-700' },
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function StatusLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p className={`flex items-start gap-2 text-xs ${ok ? 'text-emerald-700' : 'text-amber-800'}`}>
      {ok ? (
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      ) : (
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      )}
      <span>{children}</span>
    </p>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { updateProfile } = useAuth();

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [shippingPrice, setShippingPrice] = useState('4.90');
  const [freeThreshold, setFreeThreshold] = useState('60.00');
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [simMode, setSimMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    apiFetch('/api/cms')
      .then((r) => r.json())
      .then((data) => {
        if (data.shipping_standard_price) setShippingPrice(data.shipping_standard_price);
        if (data.shipping_free_threshold) setFreeThreshold(data.shipping_free_threshold);
        setPickupEnabled(data.pickup_enabled !== 'false');
        setSimMode(data.stripe_sim_mode !== 'false');
      })
      .catch(() => {});
    apiFetch('/api/admin/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStatus(data))
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_standard_price: shippingPrice,
          shipping_free_threshold: freeThreshold,
          pickup_enabled: String(pickupEnabled),
          stripe_sim_mode: String(simMode),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ text: 'Paramètres enregistrés. Ils s\'appliquent tout de suite sur la boutique.' });
        const fresh = await apiFetch('/api/admin/status').then((r) => (r.ok ? r.json() : null));
        if (fresh) setStatus(fresh);
        router.refresh();
      } else {
        setMessage({ text: data.error || "Les paramètres n'ont pas pu être enregistrés.", error: true });
      }
    } catch {
      setMessage({ text: 'Connexion au serveur impossible. Rien n\'a été enregistré.', error: true });
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    const result = await updateProfile(passwords);
    if (result.success) {
      setPasswords({ currentPassword: '', newPassword: '' });
      setPasswordMessage({ text: 'Mot de passe modifié.' });
    } else {
      setPasswordMessage({ text: result.error || 'Erreur.', error: true });
    }
  };

  const willBeClosed = !simMode && status !== null && !status.stripeConfigured;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Paramètres & emails</h1>
        <p className="text-xs text-gray-500 mt-0.5">Livraison, paiement, emails envoyés aux clientes et sécurité du compte.</p>
      </div>

      <LaunchChecklist key={message?.text || 'initial'} />

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-plum" aria-hidden="true" />
            <span>Livraison</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-shipping" className="font-semibold block mb-1">Frais de livraison Colissimo (€)</label>
              <input id="set-shipping" type="number" min="0" step="0.1" required value={shippingPrice} onChange={(e) => setShippingPrice(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-bold text-sm" />
            </div>
            <div>
              <label htmlFor="set-threshold" className="font-semibold block mb-1">Livraison offerte à partir de (€)</label>
              <input id="set-threshold" type="number" min="0" step="1" required value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-bold text-sm" />
              <p className="text-[11px] text-gray-500 mt-1">Mettre 0 pour ne jamais offrir la livraison automatiquement.</p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1 min-h-[40px]">
            <input type="checkbox" checked={pickupEnabled} onChange={(e) => setPickupEnabled(e.target.checked)} className="w-4 h-4 rounded accent-plum" />
            <span className="font-semibold">Proposer le retrait gratuit à l&apos;atelier</span>
          </label>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-plum" aria-hidden="true" />
            <span>Paiement</span>
          </h2>

          <label className="flex items-start justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
            <span>
              <span className="font-semibold text-gray-900 block">Mode démonstration</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                Les commandes sont enregistrées et le stock décompté, mais aucune carte n&apos;est débitée. À couper pour vendre réellement.
              </span>
            </span>
            <input type="checkbox" checked={simMode} onChange={(e) => setSimMode(e.target.checked)} className="w-5 h-5 rounded accent-plum shrink-0 mt-0.5" />
          </label>

          {status && (
            <div className="space-y-2">
              <StatusLine ok={status.stripeConfigured}>
                {status.stripeConfigured
                  ? 'Clé Stripe présente : le paiement par carte peut être activé.'
                  : 'Clé Stripe absente (STRIPE_SECRET_KEY dans le fichier .env du serveur). Sans elle, seul le mode démonstration fonctionne.'}
              </StatusLine>
              {status.stripeConfigured && (
                <StatusLine ok={status.stripeWebhookConfigured}>
                  {status.stripeWebhookConfigured
                    ? 'Webhook Stripe configuré : les paiements sont confirmés automatiquement.'
                    : `Webhook Stripe absent (STRIPE_WEBHOOK_SECRET). Adresse à déclarer chez Stripe : ${status.stripeWebhookUrl}`}
                </StatusLine>
              )}
              {willBeClosed && (
                <StatusLine ok={false}>
                  Attention : sans mode démonstration ni clé Stripe, les clientes ne pourront plus commander en ligne.
                </StatusLine>
              )}
            </div>
          )}
        </div>

        {message && (
          <p className={`text-xs ${message.error ? 'text-red-700' : 'text-emerald-700 font-semibold'}`} role="status">
            {message.text}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider active:scale-98 transition-all shadow-md disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>

      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Mail className="w-4 h-4 text-plum" aria-hidden="true" />
          <span>Emails envoyés par la boutique</span>
        </h2>

        {status && (
          <StatusLine ok={status.smtpConfigured}>
            {status.smtpConfigured
              ? 'Serveur d\'envoi configuré : confirmations de commande, suivis et messages de contact partent par email.'
              : 'Aucun serveur d\'envoi configuré (SMTP_HOST, SMTP_USER, SMTP_PASSWORD dans le .env) : les emails ci-dessous ne sont pas partis.'}
          </StatusLine>
        )}

        {!status ? (
          <p className="text-gray-500">Chargement...</p>
        ) : status.emailLogs.length === 0 ? (
          <p className="text-gray-500">Aucun email pour le moment.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {status.emailLogs.map((log) => {
              const s = EMAIL_STATUS[log.status || 'SIMULATED'] || EMAIL_STATUS.SIMULATED;
              return (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{log.subject}</p>
                    <p className="text-[11px] text-gray-400 truncate">Destinataire : {log.recipient}</p>
                    {log.error && <p className="text-[11px] text-red-600 mt-0.5">{log.error}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    <p className="text-[10px] text-gray-400 mt-1">{formatDate(log.sentAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handlePassword} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-plum" aria-hidden="true" />
          <span>Mot de passe de l&apos;administration</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-current" className="font-semibold block mb-1">Mot de passe actuel</label>
            <input id="set-current" type="password" required autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
          </div>
          <div>
            <label htmlFor="set-new" className="font-semibold block mb-1">Nouveau mot de passe (8 caractères minimum)</label>
            <input id="set-new" type="password" required minLength={8} autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
          </div>
        </div>
        {passwordMessage && (
          <p className={passwordMessage.error ? 'text-red-700' : 'text-emerald-700 font-semibold'} role="status">
            {passwordMessage.text}
          </p>
        )}
        <button type="submit" className="px-6 py-3 rounded-full bg-gray-900 hover:bg-black text-white font-semibold text-xs uppercase tracking-wider transition-colors">
          Modifier le mot de passe
        </button>
      </form>
    </div>
  );
}
