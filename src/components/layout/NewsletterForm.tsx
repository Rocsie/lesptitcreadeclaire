'use client';

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/paths';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      const res = await apiFetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "L'inscription n'a pas abouti. Merci de réessayer.");
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
    }
    setStatus('idle');
  };

  if (status === 'success') {
    return (
      <div className="p-3 bg-sage/20 border border-sage/40 rounded-xl text-xs text-eucalyptus flex items-center gap-2" role="status">
        <CheckCircle2 className="w-4 h-4 text-sage shrink-0" aria-hidden="true" />
        <span>Merci ! Vous êtes inscrite à la lettre de l&apos;atelier.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="email"
        required
        autoComplete="email"
        aria-label="Votre adresse email"
        placeholder="Votre adresse email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3.5 py-2 text-xs bg-white rounded-lg border border-rose-powder/40 focus:outline-none focus:border-plum"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full py-2 px-4 rounded-lg bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs disabled:opacity-60"
      >
        {status === 'sending' ? 'Inscription...' : "S'inscrire"}
      </button>
      {error && (
        <p className="text-[11px] text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="text-[10px] text-muted/70">
        En vous inscrivant, vous acceptez de recevoir nos e-mails. Désinscription sur simple demande.
      </p>
    </form>
  );
}
