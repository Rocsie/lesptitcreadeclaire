import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from './ProductDetail';
import JsonLd from '@/components/seo/JsonLd';
import { getSessionUser } from '@/lib/auth';
import { formatPrice } from '@/lib/paths';
import { breadcrumbJsonLd, clip, pageMetadata, productJsonLd } from '@/lib/seo';
import { SITE_NAME } from '@/lib/site';
import { store } from '@/lib/store';
import { VISIBLE_STATUSES, type Product } from '@/lib/types';

type Props = { params: Promise<{ slug: string }> };

// Les brouillons et créations masquées ne sont visibles que par la gestionnaire (aperçu).
async function loadProduct(slug: string): Promise<Product | null> {
  const product = await store.getProductBySlug(decodeURIComponent(slug));
  if (!product) return null;
  if (VISIBLE_STATUSES.includes(product.status)) return product;
  const user = await getSessionUser();
  return user?.role === 'ADMIN' ? product : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: 'Création introuvable', robots: { index: false } };

  // Sans description saisie, on en compose une à partir de ce que l'on sait de la création.
  const written = product.shortDescription || product.description;
  const description = clip(
    written
      ? `${written} ${formatPrice(product.price)}, fait main à Port-la-Nouvelle.`
      : `${product.name}, bijou artisanal fait main à Port-la-Nouvelle par Claire. ${formatPrice(product.price)}, retrait gratuit à l'atelier ou livraison Colissimo.`
  );

  return pageMetadata({
    title: product.name,
    // Un nom long occupe déjà toute la ligne de résultat : on n'y ajoute pas le nom de la boutique.
    absoluteTitle: `${product.name} | ${SITE_NAME}`.length > 60,
    description,
    path: `/produit/${product.slug}`,
    image: product.images?.[0]?.url,
    imageAlt: product.images?.[0]?.altText || product.name,
    noindex: !VISIBLE_STATUSES.includes(product.status),
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const [visible, categories, settings] = await Promise.all([
    store.getVisibleProducts(),
    store.getCategories(),
    store.getPublicSettings(),
  ]);
  const category = categories.find((c) => c.id === product.categoryId) || null;

  const others = visible.filter((p) => p.id !== product.id);
  const related = [
    ...others.filter((p) => p.categoryId && p.categoryId === product.categoryId),
    ...others.filter((p) => !p.categoryId || p.categoryId !== product.categoryId),
  ].slice(0, 3);

  return (
    <>
      <JsonLd data={productJsonLd(product, settings, category)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Accueil', path: '/' },
          { name: 'Boutique', path: '/boutique' },
          ...(category ? [{ name: category.name, path: `/boutique/${category.slug}` }] : []),
          { name: product.name, path: `/produit/${product.slug}` },
        ])}
      />
      <ProductDetail product={product} relatedProducts={related} category={category} />
    </>
  );
}
