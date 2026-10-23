'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { OpeningHour } from '@/lib/store';
import { FloralCorner, FloralDivider, HandDrawnHeart } from '@/components/brand/FloralAccents';
import OctopusLogo from '@/components/brand/OctopusLogo';

export default function ContactPage() {
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    honeypot: '', // anti-spam
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/cms/hours')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHours(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.honeypot) return; // bot detected

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '', honeypot: '' });
      }
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16">
      <div className="text-center space-y-3 relative">
        <FloralCorner position="top-left" className="-top-6 left-0" />
        <FloralCorner position="top-right" className="-top-6 right-0" />

        <OctopusLogo size={52} variant="plum" className="justify-center mx-auto mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest text-plum">
          Nous rendre visite ou nous écrire
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-dark">
          Contact & Horaires
        </h1>
        <p className="text-sm text-muted max-w-xl mx-auto font-light">
          Une question sur une création, une commande personnalisée ou nos horaires à Port-la-Nouvelle ? Claire vous répond avec plaisir.
        </p>
        <FloralDivider />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Colonne Gauche : Formulaire de contact */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-rose-powder/30 shadow-sm space-y-6">
          <h2 className="font-serif text-2xl font-bold text-dark">
            Envoyer un Message à Claire
          </h2>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-sage/20 border border-sage/40 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-sage mx-auto" />
              <h3 className="font-serif text-lg font-bold text-dark">Message bien reçu !</h3>
              <p className="text-xs text-muted">
                Merci beaucoup ! Claire vous répondra par e-mail dans les plus brefs délais.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 text-xs font-semibold text-plum hover:underline"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Champ pot de miel anti-spam */}
              <input
                type="text"
                name="website"
                value={formData.honeypot}
                onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-dark block mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Votre nom"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="votre@email.fr"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-dark block mb-1">Téléphone (facultatif)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="06 00 00 00 00"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark block mb-1">Sujet du message *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Ex: Demande de renseignement bijou"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-dark block mb-1">Votre message *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Écrivez votre message ici..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-powder/40 focus:outline-none focus:border-plum resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3.5 rounded-full bg-plum hover:bg-plum-dark text-white font-semibold text-xs uppercase tracking-wider active:scale-98 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Envoi en cours...' : 'Envoyer mon message'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Colonne Droite : Coordonnées, Horaires & Plan Port-la-Nouvelle */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bloc Horaires fidèle au flyer */}
          <div className="p-6 rounded-3xl bg-cream-warm border border-rose-powder/30 space-y-4">
            <div className="flex items-center gap-2 text-plum">
              <Clock className="w-5 h-5 text-plum" />
              <h3 className="font-serif text-lg font-bold text-dark">Horaires de la Boutique L&apos;Atelier</h3>
            </div>

            <div className="space-y-2 text-xs">
              {hours.map((h) => (
                <div key={h.id} className="flex justify-between p-2.5 bg-white rounded-xl border border-rose-powder/20">
                  <span className="font-bold text-plum">{h.dayGroup}</span>
                  <span className="text-dark font-medium">{h.morningHours} / {h.afternoonHours}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted italic flex items-center gap-1">
              <HandDrawnHeart color="gold" size={12} /> Ouvert toute l&apos;année du lundi au dimanche à Port-la-Nouvelle.
            </p>
          </div>

          {/* Coordonnées directes */}
          <div className="p-6 rounded-3xl bg-white border border-rose-powder/30 space-y-3 text-xs text-dark/80">
            <h3 className="font-serif text-lg font-bold text-dark mb-2">Coordonnées</h3>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold shrink-0" />
              <span>Boutique L&apos;Atelier, 11210 Port-la-Nouvelle (Aude, Occitanie)</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-plum shrink-0" />
              <span>04 68 00 00 00</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-rose-old shrink-0" />
              <span>contact@lesptitescreadeclaire.fr</span>
            </p>
          </div>

          {/* Localisation Port-la-Nouvelle */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-light to-cream-warm border border-rose-powder/40 space-y-3">
            <div className="flex items-center gap-2 text-plum font-serif text-base font-bold">
              <MapPin className="w-4 h-4 text-gold" />
              <span>Port-la-Nouvelle & son Littoral</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Venez nous rendre visite au bord de l&apos;étang et de la mer ! Vous pourrez retirer gratuitement vos achats web et découvrir en exclusivité les pièces uniques tout juste sorties de l&apos;établi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
