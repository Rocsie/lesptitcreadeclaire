import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { store } from '@/lib/store';
import ShopImage from '@/components/ui/ShopImage';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { FloralDivider } from '@/components/brand/FloralAccents';

export const metadata: Metadata = pageMetadata({
  title: 'Collections de bijoux artisanaux',
  description:
    "Les collections de l'atelier : éclats de couleurs, esprit marin, lumière et finesse. Des univers de bijoux faits main à Port-la-Nouvelle.",
  path: '/collections',
});

export default async function CollectionsPage() {
  // Seules les collections actives sont présentées aux visiteurs.
  const collections = (await store.getCollections()).filter((c) => c.isActive);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Accueil', path: '/' },
          { name: 'Collections', path: '/collections' },
        ])}
      />
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

      {collections.length === 0 && (
        <p className="text-center text-sm text-muted">
          Les collections sont en préparation. En attendant, toutes les créations sont dans{' '}
          <Link href="/boutique" className="text-plum font-semibold hover:underline">
            la boutique
          </Link>
          .
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {collections.map((col) => (
          <div
            key={col.id}
            className="group rounded-3xl overflow-hidden bg-white border border-rose-powder/30 shadow-md flex flex-col justify-between hover:shadow-xl hover:border-gold/50 transition-all"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-cream-warm">
              <ShopImage
                src={col.imageUrl}
                alt={`Collection ${col.name}`}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
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
                href={`/collections/${col.slug}`}
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
