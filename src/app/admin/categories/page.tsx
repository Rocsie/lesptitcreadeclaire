'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit2, X, Check, Sparkles, Upload, Loader2 } from 'lucide-react';
import { Category, Collection } from '@/lib/store';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Catégorie
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '/images/boucles-oreilles.jpg',
    displayOrder: 1,
  });

  // Modal Collection
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<Collection | null>(null);
  const [colForm, setColForm] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '/images/hero-atelier.jpg',
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ name: string; url: string }>>([]);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/collections').then((r) => r.json()),
      fetch('/api/upload').then((r) => r.json()).catch(() => ({ files: [] })),
    ])
      .then(([cats, cols, uploads]) => {
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(cols)) setCollections(cols);
        if (uploads && Array.isArray(uploads.files)) setUploadedPhotos(uploads.files);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- Handlers Catégorie ---
  const handleOpenNewCat = () => {
    setEditingCat(null);
    setCatForm({
      name: '',
      slug: '',
      description: '',
      imageUrl: '/images/boucles-oreilles.jpg',
      displayOrder: categories.length + 1,
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '/images/hero-atelier.jpg',
      displayOrder: cat.displayOrder || 1,
    });
    setIsCatModalOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = catForm.slug.trim() || catForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const payload = { ...catForm, slug };

      if (editingCat) {
        await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingCat.id }),
        });
      } else {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsCatModalOpen(false);
      fetchAll();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement de la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCat = async (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le rayon "${name}" ?`)) {
      await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      fetchAll();
    }
  };

  // --- Handlers Collection ---
  const handleOpenNewCol = () => {
    setEditingCol(null);
    setColForm({
      name: '',
      slug: '',
      description: '',
      imageUrl: '/images/hero-atelier.jpg',
      isActive: true,
    });
    setIsColModalOpen(true);
  };

  const handleOpenEditCol = (col: Collection) => {
    setEditingCol(col);
    setColForm({
      name: col.name,
      slug: col.slug,
      description: col.description || '',
      imageUrl: col.imageUrl || '/images/hero-atelier.jpg',
      isActive: col.isActive ?? true,
    });
    setIsColModalOpen(true);
  };

  const handleSaveCol = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = colForm.slug.trim() || colForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const payload = { ...colForm, slug };

      if (editingCol) {
        await fetch('/api/collections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingCol.id }),
        });
      } else {
        await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsColModalOpen(false);
      fetchAll();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement de la collection');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleColActive = async (col: Collection) => {
    await fetch('/api/collections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: col.id, isActive: !col.isActive }),
    });
    fetchAll();
  };

  const handleDeleteCol = async (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer la collection "${name}" ?`)) {
      await fetch(`/api/collections?id=${id}`, { method: 'DELETE' });
      fetchAll();
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Catégories & Collections</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Gérez l&apos;organisation de vos rayons de bijoux et vos univers de créations thématiques.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Catégories */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-plum" />
              <span>Rayons & Catégories ({categories.length})</span>
            </h2>
            <button
              onClick={handleOpenNewCat}
              className="min-h-[42px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-plum hover:bg-plum-dark text-white text-xs font-semibold active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un rayon</span>
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {categories.map((c) => (
              <div key={c.id} className="py-3.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={c.imageUrl || '/images/hero-atelier.jpg'}
                    alt={c.name}
                    className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">/boutique?categorie={c.slug}</p>
                    {c.description && (
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{c.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEditCat(c)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:text-plum hover:bg-rose-powder/20 active:scale-90 transition-all border border-gray-200 sm:border-transparent"
                    title="Modifier"
                    aria-label="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCat(c.id, c.name)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all border border-gray-200 sm:border-transparent"
                    title="Supprimer"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-plum" />
              <span>Collections ({collections.length})</span>
            </h2>
            <button
              onClick={handleOpenNewCol}
              className="min-h-[42px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-plum hover:bg-plum-dark text-white text-xs font-semibold active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une collection</span>
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {collections.map((col) => (
              <div key={col.id} className="py-3.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={col.imageUrl || '/images/hero-atelier.jpg'}
                    alt={col.name}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{col.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{col.description || 'Sans description'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleColActive(col)}
                    className={`min-h-[38px] text-[11px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                      col.isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}
                    title="Cliquer pour activer/désactiver"
                  >
                    {col.isActive ? 'Active' : 'Masquée'}
                  </button>

                  <button
                    onClick={() => handleOpenEditCol(col)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:text-plum hover:bg-rose-powder/20 active:scale-90 transition-all border border-gray-200 sm:border-transparent"
                    title="Modifier"
                    aria-label="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCol(col.id, col.name)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all border border-gray-200 sm:border-transparent"
                    title="Supprimer"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Création / Édition Catégorie */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-serif text-lg font-bold text-gray-900">
                {editingCat ? 'Modifier le rayon' : 'Nouveau rayon de bijoux'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCat} className="space-y-4 text-xs pb-4 sm:pb-0">
              <div>
                <label className="font-semibold block mb-1">Nom du rayon *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Bracelets & Joncs"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-plum text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Identifiant URL (slug)</label>
                <input
                  type="text"
                  placeholder="Ex : bracelets-joncs (automatique si vide)"
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-plum font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description courte</label>
                <textarea
                  rows={2}
                  placeholder="Description affichée sur la boutique..."
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-plum text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Image du rayon (URL ou photo)</label>
                <input
                  type="text"
                  value={catForm.imageUrl}
                  onChange={(e) => setCatForm({ ...catForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs mb-2"
                />
                {uploadedPhotos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {uploadedPhotos.slice(0, 8).map((ph) => (
                      <button
                        key={ph.url}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, imageUrl: ph.url })}
                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 active:scale-95 transition-transform ${
                          catForm.imageUrl === ph.url ? 'border-plum scale-105' : 'border-gray-200 opacity-70'
                        }`}
                      >
                        <img src={ph.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-center"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-plum hover:bg-plum-dark text-white font-semibold transition-all shadow-xs disabled:opacity-50 active:scale-98 text-center"
                >
                  {saving ? 'Enregistrement...' : editingCat ? 'Modifier' : 'Créer le rayon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Création / Édition Collection */}
      {isColModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-serif text-lg font-bold text-gray-900">
                {editingCol ? 'Modifier la collection' : 'Nouvelle collection thématique'}
              </h3>
              <button
                type="button"
                onClick={() => setIsColModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCol} className="space-y-4 text-xs pb-4 sm:pb-0">
              <div>
                <label className="font-semibold block mb-1">Nom de la collection *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Lueur & Cristaux d'Hiver"
                  value={colForm.name}
                  onChange={(e) => setColForm({ ...colForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-plum text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Identifiant URL (slug)</label>
                <input
                  type="text"
                  placeholder="Ex : lueur-et-cristaux"
                  value={colForm.slug}
                  onChange={(e) => setColForm({ ...colForm, slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-plum font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Univers, inspirations de l'Atelier..."
                  value={colForm.description}
                  onChange={(e) => setColForm({ ...colForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-plum text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Photo d&apos;illustration</label>
                <input
                  type="text"
                  value={colForm.imageUrl}
                  onChange={(e) => setColForm({ ...colForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs mb-2"
                />
                {uploadedPhotos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {uploadedPhotos.slice(0, 8).map((ph) => (
                      <button
                        key={ph.url}
                        type="button"
                        onClick={() => setColForm({ ...colForm, imageUrl: ph.url })}
                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 active:scale-95 transition-transform ${
                          colForm.imageUrl === ph.url ? 'border-plum scale-105' : 'border-gray-200 opacity-70'
                        }`}
                      >
                        <img src={ph.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={colForm.isActive}
                  onChange={(e) => setColForm({ ...colForm, isActive: e.target.checked })}
                  className="w-5 h-5 rounded text-plum"
                />
                <span className="font-semibold text-gray-800">Collection active et visible sur le site</span>
              </label>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsColModalOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-center"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-plum hover:bg-plum-dark text-white font-semibold transition-all shadow-xs disabled:opacity-50 active:scale-98 text-center"
                >
                  {saving ? 'Enregistrement...' : editingCol ? 'Modifier' : 'Créer la collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
