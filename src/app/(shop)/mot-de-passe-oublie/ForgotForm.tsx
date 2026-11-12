'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import OctopusLogo from '@/components/brand/OctopusLogo';
import { apiFetch } from '@/lib/paths';

export default function ForgotForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'La demande a échoué. Merci de réessayer.');
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
          <h1 className="font-serif text-2xl font-bold text-dark">Mot de passe oublié</h1>
          <p className="text-xs text-muted">
            Indiquez l&apos;email de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.
          </p>
        </div>

        {sent ? (
          <div className="p-4 bg-sage/15 border border-sage/40 rounded-xl text-xs text-eucalyptus space-y-2" role="status">
            <p>
              Si un compte existe avec cette adresse, un email vient de partir. Le lien est valable une heure. Pensez à regarder dans les courriers indésirables.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700" role="alert">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="forgot-email" className="text-xs font-semibold text-dark block mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Recevoir le lien'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-muted pt-4 border-t border-rose-powder/20">
          <Link href="/connexion" className="text-plum font-semibold hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
