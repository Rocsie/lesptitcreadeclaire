'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Sparkles, Store, MapPin, Globe, Phone, Mail } from 'lucide-react';

export default function AdminCmsPage() {
  const [cms, setCms] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/cms')
      .then((res) => res.json())
      .then((data) => setCms(data))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setCms((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    await fetch('/api/cms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cms),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="text-sm text-gray-500">Chargement des textes...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Contenu du Site (CMS)</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Modifiez vous-même les textes, le hero, la bannière et les coordonnées sans toucher au code.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Modifications enregistrées !</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Bannière supérieure d'annonce */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-plum" />
            <span>Bannière d&apos;Annonce Supérieure</span>
          </h2>
          <div>
            <label className="font-semibold block mb-1">Texte de l&apos;annonce</label>
            <input
              type="text"
              value={cms.banner_announcement || ''}
              onChange={(e) => handleChange('banner_announcement', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
            />
          </div>
        </div>

        {/* Section Hero Accueil */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-plum" />
            <span>Page d&apos;Accueil - Grand Titre Hero</span>
          </h2>
          <div className="space-y-3">
            <div>
              <label className="font-semibold block mb-1">Badge d&apos;accroche</label>
              <input
                type="text"
                value={cms.hero_badge || ''}
                onChange={(e) => handleChange('hero_badge', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Titre principal</label>
              <input
                type="text"
                value={cms.hero_title || ''}
                onChange={(e) => handleChange('hero_title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-serif font-bold text-sm"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Sous-titre / Présentation</label>
              <textarea
                rows={3}
                value={cms.hero_subtitle || ''}
                onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Section À Propos & L'Atelier */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Texte L&apos;Histoire de Claire & L&apos;Atelier</h2>
          <div>
            <label className="font-semibold block mb-1">Paragraphe de présentation de l&apos;artisanat</label>
            <textarea
              rows={4}
              value={cms.about_story_text || ''}
              onChange={(e) => handleChange('about_story_text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
            />
          </div>
        </div>

        {/* Coordonnées & Réseaux Sociaux */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Coordonnées & Réseaux</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1">Téléphone de l&apos;Atelier</label>
              <input
                type="text"
                value={cms.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Email de contact</label>
              <input
                type="email"
                value={cms.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Profil Instagram</label>
              <input
                type="text"
                value={cms.instagram_url || ''}
                onChange={(e) => handleChange('instagram_url', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Page Facebook</label>
              <input
                type="text"
                value={cms.facebook_url || ''}
                onChange={(e) => handleChange('facebook_url', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde fixe */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer toutes les modifications</span>
          </button>
        </div>
      </form>
    </div>
  );
}
