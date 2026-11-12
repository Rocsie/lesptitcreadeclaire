'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OctopusLogo from '@/components/brand/OctopusLogo';

// N'accepte comme page de retour qu'un chemin interne au site.
function safeReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  return value;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isAdmin } = useAuth();
  const returnPath = safeReturnPath(searchParams.get('retour'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success && result.user) {
      const home = result.user.role === 'ADMIN' ? '/admin' : '/compte';
      const allowed = returnPath && (result.user.role === 'ADMIN' || !returnPath.startsWith('/admin'));
      router.push(allowed ? returnPath : home);
      router.refresh();
      return;
    }
    setLoading(false);
    setError(result.error || 'Email ou mot de passe incorrect.');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <OctopusLogo size={48} variant="plum" className="justify-center" />
          <h1 className="font-serif text-2xl font-bold text-dark">Connexion</h1>
          <p className="text-xs text-muted">Accédez à vos commandes et à vos informations.</p>
        </div>

        {user && !loading && (
          <div className="p-3 bg-sage/15 border border-sage/40 rounded-xl text-xs text-eucalyptus" role="status">
            Vous êtes connectée en tant que {user.firstName}.{' '}
            <Link href={isAdmin ? '/admin' : '/compte'} className="font-semibold underline">
              {isAdmin ? "Ouvrir l'administration" : 'Voir mon compte'}
            </Link>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-xs font-semibold text-dark block mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="text-xs font-semibold text-dark block mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Connexion...' : 'Se connecter'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        <p className="text-center text-xs">
          <Link href="/mot-de-passe-oublie" className="text-plum font-semibold hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>

        <div className="text-center text-xs text-muted pt-4 border-t border-rose-powder/20">
          Pas encore de compte ?{' '}
          <Link
            href={returnPath ? `/inscription?retour=${encodeURIComponent(returnPath)}` : '/inscription'}
            className="text-plum font-semibold hover:underline"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
