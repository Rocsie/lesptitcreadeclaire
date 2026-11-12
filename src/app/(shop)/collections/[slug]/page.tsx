import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BoutiqueClient from '../../boutique/BoutiqueClient';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, clip, itemListJsonLd, pageMetadata } from '@/lib/seo';
import { store } from '@/lib/store';

type Props = { params: Promise<{ slug: string }> };

// Une page par collection active (/collections/esprit-marin).
async function loadCollection(slug: string) {
  const collections = (await store.getCollections()).filter((c) => c.isActive);
  return { collections, collection: collections.find((c) => c.slug === decodeURIComponent(slug)) || null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { collection } = await loadCollection(slug);
  if (!collection) return { title: 'Collection introuvable', robots: { index: false } };

  return pageMetadata({
    title: `Collection ${collection.name}`,
    description: clip(
      `${collection.description ? `${collection.description} ` : ''}Collection ${collection.name} : bijoux artisanaux faits main à Port-la-Nouvelle par Claire.`
    ),
    path: `/collections/${collection.slug}`,
    image: collection.imageUrl,
    imageAlt: `Collection ${collection.name}`,
  });
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const [{ collections, collection }, products, categories] = await Promise.all([
    loadCollection(slug),
    store.getVisibleProducts(),
    store.getCategories(),
  ]);
  if (!collection) notFound();

  const inCollection = products.filter((p) => p.collectionId === collection.id);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Accueil', path: '/' },
          { name: 'Collections', path: '/collections' },
          { name: collection.name, path: `/collections/${collection.slug}` },
        ])}
      />
      <JsonLd data={itemListJsonLd(`Collection ${collection.name}`, inCollection)} />
      <BoutiqueClient
        products={products}
        categories={categories}
        collections={collections}
        initialCollection={collection.slug}
        breadcrumb={[{ name: 'Accueil', path: '/' }, { name: 'Collections', path: '/collections' }, { name: collection.name }]}
        heading={{
          eyebrow: 'Collection',
          title: collection.name,
          intro:
            collection.description ||
            `Les créations de la collection ${collection.name}, façonnées à la main à l'atelier de Port-la-Nouvelle.`,
        }}
      />
    </>
  );
}
