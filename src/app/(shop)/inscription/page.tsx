'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OctopusLogo from '@/components/brand/OctopusLogo';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      router.push('/compte');
    } else {
      setError(result.error || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <OctopusLogo size={48} variant="plum" className="justify-center" />
          <h1 className="font-serif text-2xl font-bold text-dark">Créer un Compte</h1>
          <p className="text-xs text-muted">
            Rejoignez notre cercle de passionnées de bijoux faits main.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-dark block mb-1">Prénom *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-dark block mb-1">Nom *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-dark block mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-dark block mb-1">Téléphone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-dark block mb-1">Mot de passe *</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Création...' : 'Créer mon compte'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-muted pt-2 border-t border-rose-powder/20">
          Vous possédez déjà un compte ?{' '}
          <Link href="/connexion" className="text-plum font-semibold hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
