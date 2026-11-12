import type { MetadataRoute } from 'next';
import { SITE_NOINDEX } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

// Plan du site, recalculé à chaque demande : pages fixes, rayons, collections actives
// et une entrée par création en vente, avec ses photos.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (SITE_NOINDEX) return [];

  const [products, categories, collections] = await Promise.all([
    store.getVisibleProducts(),
    store.getCategories(),
    store.getCollections(),
  ]);

  const dates = products.map((p) => p.updatedAt || p.createdAt).sort();
  const lastChange = new Date(dates[dates.length - 1] || Date.now());

  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: lastChange, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/boutique'), lastModified: lastChange, changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/collections'), lastModified: lastChange, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/a-propos'), changeFrequency: 'yearly', priority: 0.6 },
    { url: absoluteUrl('/contact'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/cgv'), changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/mentions-legales'), changeFrequency: 'yearly', priority: 0.1 },
    { url: absoluteUrl('/confidentialite'), changeFrequency: 'yearly', priority: 0.1 },
  ];

  const lastIn = (list: typeof products) => {
    const sorted = list.map((p) => p.updatedAt || p.createdAt).sort();
    return sorted.length > 0 ? new Date(sorted[sorted.length - 1]) : undefined;
  };

  return [
    ...pages,
    // Un rayon vide n'est pas proposé aux moteurs de recherche.
    ...categories
      .map((category) => ({ category, items: products.filter((p) => p.categoryId === category.id) }))
      .filter(({ items }) => items.length > 0)
      .map(({ category, items }) => ({
        url: absoluteUrl(`/boutique/${category.slug}`),
        lastModified: lastIn(items),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ...collections
      .filter((collection) => collection.isActive)
      .map((collection) => ({ collection, items: products.filter((p) => p.collectionId === collection.id) }))
      .filter(({ items }) => items.length > 0)
      .map(({ collection, items }) => ({
        url: absoluteUrl(`/collections/${collection.slug}`),
        lastModified: lastIn(items),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    ...products.map((product) => ({
      url: absoluteUrl(`/produit/${product.slug}`),
      lastModified: new Date(product.updatedAt || product.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: (product.images || []).slice(0, 5).map((img) => absoluteUrl(img.url)),
    })),
  ];
}
