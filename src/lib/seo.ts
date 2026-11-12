import type { Metadata } from 'next';
import { SITE_MAKER, SITE_NAME, absoluteUrl, safeExternalUrl } from './site';
import type { Category, OpeningHour, Product, PublicSettings } from './types';

// Référencement : métadonnées de page et données structurées (schema.org).
// Tout est calculé à partir des données réelles de la boutique : rien d'inventé
// (pas d'avis, pas de note, pas de téléphone factice).

export const DEFAULT_SHARE_IMAGE = '/images/partage.jpg';
export const BUSINESS_ID = `${absoluteUrl('/')}#boutique`;
export const WEBSITE_ID = `${absoluteUrl('/')}#site`;

/** Vrai quand le site ne doit pas être indexé (démo, préproduction) : SITE_NOINDEX=true dans le .env. */
export const SITE_NOINDEX = process.env.SITE_NOINDEX === 'true';

// Valeurs d'exemple livrées avec le site : elles ne sont jamais publiées dans les données structurées.
const PLACEHOLDER_PHONES = ['0468000000'];

export function realPhone(phone: string | undefined | null): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 10 || PLACEHOLDER_PHONES.includes(digits)) return null;
  return (phone as string).trim();
}

/** Lien vers un vrai profil (https://instagram.com/compte), pas vers la page d'accueil du réseau. */
export function socialProfileUrl(url: string | undefined | null): string | null {
  const safe = safeExternalUrl(url);
  if (!safe) return null;
  try {
    return new URL(safe).pathname.replace(/\/+$/, '').length > 0 ? safe : null;
  } catch {
    return null;
  }
}

interface PageMeta {
  /** Titre de la page, sans le nom du site (ajouté automatiquement). */
  title: string;
  description: string;
  /** Chemin de la page, par exemple /boutique. Sert d'adresse canonique. */
  path: string;
  image?: string | null;
  imageAlt?: string;
  noindex?: boolean;
  /** Titre complet, sans ajout du nom du site. */
  absoluteTitle?: boolean;
}

/** Métadonnées complètes d'une page : titre, description, adresse canonique, partage social. */
export function pageMetadata({ title, description, path, image, imageAlt, noindex, absoluteTitle }: PageMeta): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const shareImage = {
    url: absoluteUrl(image || DEFAULT_SHARE_IMAGE),
    ...(image ? {} : { width: 1200, height: 630 }),
    alt: imageAlt || fullTitle,
  };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'fr_FR',
      type: 'website',
      images: [shareImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [shareImage.url],
    },
  };
}

/** Coupe proprement un texte pour une balise description (155 caractères au plus). */
export function clip(text: string | null | undefined, max = 155): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).replace(/[\s,;:.]+$/, '')}…`;
}

// ---------------------------------------------------------------------------
// Horaires : du texte saisi dans l'administration vers le format schema.org
// ---------------------------------------------------------------------------

const FRENCH_DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const SCHEMA_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** "Lundi - Mardi" donne [Monday, Tuesday], "Mercredi - Samedi" les quatre jours, "Dimanche" un seul. */
export function parseDayGroup(group: string): string[] {
  const text = plain(group);
  if (/tous les jours|7j\/7|7 jours/.test(text)) return [...SCHEMA_DAYS];
  const found = FRENCH_DAYS.map((day, index) => ({ index, at: text.indexOf(day) }))
    .filter((d) => d.at >= 0)
    .sort((a, b) => a.at - b.at);
  if (found.length === 0) return [];
  if (found.length === 2) {
    const between = text.slice(found[0].at, found[1].at);
    if (/-|\bau\b|\ba\b/.test(between.replace(FRENCH_DAYS[found[0].index], ''))) {
      const days: string[] = [];
      for (let i = found[0].index; ; i = (i + 1) % 7) {
        days.push(SCHEMA_DAYS[i]);
        if (i === found[1].index) break;
      }
      return days;
    }
  }
  return found.map((d) => SCHEMA_DAYS[d.index]);
}

/** "15 h - 18 h 30" donne { opens: "15:00", closes: "18:30" }. */
export function parseTimeRange(text: string | undefined): { opens: string; closes: string } | null {
  if (!text) return null;
  const times = [...text.matchAll(/(\d{1,2})\s*(?:h|:)\s*(\d{2})?/gi)].map(
    (m) => `${m[1].padStart(2, '0')}:${m[2] || '00'}`
  );
  if (times.length < 2 || times[0] >= times[1]) return null;
  return { opens: times[0], closes: times[1] };
}

function openingHoursSpecification(hours: OpeningHour[]) {
  const specs: Array<Record<string, unknown>> = [];
  for (const h of hours) {
    if (h.isClosed) continue;
    const days = parseDayGroup(h.dayGroup);
    if (days.length === 0) continue;
    for (const range of [parseTimeRange(h.morningHours), parseTimeRange(h.afternoonHours)]) {
      if (!range) continue;
      specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens: range.opens, closes: range.closes });
    }
  }
  return specs;
}

// ---------------------------------------------------------------------------
// Données structurées
// ---------------------------------------------------------------------------

/** La boutique physique : bijouterie artisanale à Port-la-Nouvelle. */
export function localBusinessJsonLd(cms: Record<string, string>, hours: OpeningHour[], products: Product[] = []) {
  const phone = realPhone(cms.contact_phone);
  const sameAs = [cms.instagram_url, cms.facebook_url, cms.tiktok_url]
    .map(socialProfileUrl)
    .filter((url): url is string => Boolean(url));
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  const specs = openingHoursSpecification(hours);

  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': BUSINESS_ID,
    name: SITE_NAME,
    alternateName: "Boutique L'Atelier",
    description:
      'Atelier-boutique de bijoux artisanaux faits main à Port-la-Nouvelle : pièces uniques et petites séries, retrait en boutique ou livraison en France.',
    url: absoluteUrl('/'),
    image: [absoluteUrl('/images/hero-atelier.jpg'), absoluteUrl('/images/claire-atelier.jpg')],
    logo: absoluteUrl('/icon.svg'),
    ...(phone ? { telephone: phone } : {}),
    ...(cms.contact_email ? { email: cms.contact_email.trim() } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(cms.contact_street?.trim() ? { streetAddress: cms.contact_street.trim() } : {}),
      addressLocality: cms.contact_city?.trim() || 'Port-la-Nouvelle',
      postalCode: cms.contact_postal_code?.trim() || '11210',
      addressRegion: 'Occitanie',
      addressCountry: 'FR',
    },
    areaServed: { '@type': 'Country', name: 'France' },
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Carte bancaire',
    ...(prices.length > 0
      ? { priceRange: `${Math.floor(Math.min(...prices))} € à ${Math.ceil(Math.max(...prices))} €` }
      : {}),
    ...(specs.length > 0 ? { openingHoursSpecification: specs } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: absoluteUrl('/'),
    inLanguage: 'fr-FR',
    publisher: { '@id': BUSINESS_ID },
    // Le studio qui a réalisé le site, à ne pas confondre avec la boutique qui le publie.
    creator: { '@type': 'Organization', name: SITE_MAKER.name, url: SITE_MAKER.url },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListJsonLd(name: string, products: Product[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: absoluteUrl(`/produit/${product.slug}`),
    })),
  };
}

export function productJsonLd(product: Product, settings: PublicSettings, category?: Category | null) {
  const freeShipping = settings.freeShippingThreshold > 0 && product.price >= settings.freeShippingThreshold;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/produit/${product.slug}`)}#produit`,
    name: product.name,
    description: product.description || product.shortDescription || `${product.name}, bijou artisanal fait main à Port-la-Nouvelle.`,
    sku: product.reference,
    image: (product.images || []).map((img) => absoluteUrl(img.url)),
    brand: { '@type': 'Brand', name: SITE_NAME },
    ...(category ? { category: category.name } : {}),
    ...(product.materials ? { material: product.materials } : {}),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/produit/${product.slug}`),
      priceCurrency: 'EUR',
      price: product.price.toFixed(2),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': BUSINESS_ID },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: (freeShipping ? 0 : settings.shippingPrice).toFixed(2),
          currency: 'EUR',
        },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'FR' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          // Expédition sous 48 h ouvrées (conditions générales de vente), puis Colissimo.
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'FR',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
      },
    },
  };
}

export function faqJsonLd(questions: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}
