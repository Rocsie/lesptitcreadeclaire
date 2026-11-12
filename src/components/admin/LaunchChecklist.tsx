'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, CircleDashed } from 'lucide-react';
import { apiFetch } from '@/lib/paths';
import type { ChecklistItem } from '@/lib/launch-checklist';

// Contrôle de mise en ligne : ce qui reste à régler avant de vendre pour de vrai.
// La carte disparaît du tableau de bord quand tout est en place.
export default function LaunchChecklist({ hideWhenDone = false }: { hideWhenDone?: boolean }) {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);

  useEffect(() => {
    apiFetch('/api/admin/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setItems(Array.isArray(data?.checklist) ? data.checklist : []))
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  const remaining = items.filter((item) => !item.ok);
  const blocking = remaining.filter((item) => item.blocking);
  if (hideWhenDone && remaining.length === 0) return null;

  const done = items.length - remaining.length;

  return (
    <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4" aria-labelledby="mise-en-ligne">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 id="mise-en-ligne" className="text-sm font-bold text-gray-900">
            Contrôle de mise en ligne
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {remaining.length === 0
              ? 'Tout est en place : la boutique est prête à vendre.'
              : blocking.length > 0
              ? `${blocking.length} point${blocking.length > 1 ? 's' : ''} à régler avant de vendre pour de vrai.`
              : 'Les points essentiels sont réglés. Il reste des améliorations possibles.'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
            <div className="h-full bg-plum rounded-full" style={{ width: `${(done / items.length) * 100}%` }} />
          </div>
          <span className="text-xs font-bold text-gray-900">
            {done} / {items.length}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.id} className="py-3 flex items-start gap-3 text-xs">
            {item.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            ) : item.blocking ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <CircleDashed className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900">
                {item.label}
                <span className="sr-only">{item.ok ? ' : en place' : item.blocking ? ' : à régler' : ' : à améliorer'}</span>
              </p>
              <p className="text-gray-500 mt-0.5">{item.detail}</p>
            </div>
            {!item.ok && item.href && (
              <Link href={item.href} className="shrink-0 font-semibold text-plum hover:underline">
                Régler
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
