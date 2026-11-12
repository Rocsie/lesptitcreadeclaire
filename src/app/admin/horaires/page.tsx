'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import type { OpeningHour } from '@/lib/types';
import { apiFetch } from '@/lib/paths';

export default function AdminHoursPage() {
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [exceptionalNotice, setExceptionalNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/cms/hours').then((res) => (res.ok ? res.json() : Promise.reject())),
      apiFetch('/api/cms').then((res) => (res.ok ? res.json() : Promise.reject())),
    ])
      .then(([hoursData, cms]) => {
        if (Array.isArray(hoursData)) setHours(hoursData);
        setExceptionalNotice(cms?.exceptional_notice || '');
      })
      .catch(() => setError('Les horaires n\'ont pas pu être chargés. Rechargez la page.'))
      .finally(() => setLoading(false));
  }, []);

  const handleHourChange = (id: string, field: keyof OpeningHour, value: string | boolean) => {
    setHours((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError('');
    try {
      const [hoursRes, noticeRes] = await Promise.all([
        apiFetch('/api/cms/hours', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hours),
        }),
        apiFetch('/api/cms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exceptional_notice: exceptionalNotice }),
        }),
      ]);
      if (!hoursRes.ok || !noticeRes.ok) {
        setError("Les horaires n'ont pas pu être enregistrés. Réessayez.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Connexion au serveur impossible : rien n'a été enregistré.");
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Chargement des horaires...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Horaires de l&apos;Atelier</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Horaires affichés sur la page d&apos;accueil, la page contact et le pied de page.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Horaires mis à jour !</span>
          </div>
        )}
      </div>

      {error && (
        <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-plum" />
            <span>Plages Hebdomadaires Régulières</span>
          </h2>

          <div className="space-y-4">
            {hours.map((h) => (
              <div key={h.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">{h.dayGroup}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={h.isClosed}
                      onChange={(e) => handleHourChange(h.id, 'isClosed', e.target.checked)}
                      className="rounded text-plum"
                    />
                    <span className="text-xs text-gray-600">Fermé ce jour</span>
                  </label>
                </div>

                {!h.isClosed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                        Matin (ex: 10 h - 12 h)
                      </label>
                      <input
                        type="text"
                        value={h.morningHours || ''}
                        onChange={(e) => handleHourChange(h.id, 'morningHours', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                        Après-midi (ex: 15 h - 18 h 30)
                      </label>
                      <input
                        type="text"
                        value={h.afternoonHours || ''}
                        onChange={(e) => handleHourChange(h.id, 'afternoonHours', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message d'annonce / Fermetures exceptionnelles */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Fermetures Exceptionnelles & Vacances</span>
          </h2>
          <div>
            <label htmlFor="hours-notice" className="font-semibold block mb-1">Message d&apos;information public</label>
            <input
              id="hours-notice"
              type="text"
              maxLength={300}
              placeholder="Ex : Fermeture exceptionnelle du 24 au 26 décembre"
              value={exceptionalNotice}
              onChange={(e) => setExceptionalNotice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Affiché avec les horaires sur l&apos;accueil et la page contact. Laisser vide pour ne rien afficher.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les horaires</span>
          </button>
        </div>
      </form>
    </div>
  );
}
