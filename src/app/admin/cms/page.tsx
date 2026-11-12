'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Sparkles, Store } from 'lucide-react';
import { apiFetch } from '@/lib/paths';

export default function AdminCmsPage() {
  const [cms, setCms] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/cms')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCms(data))
      .catch(() => setError('Les textes n\'ont pas pu être chargés. Rechargez la page.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setCms((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError('');
    // Les réglages de livraison et de paiement ont leur propre page : ils ne sont pas renvoyés d'ici.
    const { shipping_standard_price, shipping_free_threshold, pickup_enabled, stripe_sim_mode, exceptional_notice, ...texts } = cms;
    void shipping_standard_price;
    void shipping_free_threshold;
    void pickup_enabled;
    void stripe_sim_mode;
    void exceptional_notice;
    try {
      const res = await apiFetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(texts),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Les modifications n'ont pas pu être enregistrées.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Connexion au serveur impossible : rien n'a été enregistré.");
    }
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

      {error && (
        <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}

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
            <p className="text-[11px] text-gray-500 mt-1">Laisser vide pour masquer le bandeau en haut du site.</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Texte du bouton principal</label>
                <input
                  type="text"
                  value={cms.hero_cta_primary || ''}
                  onChange={(e) => handleChange('hero_cta_primary', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Texte du second bouton</label>
                <input
                  type="text"
                  value={cms.hero_cta_secondary || ''}
                  onChange={(e) => handleChange('hero_cta_secondary', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section À Propos & L'Atelier */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Texte L&apos;Histoire de Claire & L&apos;Atelier</h2>
          <div>
            <label className="font-semibold block mb-1">Titre de la page « L&apos;Atelier & Claire »</label>
            <input
              type="text"
              value={cms.about_story_title || ''}
              onChange={(e) => handleChange('about_story_title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
            />
          </div>
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
            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">Adresse affichée sur le site</label>
              <input
                type="text"
                value={cms.contact_address || ''}
                onChange={(e) => handleChange('contact_address', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">Numéro et rue</label>
              <input
                type="text"
                placeholder="Ex : 12 rue de la République"
                value={cms.contact_street || ''}
                onChange={(e) => handleChange('contact_street', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Sert aux moteurs de recherche et au bouton « Voir l&apos;itinéraire » pour situer la boutique.
              </p>
            </div>
            <div>
              <label className="font-semibold block mb-1">Code postal</label>
              <input
                type="text"
                value={cms.contact_postal_code || ''}
                onChange={(e) => handleChange('contact_postal_code', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Ville</label>
              <input
                type="text"
                value={cms.contact_city || ''}
                onChange={(e) => handleChange('contact_city', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Profil Instagram (adresse complète)</label>
              <input
                type="url"
                placeholder="https://www.instagram.com/votre-compte"
                value={cms.instagram_url || ''}
                onChange={(e) => handleChange('instagram_url', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Page Facebook (adresse complète)</label>
              <input
                type="url"
                placeholder="https://www.facebook.com/votre-page"
                value={cms.facebook_url || ''}
                onChange={(e) => handleChange('facebook_url', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Mentions légales */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Informations légales</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Obligatoires pour vendre en ligne. Elles s&apos;affichent sur la page « Mentions légales » et dans les conditions de vente.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1">Exploitant (nom et prénom ou raison sociale)</label>
              <input
                type="text"
                value={cms.legal_owner || ''}
                onChange={(e) => handleChange('legal_owner', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Forme juridique</label>
              <input
                type="text"
                placeholder="Ex : Entreprise individuelle"
                value={cms.legal_status || ''}
                onChange={(e) => handleChange('legal_status', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Numéro SIRET</label>
              <input
                type="text"
                value={cms.legal_siret || ''}
                onChange={(e) => handleChange('legal_siret', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">TVA</label>
              <input
                type="text"
                placeholder="Numéro de TVA, ou « TVA non applicable, art. 293 B du CGI »"
                value={cms.legal_vat || ''}
                onChange={(e) => handleChange('legal_vat', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">Hébergeur du site (nom, adresse, téléphone)</label>
              <textarea
                rows={2}
                value={cms.legal_host || ''}
                onChange={(e) => handleChange('legal_host', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">Médiateur de la consommation (nom et site internet)</label>
              <textarea
                rows={2}
                value={cms.legal_mediator || ''}
                onChange={(e) => handleChange('legal_mediator', e.target.value)}
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
