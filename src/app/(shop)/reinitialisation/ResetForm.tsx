'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import OctopusLogo from '@/components/brand/OctopusLogo';
import { apiFetch } from '@/lib/paths';

export default function ResetForm() {
  const token = useSearchParams().get('jeton') || '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'La réinitialisation a échoué. Merci de réessayer.');
      }
    } catch {
      setError('Connexion au serveur impossible. Vérifiez votre réseau et réessayez.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <OctopusLogo size={48} variant="plum" className="justify-center" />
          <h1 className="font-serif text-2xl font-bold text-dark">Nouveau mot de passe</h1>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <p className="p-4 bg-sage/15 border border-sage/40 rounded-xl text-xs text-eucalyptus" role="status">
              Votre mot de passe est modifié. Vous pouvez vous connecter.
            </p>
            <Link
              href="/connexion"
              className="inline-flex items-center justify-center px-8 py-3 min-h-[44px] rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Se connecter
            </Link>
          </div>
        ) : !token ? (
          <p className="text-xs text-muted text-center">
            Ce lien est incomplet.{' '}
            <Link href="/mot-de-passe-oublie" className="text-plum font-semibold hover:underline">
              Refaire une demande
            </Link>
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700" role="alert">
                {error}{' '}
                <Link href="/mot-de-passe-oublie" className="font-semibold underline">
                  Nouvelle demande
                </Link>
              </div>
            )}
            <div>
              <label htmlFor="reset-password" className="text-xs font-semibold text-dark block mb-1">
                Nouveau mot de passe
              </label>
              <input
                id="reset-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
              />
              <p className="text-[11px] text-muted mt-1">8 caractères minimum.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
