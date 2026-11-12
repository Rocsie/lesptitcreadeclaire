import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BoutiqueClient from '../BoutiqueClient';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, clip, itemListJsonLd, pageMetadata } from '@/lib/seo';
import { store } from '@/lib/store';

type Props = { params: Promise<{ categorie: string }> };

// Une page par rayon (/boutique/bagues, /boutique/boucles-d-oreilles...) avec son propre
// titre, sa description et sa liste de créations : c'est elle que les moteurs de recherche
// proposent à quelqu'un qui cherche "bagues artisanales Port-la-Nouvelle".
async function loadCategory(slug: string) {
  const categories = await store.getCategories();
  return { categories, category: categories.find((c) => c.slug === decodeURIComponent(slug)) || null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorie } = await params;
  const { category } = await loadCategory(categorie);
  if (!category) return { title: 'Rayon introuvable', robots: { index: false } };

  return pageMetadata({
    title: `${category.name} | Bijoux artisanaux à Port-la-Nouvelle`,
    absoluteTitle: true,
    description: clip(
      `${category.description ? `${category.description} ` : ''}Créations du rayon ${category.name} réalisées à la main à Port-la-Nouvelle, retrait gratuit à l'atelier ou livraison Colissimo.`
    ),
    path: `/boutique/${category.slug}`,
    image: category.imageUrl,
    imageAlt: category.name,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { categorie } = await params;
  const [{ categories, category }, products, collections] = await Promise.all([
    loadCategory(categorie),
    store.getVisibleProducts(),
    store.getCollections(),
  ]);
  if (!category) notFound();

  const inCategory = products.filter((p) => p.categoryId === category.id);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Accueil', path: '/' },
          { name: 'Boutique', path: '/boutique' },
          { name: category.name, path: `/boutique/${category.slug}` },
        ])}
      />
      <JsonLd data={itemListJsonLd(category.name, inCategory)} />
      <BoutiqueClient
        products={products}
        categories={categories}
        collections={collections.filter((c) => c.isActive)}
        activeCategory={category.slug}
        breadcrumb={[{ name: 'Accueil', path: '/' }, { name: 'Boutique', path: '/boutique' }, { name: category.name }]}
        heading={{
          eyebrow: 'Fait main à Port-la-Nouvelle',
          title: category.name,
          intro:
            category.description ||
            `Toutes les créations du rayon ${category.name}, façonnées à la main à l'atelier de Port-la-Nouvelle.`,
        }}
      />
    </>
  );
}
