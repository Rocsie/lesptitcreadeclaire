import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { store } from '@/lib/store';
import { FloralDivider } from '@/components/brand/FloralAccents';

export default async function CollectionsPage() {
  const collections = await store.getCollections();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-plum">
          Inspirations & Thématiques
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-dark">
          Nos Collections
        </h1>
        <p className="text-sm text-muted max-w-xl mx-auto font-light">
          Chaque collection exprime un univers poétique : éclats festifs, reflets de la mer ou géométries précieuses.
        </p>
        <FloralDivider />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {collections.map((col) => (
          <div
            key={col.id}
            className="group rounded-3xl overflow-hidden bg-white border border-rose-powder/30 shadow-md flex flex-col justify-between hover:shadow-xl hover:border-gold/50 transition-all"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-cream-warm">
              <img
                src={col.imageUrl || '/images/hero-atelier.jpg'}
                alt={col.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="font-serif text-2xl font-bold text-white leading-snug">
                  {col.name}
                </h2>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                {col.description}
              </p>
              <Link
                href={`/boutique?collection=${col.slug}`}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-plum hover:text-plum-dark"
              >
                <span>Découvrir la collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
