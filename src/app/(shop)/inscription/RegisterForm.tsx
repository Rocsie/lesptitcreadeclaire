'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OctopusLogo from '@/components/brand/OctopusLogo';

const INPUT =
  'w-full px-3 py-2.5 text-sm rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum';
const LABEL = 'text-xs font-semibold text-dark block mb-1';

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const rawReturn = searchParams.get('retour');
  const returnPath =
    rawReturn && rawReturn.startsWith('/') && !rawReturn.startsWith('//') && !rawReturn.startsWith('/admin')
      ? rawReturn
      : null;

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      router.push(returnPath || '/compte');
      router.refresh();
      return;
    }
    setLoading(false);
    setError(result.error || "Erreur lors de l'inscription.");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-3xl border border-rose-powder/30 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <OctopusLogo size={48} variant="plum" className="justify-center" />
          <h1 className="font-serif text-2xl font-bold text-dark">Créer un compte</h1>
          <p className="text-xs text-muted">Pour suivre vos commandes et gagner du temps à la prochaine.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-firstName" className={LABEL}>Prénom *</label>
              <input id="reg-firstName" type="text" required autoComplete="given-name" value={formData.firstName} onChange={set('firstName')} className={INPUT} />
            </div>
            <div>
              <label htmlFor="reg-lastName" className={LABEL}>Nom *</label>
              <input id="reg-lastName" type="text" required autoComplete="family-name" value={formData.lastName} onChange={set('lastName')} className={INPUT} />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className={LABEL}>Email *</label>
            <input id="reg-email" type="email" required autoComplete="email" value={formData.email} onChange={set('email')} className={INPUT} />
          </div>

          <div>
            <label htmlFor="reg-phone" className={LABEL}>Téléphone</label>
            <input id="reg-phone" type="tel" autoComplete="tel" value={formData.phone} onChange={set('phone')} className={INPUT} />
          </div>

          <div>
            <label htmlFor="reg-password" className={LABEL}>Mot de passe *</label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              aria-describedby="reg-password-help"
              value={formData.password}
              onChange={set('password')}
              className={INPUT}
            />
            <p id="reg-password-help" className="text-[11px] text-muted mt-1">8 caractères minimum.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Création...' : 'Créer mon compte'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <p className="text-[11px] text-muted text-center">
            Vos informations servent uniquement au suivi de vos commandes. Voir la{' '}
            <Link href="/confidentialite" className="text-plum hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </form>

        <div className="text-center text-xs text-muted pt-4 border-t border-rose-powder/20">
          Vous avez déjà un compte ?{' '}
          <Link href="/connexion" className="text-plum font-semibold hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
