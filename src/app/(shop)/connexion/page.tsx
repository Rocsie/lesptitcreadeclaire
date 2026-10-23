'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OctopusLogo from '@/components/brand/OctopusLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (email.toLowerCase().includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/compte');
      }
    } else {
      setError(result.error || 'Identifiants invalides');
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@lesptitescreadeclaire.fr');
    setPassword('claire2026!');
  };

  const fillDemoClient = () => {
    setEmail('sophie.martin@example.fr');
    setPassword('client123!');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <OctopusLogo size={48} variant="plum" className="justify-center" />
          <h1 className="font-serif text-2xl font-bold text-dark">Connexion</h1>
          <p className="text-xs text-muted">
            Accédez à vos commandes, vos favoris et vos adresses.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-dark block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-dark block mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Connexion...' : 'Se connecter'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Boutons d'accès rapide de démonstration */}
        <div className="pt-2 border-t border-rose-powder/20 space-y-2">
          <p className="text-[11px] font-semibold text-muted text-center uppercase tracking-wider">
            Comptes de démonstration :
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="min-h-[44px] p-2 rounded-xl bg-plum/10 hover:bg-plum/20 text-plum font-semibold text-xs active:scale-95 transition-all flex items-center justify-center"
            >
              Claire (Admin)
            </button>
            <button
              type="button"
              onClick={fillDemoClient}
              className="min-h-[44px] p-2 rounded-xl bg-rose-powder/30 hover:bg-rose-powder/50 text-dark font-semibold text-xs active:scale-95 transition-all flex items-center justify-center"
            >
              Sophie (Cliente)
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-muted pt-2">
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="text-plum font-semibold hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
