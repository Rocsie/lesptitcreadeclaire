'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle2, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { Coupon } from '@/lib/store';

export default function AdminPromosPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as Coupon['discountType'],
    discountValue: 10,
    minOrderAmount: 0,
    maxUses: '',
    isActive: true,
  });

  const fetchCoupons = () => {
    setLoading(true);
    fetch('/api/promos')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCoupons(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 0,
      maxUses: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount || 0,
      maxUses: c.maxUses ? String(c.maxUses) : '',
      isActive: c.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        isActive: form.isActive,
      };

      if (editingCoupon) {
        await fetch('/api/promos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingCoupon.id }),
        });
      } else {
        await fetch('/api/promos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement du code promo');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    await fetch('/api/promos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
    });
    fetchCoupons();
  };

  const handleDelete = async (id: string, code: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le code promo "${code}" ?`)) {
      await fetch(`/api/promos?id=${id}`, { method: 'DELETE' });
      fetchCoupons();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Codes Promotionnels</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Créez des remises en pourcentage, montants fixes ou livraisons offertes pour vos clientes.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-plum hover:bg-plum-dark text-white text-xs font-semibold active:scale-98 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un code promo</span>
        </button>
      </div>

      {/* Vue Mobile (Cartes adaptées au tactile) */}
      <div className="block md:hidden space-y-3.5">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-base text-plum bg-rose-powder/20 px-2.5 py-1 rounded-lg inline-block">
                  {c.code}
                </span>
                {c.description && (
                  <p className="text-xs text-gray-600 mt-1">{c.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleToggleActive(c)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 ${
                  c.isActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                {c.isActive ? 'Actif' : 'Inactif'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl text-center text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Remise</span>
                <span className="font-bold text-gray-900">
                  {c.discountType === 'PERCENTAGE'
                    ? `-${c.discountValue}%`
                    : c.discountType === 'FIXED_AMOUNT'
                    ? `-${c.discountValue} €`
                    : 'Port offert'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Min. Achat</span>
                <span className="font-semibold text-gray-700">
                  {c.minOrderAmount > 0 ? `${c.minOrderAmount} €` : '0 €'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Utilisations</span>
                <span className="font-semibold text-gray-700">
                  {c.usesCount} {c.maxUses ? `/ ${c.maxUses}` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              <button
                onClick={() => handleOpenEdit(c)}
                className="flex-1 min-h-[44px] py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs border border-gray-200 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-plum" />
                <span>Modifier</span>
              </button>
              <button
                onClick={() => handleDelete(c.id, c.code)}
                className="min-h-[44px] px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs border border-red-200 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-400 text-xs">
            Aucun code promotionnel créé pour le moment.
          </div>
        )}
      </div>

      {/* Vue Bureau (Tableau traditionnel) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto min-w-[700px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Description</th>
                <th className="p-4">Type</th>
                <th className="p-4">Valeur</th>
                <th className="p-4">Min Achat</th>
                <th className="p-4">Utilisations</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4 font-mono font-bold text-plum text-sm">{c.code}</td>
                  <td className="p-4 text-gray-700 max-w-xs">{c.description || '-'}</td>
                  <td className="p-4">
                    <span className="text-[10px] uppercase font-bold text-gray-500 px-2 py-0.5 bg-gray-100 rounded-md">
                      {c.discountType === 'PERCENTAGE' ? 'Pourcentage' : c.discountType === 'FIXED_AMOUNT' ? 'Montant fixe' : 'Frais de port'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                    {c.discountType === 'PERCENTAGE'
                      ? `-${c.discountValue}%`
                      : c.discountType === 'FIXED_AMOUNT'
                      ? `-${c.discountValue} €`
                      : 'Offerte'}
                  </td>
                  <td className="p-4 text-gray-500">{c.minOrderAmount > 0 ? `${c.minOrderAmount} €` : 'Aucun'}</td>
                  <td className="p-4 text-gray-600">{c.usesCount} {c.maxUses ? `/ ${c.maxUses}` : 'fois'}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                        c.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title="Cliquer pour activer/désactiver"
                    >
                      {c.isActive ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-2 rounded-lg text-gray-500 hover:text-plum hover:bg-rose-powder/20 active:scale-95 transition-all"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Aucun code promotionnel créé pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création / Édition Code Promo (Mobile Bottom Sheet & Desktop Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-serif text-lg font-bold text-gray-900">
                {editingCoupon ? 'Modifier le code promo' : 'Nouveau code promo'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs pb-4 sm:pb-0">
              <div>
                <label className="font-semibold block mb-1">Code promo (lettres / chiffres) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : BIENVENUE10 ou ETE2026"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-plum font-mono uppercase font-bold text-plum text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description / Intitulé</label>
                <input
                  type="text"
                  placeholder="Ex : 10% de bienvenue sur votre première commande"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-plum"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Type de réduction</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-medium bg-white"
                  >
                    <option value="PERCENTAGE">Pourcentage (%)</option>
                    <option value="FIXED_AMOUNT">Montant fixe (€)</option>
                    <option value="FREE_SHIPPING">Livraison offerte</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    {form.discountType === 'PERCENTAGE'
                      ? 'Pourcentage (%)'
                      : form.discountType === 'FIXED_AMOUNT'
                      ? 'Montant (€)'
                      : 'Valeur (0)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    disabled={form.discountType === 'FREE_SHIPPING'}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-bold disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Panier minimum requis (€)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0 pour aucun"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Nombre max d&apos;utilisations</label>
                  <input
                    type="number"
                    placeholder="Illimité si vide"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-5 h-5 rounded text-plum"
                />
                <span className="font-semibold text-gray-800">Code actif et utilisable au paiement</span>
              </label>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-center"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-plum hover:bg-plum-dark text-white font-semibold transition-all shadow-xs disabled:opacity-50 active:scale-98 text-center"
                >
                  {saving ? 'Enregistrement...' : editingCoupon ? 'Modifier le code' : 'Créer le code promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
