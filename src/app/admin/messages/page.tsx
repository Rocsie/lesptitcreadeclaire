'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Trash2, MailOpen, Reply } from 'lucide-react';
import { apiFetch } from '@/lib/paths';
import type { ContactMessage } from '@/lib/types';

export default function AdminMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch('/api/contact')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const setRead = async (msg: ContactMessage, read: boolean) => {
    const res = await apiFetch('/api/contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: msg.id, read }),
    });
    if (res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read } : m)));
      router.refresh(); // met à jour le compteur du menu
    }
  };

  const remove = async (msg: ContactMessage) => {
    if (!confirm(`Supprimer définitivement le message de ${msg.name} ?`)) return;
    const res = await apiFetch(`/api/contact?id=${encodeURIComponent(msg.id)}`, { method: 'DELETE' });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      router.refresh();
    }
  };

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Messages reçus</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Messages envoyés depuis le formulaire de contact du site.
          {messages.length > 0 && ` ${unread} non lu${unread > 1 ? 's' : ''} sur ${messages.length}.`}
        </p>
      </div>

      {loading && <p className="text-xs text-gray-500">Chargement des messages...</p>}
      {error && (
        <p className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          Les messages n&apos;ont pas pu être chargés. Rechargez la page.
        </p>
      )}
      {!loading && !error && messages.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs">
          Aucun message pour le moment.
        </div>
      )}

      <div className="space-y-3">
        {messages.map((msg) => (
          <article
            key={msg.id}
            className={`p-5 rounded-2xl bg-white border shadow-2xs space-y-3 text-xs ${
              msg.read ? 'border-gray-200' : 'border-plum/40 ring-1 ring-plum/10'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  {!msg.read && <span className="w-2 h-2 rounded-full bg-plum shrink-0" aria-label="Non lu" />}
                  <span className="truncate">{msg.subject}</span>
                </h2>
                <p className="text-gray-500 mt-0.5">
                  {msg.name} • {new Date(msg.createdAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
              <a
                href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject}`)}`}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-plum hover:bg-plum-dark text-white font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Reply className="w-3.5 h-3.5" aria-hidden="true" />
                Répondre à {msg.email}
              </a>
              {msg.phone && (
                <a
                  href={`tel:${msg.phone.replace(/\s+/g, '')}`}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  {msg.phone}
                </a>
              )}
              <button
                type="button"
                onClick={() => setRead(msg, !msg.read)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold flex items-center gap-1.5 transition-colors"
              >
                {msg.read ? <Mail className="w-3.5 h-3.5" aria-hidden="true" /> : <MailOpen className="w-3.5 h-3.5" aria-hidden="true" />}
                {msg.read ? 'Marquer non lu' : 'Marquer comme lu'}
              </button>
              <button
                type="button"
                onClick={() => remove(msg)}
                className="min-h-[40px] px-3 py-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 font-semibold flex items-center gap-1.5 transition-colors ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
