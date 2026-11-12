'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/paths';

const INPUT =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum';
const LABEL = 'text-xs font-semibold text-dark block mb-1';
const EMPTY = { name: '', email: '', phone: '', subject: '', message: '', website: '' };

export default function ContactForm() {
  const [formData, setFormData] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
        setFormData(EMPTY);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Votre message n'a pas pu être envoyé. Merci de réessayer.");
      }
    } catch {
      setError("Connexion impossible : votre message n'est pas parti. Vérifiez votre réseau et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 rounded-2xl bg-sage/20 border border-sage/40 text-center space-y-2" role="status">
        <CheckCircle2 className="w-10 h-10 text-sage mx-auto" aria-hidden="true" />
        <h3 className="font-serif text-lg font-bold text-dark">Message bien reçu !</h3>
        <p className="text-xs text-muted">Merci beaucoup. Claire vous répondra par e-mail dans les plus brefs délais.</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-3 text-xs font-semibold text-plum hover:underline"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Champ piège anti-robots, invisible pour les visiteurs */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Ne pas remplir ce champ</label>
        <input id="contact-website" type="text" name="website" value={formData.website} onChange={set('website')} tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className={LABEL}>Nom complet *</label>
          <input id="contact-name" type="text" required autoComplete="name" value={formData.name} onChange={set('name')} className={INPUT} />
        </div>
        <div>
          <label htmlFor="contact-email" className={LABEL}>Email *</label>
          <input id="contact-email" type="email" required autoComplete="email" value={formData.email} onChange={set('email')} className={INPUT} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-phone" className={LABEL}>Téléphone (facultatif)</label>
          <input id="contact-phone" type="tel" autoComplete="tel" value={formData.phone} onChange={set('phone')} className={INPUT} />
        </div>
        <div>
          <label htmlFor="contact-subject" className={LABEL}>Sujet du message *</label>
          <input id="contact-subject" type="text" required maxLength={200} placeholder="Ex : question sur une création" value={formData.subject} onChange={set('subject')} className={INPUT} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className={LABEL}>Votre message *</label>
        <textarea id="contact-message" required rows={5} maxLength={5000} value={formData.message} onChange={set('message')} className={`${INPUT} resize-none`} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Send className="w-4 h-4" aria-hidden="true" />
        <span>{loading ? 'Envoi en cours...' : 'Envoyer mon message'}</span>
      </button>
    </form>
  );
}
