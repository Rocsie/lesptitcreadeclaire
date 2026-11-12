import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import BoutiqueClient from './BoutiqueClient';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from '@/lib/seo';
import { store } from '@/lib/store';

export const metadata: Metadata = pageMetadata({
  title: 'Boutique de bijoux faits main',
  description:
    "Boucles d'oreilles, bagues, broches et colliers faits main à Port-la-Nouvelle. Pièces uniques et petites séries, retrait gratuit ou livraison Colissimo.",
  path: '/boutique',
});

type Props = { searchParams: Promise<{ categorie?: string; collection?: string }> };

export default async function BoutiquePage({ searchParams }: Props) {
  const [products, categories, collections, params] = await Promise.all([
    store.getVisibleProducts(),
    store.getCategories(),
    store.getCollections(),
    searchParams,
  ]);

  // Anciennes adresses (?categorie=bagues, ?collection=esprit-marin) : redirection
  // définitive vers la vraie page, pour qu'une seule adresse existe par rayon.
  if (params.categorie && categories.some((c) => c.slug === params.categorie)) {
    permanentRedirect(`/boutique/${params.categorie}`);
  }
  if (params.collection && collections.some((c) => c.slug === params.collection && c.isActive)) {
    permanentRedirect(`/collections/${params.collection}`);
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Accueil', path: '/' },
          { name: 'Boutique', path: '/boutique' },
        ])}
      />
      <JsonLd data={itemListJsonLd('Bijoux artisanaux de la boutique', products)} />
      <BoutiqueClient
        products={products}
        categories={categories}
        collections={collections.filter((c) => c.isActive)}
        heading={{
          eyebrow: 'Nos créations façon atelier',
          title: 'La Boutique',
          intro: 'Bijoux colorés, pièces uniques et petites séries façonnées à la main à Port-la-Nouvelle.',
        }}
      />
    </>
  );
}
