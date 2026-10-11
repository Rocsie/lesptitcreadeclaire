'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Upload,
  Image as ImageIcon,
  Star,
  Loader2,
  Link as LinkIcon,
  Eye,
  Check
} from 'lucide-react';
import { Product, Category, Collection } from '@/lib/store';

const ATELIER_PRESETS = [
  { label: "Boucles d'oreilles pivoine", url: "/images/boucles-oreilles.jpg" },
  { label: "Bagues ciselées géométrie", url: "/images/bagues.jpg" },
  { label: "Broche poisson lagon", url: "/images/broches.jpg" },
  { label: "Collier plastron minéral", url: "/images/colliers.jpg" },
  { label: "Composition atelier bijoux", url: "/images/hero-atelier.jpg" },
  { label: "Claire à son établi", url: "/images/claire-atelier.jpg" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Création / Édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Gestion des images
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [uploadedGallery, setUploadedGallery] = useState<Array<{ name: string; url: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    reference: '',
    shortDescription: '',
    description: '',
    price: 35,
    compareAtPrice: 0,
    stock: 5,
    lowStockThreshold: 3,
    status: 'PUBLISHED' as Product['status'],
    isUniquePiece: false,
    badgeText: 'Nouveauté',
    materials: 'Résine, laiton doré à l\'or fin, sans nickel.',
    dimensions: 'Hauteur : 4,5 cm',
    categoryId: '',
    collectionId: '',
  });

  const fetchAll = () => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/collections').then((r) => r.json()),
      fetch('/api/upload').then((r) => r.json()).catch(() => ({ files: [] })),
    ])
      .then(([prods, cats, cols, uploads]) => {
        if (Array.isArray(prods)) setProducts(prods);
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(cols)) setCollections(cols);
        if (uploads && Array.isArray(uploads.files)) setUploadedGallery(uploads.files);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setImagesList(['/images/boucles-oreilles.jpg']);
    setUploadError(null);
    setCustomUrlInput('');
    setShowPresets(false);
    setForm({
      name: '',
      slug: '',
      reference: `PCC-${Math.floor(100 + Math.random() * 900)}`,
      shortDescription: '',
      description: '',
      price: 35,
      compareAtPrice: 0,
      stock: 5,
      lowStockThreshold: 3,
      status: 'PUBLISHED',
      isUniquePiece: false,
      badgeText: 'Fait main',
      materials: '',
      dimensions: '',
      categoryId: categories[0]?.id || '',
      collectionId: collections[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    const existingImgs = p.images && p.images.length > 0
      ? p.images.map((img) => img.url)
      : ['/images/hero-atelier.jpg'];
    setImagesList(existingImgs);
    setUploadError(null);
    setCustomUrlInput('');
    setShowPresets(false);
    setForm({
      name: p.name,
      slug: p.slug,
      reference: p.reference,
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      price: p.price,
      compareAtPrice: p.compareAtPrice || 0,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      status: p.status,
      isUniquePiece: p.isUniquePiece,
      badgeText: p.badgeText || '',
      materials: p.materials || '',
      dimensions: p.dimensions || '',
      categoryId: p.categoryId || '',
      collectionId: p.collectionId || '',
    });
    setIsModalOpen(true);
  };

  // Upload de fichiers locaux (JPG, PNG, WEBP...)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || 'Erreur lors du téléchargement');
      } else {
        const uploaded = data.urls || (data.url ? [data.url] : []);
        setImagesList((prev) => [...prev, ...uploaded]);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Erreur de connexion au serveur');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };


  const handleAddCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setImagesList((prev) => [...prev, customUrlInput.trim()]);
    setCustomUrlInput('');
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImagesList((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  const handleRemoveImage = (index: number) => {
    setImagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPresetImage = (url: string) => {
    if (!imagesList.includes(url)) {
      setImagesList((prev) => [...prev, url]);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalImages = imagesList.length > 0
      ? imagesList.map((url, idx) => ({ url, altText: `${form.name} - Photo ${idx + 1}` }))
      : [{ url: '/images/hero-atelier.jpg', altText: form.name }];

    const payload = {
      ...form,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      images: finalImages,
    };

    if (editingProduct) {
      await fetch(`/api/products/${editingProduct.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: editingProduct.id }),
      });
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setIsModalOpen(false);
    fetchAll();
  };


  const handleDeleteProduct = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette création ?')) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchAll();
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Gestion des Produits</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Ajoutez de nouveaux bijoux, ajustez les prix, les photos et les fiches techniques.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-plum hover:bg-plum-dark text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Création</span>
        </button>
      </div>

      {/* Barre recherche */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-plum"
          />
        </div>
      </div>

      {/* Table des produits */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Création</th>
                <th className="p-4">Réf</th>
                <th className="p-4">Prix</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Type</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images?.[0]?.url || '/images/hero-atelier.jpg'}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-xs">{p.shortDescription}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-gray-700">{p.reference}</td>
                  <td className="p-4 font-serif font-bold text-sm text-gray-900">
                    {p.price.toFixed(2)} €
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        p.stock <= p.lowStockThreshold
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.stock} en stock
                    </span>
                  </td>
                  <td className="p-4">
                    {p.isUniquePiece ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/20 text-yellow-900">
                        Pièce unique
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500">Petite série</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-plum hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Créer / Modifier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold font-serif text-gray-900">
                {editingProduct ? 'Modifier la création' : 'Ajouter une nouvelle création'}
              </h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Nom du bijou *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Référence *</label>
                  <input
                    type="text"
                    required
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Prix (€) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Prix barré (€)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.compareAtPrice}
                    onChange={(e) => setForm({ ...form, compareAtPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Stock disponible</label>
                  <input
                    type="number"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              {/* Gestion avancée des photos du produit */}
              <div className="space-y-3 p-4 rounded-2xl bg-cream/60 border border-rose-powder/40">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-plum" />
                      <span>Photos de la création ({imagesList.length})</span>
                    </label>
                    <p className="text-[11px] text-gray-500">
                      La 1ère photo est l&apos;image principale (vitrine &amp; catalogue). Vous pouvez en ajouter plusieurs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPresets(!showPresets)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-gray-200 text-gray-700 hover:text-plum hover:border-plum transition-all"
                    >
                      {showPresets ? 'Masquer modèles' : 'Photos modèles atelier'}
                    </button>
                  </div>
                </div>

                {/* Zone Glisser-Déposer / Upload */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropFiles}
                  className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center transition-all ${
                    isUploading
                      ? 'border-plum bg-rose-powder/20'
                      : 'border-rose-powder/80 hover:border-plum bg-white/70 hover:bg-white'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    id="admin-product-file-upload"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <label
                    htmlFor="admin-product-file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-8 h-8 text-plum animate-spin" />
                        <span className="text-xs font-semibold text-plum">
                          Téléchargement et enregistrement de vos photos en cours...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-rose-powder/40 flex items-center justify-center text-plum">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-800">
                            Glissez vos photos ici ou <span className="text-plum underline">parcourez vos fichiers</span>
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Prend en charge tous types d&apos;images : JPG, PNG, WEBP, GIF (jusqu&apos;à 10 Mo par photo)
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {/* Message d'erreur upload */}
                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                    <span>{uploadError}</span>
                    <button type="button" onClick={() => setUploadError(null)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Galerie des photos déjà téléversées */}
                {uploadedGallery.length > 0 && (
                  <div className="p-3 bg-white rounded-2xl border border-rose-powder/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-plum flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Vos photos déjà enregistrées ({uploadedGallery.length}) :
                      </span>
                      <span className="text-[10px] text-gray-500">Cliquez pour ajouter au produit</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                      {uploadedGallery.map((file) => {
                        const isSelected = imagesList.includes(file.url);
                        return (
                          <button
                            key={file.url}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setImagesList((prev) => prev.filter((u) => u !== file.url));
                              } else {
                                setImagesList((prev) => [...prev, file.url]);
                              }
                            }}
                            className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                              isSelected
                                ? 'border-plum ring-2 ring-plum/40 scale-95 shadow-sm'
                                : 'border-gray-200 hover:border-plum opacity-75 hover:opacity-100'
                            }`}
                            title={file.name}
                          >
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                            {isSelected && (
                              <span className="absolute inset-0 bg-plum/40 flex items-center justify-center text-white">
                                <Check className="w-5 h-5 drop-shadow" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sélecteur de modèles d'ambiance atelier */}
                {showPresets && (
                  <div className="p-3 bg-white rounded-xl border border-rose-powder/50 space-y-2">
                    <p className="text-[11px] font-bold text-gray-700">Choisir parmi les photos existantes de l&apos;atelier :</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ATELIER_PRESETS.map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => handleAddPresetImage(preset.url)}
                          className="flex items-center gap-2 p-1.5 rounded-lg border border-gray-200 hover:border-plum text-left bg-gray-50/50 hover:bg-rose-powder/10 transition-all text-[11px]"
                        >
                          <img src={preset.url} alt={preset.label} className="w-7 h-7 rounded-md object-cover" />
                          <span className="truncate">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ajout manuel par lien URL */}
                <div className="flex gap-2 items-center pt-1">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="Ou collez l'adresse URL d'une image web..."
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomUrl}
                    disabled={!customUrlInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-gray-800 text-white font-semibold text-xs disabled:opacity-40 hover:bg-black transition-all"
                  >
                    Ajouter URL
                  </button>
                </div>

                {/* Galerie des miniatures du produit en cours */}
                {imagesList.length > 0 ? (
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold text-gray-700 mb-2">
                      Photos actuelles ({imagesList.length}) :
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {imagesList.map((imgUrl, idx) => (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className={`relative group rounded-xl overflow-hidden border-2 bg-white aspect-square shadow-xs transition-all ${
                            idx === 0 ? 'border-plum ring-2 ring-plum/20' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Badge Principale */}
                          {idx === 0 ? (
                            <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-plum to-plum-dark text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-gold text-gold" />
                              Principale
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              title="Définir comme photo principale"
                              className="absolute top-1.5 left-1.5 bg-white/95 text-gray-700 hover:text-plum text-[9px] font-semibold px-1.5 py-0.5 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                            >
                              <Star className="w-2.5 h-2.5 text-gold" />
                              Mettre 1ère
                            </button>
                          )}

                          {/* Bouton Supprimer */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            title="Supprimer cette photo"
                            className="absolute top-1.5 right-1.5 bg-white/95 hover:bg-red-50 text-gray-500 hover:text-red-600 p-1 rounded-md shadow-xs transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Numéro photo */}
                          <span className="absolute bottom-1 right-1.5 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.2 rounded">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    ⚠️ Aucune photo sélectionnée. Ajoutez au moins une photo pour mettre en valeur votre création.
                  </div>
                )}
              </div>


              <div>
                <label className="font-semibold block mb-1">Description courte</label>
                <input
                  type="text"
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description complète</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Matériaux</label>
                  <input
                    type="text"
                    value={form.materials}
                    onChange={(e) => setForm({ ...form, materials: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={form.dimensions}
                    onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isUniquePiece}
                    onChange={(e) => setForm({ ...form, isUniquePiece: e.target.checked })}
                    className="rounded text-plum"
                  />
                  <span className="font-semibold">Pièce unique</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="font-semibold">Statut :</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="px-2 py-1 rounded-lg border border-gray-200"
                  >
                    <option value="PUBLISHED">En ligne</option>
                    <option value="DRAFT">Brouillon</option>
                    <option value="HIDDEN">Masqué</option>
                    <option value="SOLD_OUT">Épuisé</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-gray-100 text-gray-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-plum text-white font-semibold hover:bg-plum-dark"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
