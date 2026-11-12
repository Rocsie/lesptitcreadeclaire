import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { resolvePaymentMode } from './payment-mode';
import { slugify } from './paths';
import type {
  Category,
  Collection,
  ContactMessage,
  Coupon,
  CouponValidation,
  EmailLog,
  NewsletterSubscriber,
  OpeningHour,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductStatus,
  PublicSettings,
  ShippingAddress,
  ShippingMethod,
  User,
  UserRole,
} from './types';
import { VISIBLE_STATUSES } from './types';

export type * from './types';

// ---------------------------------------------------------------------------
// Fichiers de données
// ---------------------------------------------------------------------------
// Les données vivantes (commandes, produits, comptes) sont dans DATA_DIR/store.json.
// Ce fichier n'est pas versionné : au premier démarrage il est créé à partir de data/seed.json.

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const BACKUP_FILE = path.join(DATA_DIR, 'store.backup.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'seed.json');

export interface StoredUser extends User {
  passwordHash: string;
  createdAt: string;
  // Réinitialisation du mot de passe : empreinte du jeton envoyé par email et date limite.
  resetTokenHash?: string | null;
  resetExpiresAt?: string | null;
}

export interface StoreData {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  orders: Order[];
  hours: OpeningHour[];
  coupons: Coupon[];
  cms: Record<string, string>;
  users: StoredUser[];
  newsletter: NewsletterSubscriber[];
  contactMessages: ContactMessage[];
  emailLogs: EmailLog[];
}

/** Erreur métier dont le message peut être affiché tel quel à l'utilisateur. */
export class StoreError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'StoreError';
    this.status = status;
  }
}

export const CMS_KEYS = [
  'site_title',
  'site_tagline',
  'hero_badge',
  'hero_title',
  'hero_subtitle',
  'hero_cta_primary',
  'hero_cta_secondary',
  'banner_announcement',
  'about_story_title',
  'about_story_text',
  'contact_phone',
  'contact_email',
  'contact_address',
  'contact_street',
  'contact_postal_code',
  'contact_city',
  'instagram_url',
  'facebook_url',
  'tiktok_url',
  'shipping_standard_price',
  'shipping_free_threshold',
  'pickup_enabled',
  'exceptional_notice',
  'stripe_sim_mode',
  // Mentions légales, à renseigner avant la mise en ligne
  'legal_owner',
  'legal_status',
  'legal_siret',
  'legal_vat',
  'legal_host',
  'legal_mediator',
] as const;

const DEFAULT_CMS: Record<string, string> = {
  site_title: "Les P'tites Créa de Claire",
  contact_postal_code: '11210',
  contact_city: 'Port-la-Nouvelle',
  shipping_standard_price: '4.90',
  shipping_free_threshold: '60.00',
  pickup_enabled: 'true',
  stripe_sim_mode: 'true',
};

const ARRAY_KEYS = [
  'products',
  'categories',
  'collections',
  'orders',
  'hours',
  'coupons',
  'users',
  'newsletter',
  'contactMessages',
  'emailLogs',
] as const;

function emptyStore(): StoreData {
  return {
    products: [],
    categories: [],
    collections: [],
    orders: [],
    hours: [],
    coupons: [],
    cms: { ...DEFAULT_CMS },
    users: [],
    newsletter: [],
    contactMessages: [],
    emailLogs: [],
  };
}

function readJson(file: string): unknown {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    console.error(`[store] lecture impossible : ${file}`, err);
    return null;
  }
}

// Un magasin est valide dès que c'est un objet avec une liste de produits,
// même vide : supprimer le dernier produit ne doit jamais réinitialiser la boutique.
function isStoreShape(data: unknown): data is Partial<StoreData> {
  return Boolean(data) && typeof data === 'object' && Array.isArray((data as StoreData).products);
}

function normalize(raw: Partial<StoreData>): StoreData {
  const data = raw as StoreData & Record<string, unknown>;
  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(data[key])) (data as Record<string, unknown>)[key] = [];
  }
  data.cms = { ...DEFAULT_CMS, ...(data.cms && typeof data.cms === 'object' ? data.cms : {}) };
  // Avant l'ajout du champ dédié, le numéro de suivi Colissimo était saisi dans les notes internes.
  for (const order of data.orders) {
    const note = typeof order.adminNotes === 'string' ? order.adminNotes.trim() : '';
    if (!order.trackingNumber && /^[A-Z0-9]{8,20}$/i.test(note)) order.trackingNumber = note;
  }
  // Les anciennes versions stockaient des événements de démonstration ici.
  delete data.analytics;
  return data;
}

function persist(data: StoreData) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const json = JSON.stringify(data, null, 2);
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, json, 'utf-8');
  // La version précédente devient la sauvegarde, puis le nouveau fichier prend sa place d'un seul coup.
  try {
    if (fs.existsSync(DATA_FILE)) fs.copyFileSync(DATA_FILE, BACKUP_FILE);
  } catch (err) {
    console.error('[store] sauvegarde de secours impossible', err);
  }
  fs.renameSync(tmp, DATA_FILE);
}

function load(): StoreData {
  const main = readJson(DATA_FILE);
  if (isStoreShape(main)) return normalize(main);

  const backup = readJson(BACKUP_FILE);
  if (isStoreShape(backup)) {
    console.error('[store] store.json illisible, reprise depuis store.backup.json');
    return normalize(backup);
  }

  const seed = readJson(SEED_FILE);
  const initial = normalize(isStoreShape(seed) ? seed : emptyStore());
  persist(initial);
  return initial;
}

// ---------------------------------------------------------------------------
// Petits utilitaires
// ---------------------------------------------------------------------------

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function toNumber(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(value: unknown, fallback: number): number {
  return Math.max(0, Math.round(toNumber(value, fallback)));
}

function text(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email.trim());
}

function uniqueSlug(wanted: string, taken: string[], fallbackPrefix: string): string {
  const base = slugify(wanted) || `${fallbackPrefix}-${Date.now()}`;
  let candidate = base;
  let i = 2;
  while (taken.includes(candidate)) {
    candidate = `${base}-${i}`;
    i += 1;
  }
  return candidate;
}

function publicUser(u: StoredUser): User {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone ?? null,
    role: u.role,
    createdAt: u.createdAt,
  };
}

function readSettings(cms: Record<string, string>): PublicSettings {
  return {
    shippingPrice: Math.max(0, toNumber(cms.shipping_standard_price, 4.9)),
    freeShippingThreshold: Math.max(0, toNumber(cms.shipping_free_threshold, 60)),
    pickupEnabled: cms.pickup_enabled !== 'false',
    paymentMode: resolvePaymentMode(cms.stripe_sim_mode !== 'false'),
  };
}

function checkCoupon(coupons: Coupon[], rawCode: unknown, subtotal: number): CouponValidation {
  const code = text(rawCode, 60).toUpperCase();
  if (!code) return { valid: false, message: 'Veuillez saisir un code.' };
  const coupon = coupons.find((c) => c.code.toUpperCase() === code && c.isActive);
  if (!coupon) return { valid: false, message: 'Code promotionnel introuvable ou inactif.' };
  if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
    return { valid: false, message: "Ce code a atteint son nombre maximal d'utilisations." };
  }
  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Ce code est valable à partir de ${coupon.minOrderAmount} € d'achat.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = round2((subtotal * Math.min(100, coupon.discountValue)) / 100);
  } else if (coupon.discountType === 'FIXED_AMOUNT') {
    discountAmount = round2(Math.min(coupon.discountValue, subtotal));
  }

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrderAmount: coupon.minOrderAmount,
    discountAmount,
    freeShipping: coupon.discountType === 'FREE_SHIPPING',
    message: coupon.description ? `Code appliqué : ${coupon.description}` : 'Code appliqué.',
  };
}

function normalizeImages(images: unknown, name: string): Product['images'] {
  if (!Array.isArray(images)) return [];
  return images
    .map((img, idx) => {
      const url = typeof img === 'string' ? img : text((img as { url?: string })?.url, 500);
      const altText = typeof img === 'string' ? '' : text((img as { altText?: string })?.altText, 200);
      return { url: url.trim(), altText: altText || `${name} - Photo ${idx + 1}` };
    })
    .filter((img) => /^(\/(?!\/)|https?:\/\/)/.test(img.url));
}

const PRODUCT_STATUSES: ProductStatus[] = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'SOLD_OUT'];

// Remet du stock (annulation, remboursement, paiement abandonné).
function restock(s: StoreData, order: Order) {
  for (const item of order.items) {
    if (!item.productId) continue;
    const prod = s.products.find((p) => p.id === item.productId);
    if (!prod) continue;
    prod.stock += item.quantity;
    if (prod.status === 'SOLD_OUT' && prod.stock > 0) prod.status = 'PUBLISHED';
    const variant = item.variantId ? prod.variants?.find((v) => v.id === item.variantId) : null;
    if (variant) variant.stock += item.quantity;
  }
  if (order.promoCode) {
    const coupon = s.coupons.find((c) => c.code.toUpperCase() === order.promoCode!.toUpperCase());
    if (coupon && coupon.usesCount > 0) coupon.usesCount -= 1;
  }
}

function takeStock(s: StoreData, order: Order) {
  for (const item of order.items) {
    if (!item.productId) continue;
    const prod = s.products.find((p) => p.id === item.productId);
    if (!prod) continue;
    prod.stock = Math.max(0, prod.stock - item.quantity);
    if (prod.stock === 0 && prod.status === 'PUBLISHED') prod.status = 'SOLD_OUT';
    const variant = item.variantId ? prod.variants?.find((v) => v.id === item.variantId) : null;
    if (variant) variant.stock = Math.max(0, variant.stock - item.quantity);
  }
}

const INACTIVE: OrderStatus[] = ['CANCELLED', 'REFUNDED'];

export interface CreateOrderInput {
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  shippingMethod: ShippingMethod;
  shippingAddress?: ShippingAddress;
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  promoCode?: string | null;
  customerNote?: string;
}

// ---------------------------------------------------------------------------
// Couche d'accès aux données
// ---------------------------------------------------------------------------
// Chaque opération relit le fichier, modifie, puis réécrit sans "await" entre les deux :
// dans un processus Node unique, deux requêtes ne peuvent donc pas s'écraser.

export const store = {
  // ----- Produits -----
  async getProducts(): Promise<Product[]> {
    return load().products;
  },

  /** Produits visibles par les visiteurs (en ligne ou épuisés), jamais les brouillons. */
  async getVisibleProducts(): Promise<Product[]> {
    return load().products.filter((p) => VISIBLE_STATUSES.includes(p.status));
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    return load().products.find((p) => p.slug === slug) || null;
  },

  async getProductById(id: string): Promise<Product | null> {
    return load().products.find((p) => p.id === id) || null;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const s = load();
    const name = text(data.name, 160);
    if (!name) throw new StoreError('Le nom de la création est requis.');
    const price = round2(toNumber(data.price, NaN));
    if (!Number.isFinite(price) || price < 0) throw new StoreError('Le prix est invalide.');

    const stock = toInt(data.stock, 1);
    const requested = PRODUCT_STATUSES.includes(data.status as ProductStatus)
      ? (data.status as ProductStatus)
      : 'PUBLISHED';
    const compareAt = round2(toNumber(data.compareAtPrice, 0));
    const images = normalizeImages(data.images, name);

    const product: Product = {
      id: newId('prod'),
      name,
      slug: uniqueSlug(text(data.slug, 120) || name, s.products.map((p) => p.slug), 'creation'),
      reference: text(data.reference, 40) || `PCC-${String(s.products.length + 1).padStart(3, '0')}`,
      shortDescription: text(data.shortDescription, 300),
      description: text(data.description, 5000),
      price,
      compareAtPrice: compareAt > price ? compareAt : null,
      categoryId: text(data.categoryId, 80) || null,
      collectionId: text(data.collectionId, 80) || null,
      stock,
      lowStockThreshold: toInt(data.lowStockThreshold, 3),
      status: requested === 'PUBLISHED' && stock === 0 ? 'SOLD_OUT' : requested,
      isUniquePiece: Boolean(data.isUniquePiece),
      isNew: data.isNew === undefined ? true : Boolean(data.isNew),
      badgeText: text(data.badgeText, 40) || null,
      materials: text(data.materials, 600),
      dimensions: text(data.dimensions, 300),
      weightGrams: data.weightGrams ? toNumber(data.weightGrams, 0) || null : null,
      careInstructions: text(data.careInstructions, 600),
      images: images.length > 0 ? images : [{ url: '/images/hero-atelier.jpg', altText: name }],
      variants: Array.isArray(data.variants) ? data.variants : [],
      viewsCount: 0,
      createdAt: new Date().toISOString(),
    };
    s.products.unshift(product);
    persist(s);
    return product;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
    const s = load();
    const current = s.products.find((p) => p.id === id || p.slug === id);
    if (!current) return null;

    if (data.name !== undefined) {
      const name = text(data.name, 160);
      if (!name) throw new StoreError('Le nom de la création est requis.');
      current.name = name;
    }
    if (data.slug !== undefined && text(data.slug, 120) && slugify(data.slug) !== current.slug) {
      current.slug = uniqueSlug(
        data.slug,
        s.products.filter((p) => p.id !== current.id).map((p) => p.slug),
        'creation'
      );
    }
    if (data.reference !== undefined) current.reference = text(data.reference, 40) || current.reference;
    if (data.shortDescription !== undefined) current.shortDescription = text(data.shortDescription, 300);
    if (data.description !== undefined) current.description = text(data.description, 5000);
    if (data.price !== undefined) {
      const price = round2(toNumber(data.price, NaN));
      if (!Number.isFinite(price) || price < 0) throw new StoreError('Le prix est invalide.');
      current.price = price;
    }
    if (data.compareAtPrice !== undefined) {
      const compareAt = round2(toNumber(data.compareAtPrice, 0));
      current.compareAtPrice = compareAt > current.price ? compareAt : null;
    }
    if (data.categoryId !== undefined) current.categoryId = text(data.categoryId, 80) || null;
    if (data.collectionId !== undefined) current.collectionId = text(data.collectionId, 80) || null;
    if (data.lowStockThreshold !== undefined) {
      current.lowStockThreshold = toInt(data.lowStockThreshold, current.lowStockThreshold);
    }
    if (data.isUniquePiece !== undefined) current.isUniquePiece = Boolean(data.isUniquePiece);
    if (data.isNew !== undefined) current.isNew = Boolean(data.isNew);
    if (data.badgeText !== undefined) current.badgeText = text(data.badgeText, 40) || null;
    if (data.materials !== undefined) current.materials = text(data.materials, 600);
    if (data.dimensions !== undefined) current.dimensions = text(data.dimensions, 300);
    if (data.careInstructions !== undefined) current.careInstructions = text(data.careInstructions, 600);
    if (data.weightGrams !== undefined) {
      current.weightGrams = data.weightGrams ? toNumber(data.weightGrams, 0) || null : null;
    }
    if (data.images !== undefined) {
      const images = normalizeImages(data.images, current.name);
      current.images = images.length > 0 ? images : [{ url: '/images/hero-atelier.jpg', altText: current.name }];
    }
    if (Array.isArray(data.variants)) current.variants = data.variants;

    if (data.status !== undefined && PRODUCT_STATUSES.includes(data.status)) current.status = data.status;
    if (data.stock !== undefined) current.stock = toInt(data.stock, current.stock);
    current.updatedAt = new Date().toISOString();
    // Statut et stock restent cohérents : un produit en ligne sans stock est épuisé, et inversement.
    if (current.status === 'PUBLISHED' && current.stock === 0) current.status = 'SOLD_OUT';
    if (current.status === 'SOLD_OUT' && current.stock > 0 && data.status !== 'SOLD_OUT') {
      current.status = 'PUBLISHED';
    }

    persist(s);
    return current;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const s = load();
    const index = s.products.findIndex((p) => p.id === id || p.slug === id);
    if (index === -1) return false;
    s.products.splice(index, 1);
    persist(s);
    return true;
  },

  async incrementProductViews(slug: string): Promise<void> {
    const s = load();
    const product = s.products.find((p) => p.slug === slug);
    if (!product) return;
    product.viewsCount = (product.viewsCount || 0) + 1;
    persist(s);
  },

  // ----- Catégories -----
  async getCategories(): Promise<Category[]> {
    return [...load().categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const s = load();
    const name = text(data.name, 120);
    if (!name) throw new StoreError('Le nom de la catégorie est requis.');
    const category: Category = {
      id: newId('cat'),
      name,
      slug: uniqueSlug(text(data.slug, 120) || name, s.categories.map((c) => c.slug), 'rayon'),
      description: text(data.description, 400),
      imageUrl: text(data.imageUrl, 500) || '/images/hero-atelier.jpg',
      displayOrder: toInt(data.displayOrder, s.categories.length + 1),
    };
    s.categories.push(category);
    persist(s);
    return category;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
    const s = load();
    const current = s.categories.find((c) => c.id === id || c.slug === id);
    if (!current) return null;
    if (data.name !== undefined) current.name = text(data.name, 120) || current.name;
    if (data.slug !== undefined && text(data.slug, 120) && slugify(data.slug) !== current.slug) {
      current.slug = uniqueSlug(
        data.slug,
        s.categories.filter((c) => c.id !== current.id).map((c) => c.slug),
        'rayon'
      );
    }
    if (data.description !== undefined) current.description = text(data.description, 400);
    if (data.imageUrl !== undefined) current.imageUrl = text(data.imageUrl, 500) || current.imageUrl;
    if (data.displayOrder !== undefined) current.displayOrder = toInt(data.displayOrder, current.displayOrder);
    persist(s);
    return current;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const s = load();
    const index = s.categories.findIndex((c) => c.id === id || c.slug === id);
    if (index === -1) return false;
    const [removed] = s.categories.splice(index, 1);
    // Les créations de ce rayon restent en vente, simplement sans rayon.
    s.products.forEach((p) => {
      if (p.categoryId === removed.id) p.categoryId = null;
    });
    persist(s);
    return true;
  },

  // ----- Collections -----
  async getCollections(): Promise<Collection[]> {
    return load().collections;
  },

  async createCollection(data: Partial<Collection>): Promise<Collection> {
    const s = load();
    const name = text(data.name, 120);
    if (!name) throw new StoreError('Le nom de la collection est requis.');
    const collection: Collection = {
      id: newId('col'),
      name,
      slug: uniqueSlug(text(data.slug, 120) || name, s.collections.map((c) => c.slug), 'collection'),
      description: text(data.description, 400),
      imageUrl: text(data.imageUrl, 500) || '/images/hero-atelier.jpg',
      isActive: data.isActive ?? true,
    };
    s.collections.push(collection);
    persist(s);
    return collection;
  },

  async updateCollection(id: string, data: Partial<Collection>): Promise<Collection | null> {
    const s = load();
    const current = s.collections.find((c) => c.id === id || c.slug === id);
    if (!current) return null;
    if (data.name !== undefined) current.name = text(data.name, 120) || current.name;
    if (data.slug !== undefined && text(data.slug, 120) && slugify(data.slug) !== current.slug) {
      current.slug = uniqueSlug(
        data.slug,
        s.collections.filter((c) => c.id !== current.id).map((c) => c.slug),
        'collection'
      );
    }
    if (data.description !== undefined) current.description = text(data.description, 400);
    if (data.imageUrl !== undefined) current.imageUrl = text(data.imageUrl, 500) || current.imageUrl;
    if (data.isActive !== undefined) current.isActive = Boolean(data.isActive);
    persist(s);
    return current;
  },

  async deleteCollection(id: string): Promise<boolean> {
    const s = load();
    const index = s.collections.findIndex((c) => c.id === id || c.slug === id);
    if (index === -1) return false;
    const [removed] = s.collections.splice(index, 1);
    s.products.forEach((p) => {
      if (p.collectionId === removed.id) p.collectionId = null;
    });
    persist(s);
    return true;
  },

  // ----- Commandes -----
  async getOrders(): Promise<Order[]> {
    return load().orders;
  },

  /** Commandes d'une cliente : rattachées à son compte ou passées avec son email. */
  async getOrdersForUser(user: Pick<User, 'id' | 'email'>): Promise<Order[]> {
    const email = user.email.toLowerCase();
    return load().orders.filter(
      (o) => o.userId === user.id || o.customerEmail.toLowerCase() === email
    );
  },

  async getOrderById(id: string): Promise<Order | null> {
    return load().orders.find((o) => o.id === id) || null;
  },

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return load().orders.find((o) => o.orderNumber === orderNumber) || null;
  },

  /**
   * Crée une commande. Les prix, la remise et les frais de port sont toujours
   * recalculés ici à partir du catalogue : rien de ce que le navigateur envoie n'est cru.
   */
  async createOrder(
    input: CreateOrderInput,
    ctx: { userId?: string | null; paymentMode: 'stripe' | 'simulation' }
  ): Promise<Order> {
    const s = load();
    const settings = readSettings(s.cms);

    const firstName = text(input.customerFirstName, 80);
    const lastName = text(input.customerLastName, 80);
    const email = text(input.customerEmail, 254).toLowerCase();
    if (!firstName || !lastName) throw new StoreError('Merci de renseigner votre prénom et votre nom.');
    if (!isValidEmail(email)) throw new StoreError("L'adresse email n'est pas valide.");

    const shippingMethod: ShippingMethod =
      input.shippingMethod === 'standard_delivery' ? 'standard_delivery' : 'pickup';
    if (shippingMethod === 'pickup' && !settings.pickupEnabled) {
      throw new StoreError("Le retrait en boutique n'est pas disponible pour le moment.");
    }

    const phone = text(input.customerPhone, 30);
    let shippingAddress: ShippingAddress;
    if (shippingMethod === 'pickup') {
      shippingAddress = {
        name: `${firstName} ${lastName}`,
        address1: "Retrait en boutique L'Atelier",
        address2: '',
        postalCode: '11210',
        city: 'Port-la-Nouvelle',
        country: 'France',
        phone,
      };
    } else {
      const address1 = text(input.shippingAddress?.address1, 160);
      const postalCode = text(input.shippingAddress?.postalCode, 10).replace(/\s+/g, '');
      const city = text(input.shippingAddress?.city, 80);
      if (!address1 || !city) throw new StoreError('Merci de renseigner votre adresse de livraison complète.');
      if (!/^\d{5}$/.test(postalCode)) throw new StoreError('Le code postal doit comporter 5 chiffres.');
      shippingAddress = {
        name: `${firstName} ${lastName}`,
        address1,
        address2: text(input.shippingAddress?.address2, 160),
        postalCode,
        city,
        country: 'France',
        phone,
      };
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new StoreError('Votre panier est vide.');
    }
    if (input.items.length > 50) throw new StoreError('Votre panier contient trop de lignes.');

    // Lignes identiques regroupées, quantités vérifiées contre le stock réel.
    const lines = new Map<string, { productId: string; variantId?: string; quantity: number }>();
    for (const raw of input.items) {
      const productId = text(raw?.productId, 80);
      const variantId = text(raw?.variantId, 80) || undefined;
      const quantity = Math.floor(toNumber(raw?.quantity, 0));
      if (!productId || quantity < 1 || quantity > 99) throw new StoreError('Une ligne du panier est invalide.');
      const key = `${productId}::${variantId || ''}`;
      const existing = lines.get(key);
      if (existing) existing.quantity += quantity;
      else lines.set(key, { productId, variantId, quantity });
    }

    const perProduct = new Map<string, number>();
    const items: OrderItem[] = [];
    let idx = 0;
    for (const line of lines.values()) {
      const product = s.products.find((p) => p.id === line.productId);
      if (!product || !VISIBLE_STATUSES.includes(product.status)) {
        throw new StoreError("Une création de votre panier n'est plus en vente. Merci de la retirer du panier.");
      }
      const variant = line.variantId ? product.variants?.find((v) => v.id === line.variantId) : undefined;
      if (line.variantId && !variant) {
        throw new StoreError(`La finition choisie pour « ${product.name} » n'existe plus.`);
      }
      const wanted = (perProduct.get(product.id) || 0) + line.quantity;
      perProduct.set(product.id, wanted);
      if (product.stock < wanted || (variant && variant.stock < line.quantity)) {
        const left = variant ? Math.min(product.stock, variant.stock) : product.stock;
        throw new StoreError(
          left > 0
            ? `Il ne reste que ${left} exemplaire${left > 1 ? 's' : ''} de « ${product.name} ».`
            : `« ${product.name} » vient d'être vendue et n'est plus disponible.`,
          409
        );
      }
      const unitPrice = round2(product.price + (variant?.priceDiff || 0));
      items.push({
        id: `item-${Date.now()}-${idx++}`,
        productId: product.id,
        productName: product.name,
        productReference: product.reference,
        variantId: variant?.id,
        variantTitle: variant?.name,
        imageUrl: product.images?.[0]?.url,
        unitPrice,
        quantity: line.quantity,
        totalPrice: round2(unitPrice * line.quantity),
      });
    }

    const subtotal = round2(items.reduce((sum, item) => sum + item.totalPrice, 0));

    let discountAmount = 0;
    let freeShipping = false;
    let promoCode: string | null = null;
    if (input.promoCode) {
      const check = checkCoupon(s.coupons, input.promoCode, subtotal);
      if (!check.valid) throw new StoreError(check.message);
      discountAmount = check.discountAmount || 0;
      freeShipping = Boolean(check.freeShipping);
      promoCode = check.code || null;
    }

    const shippingCost =
      shippingMethod === 'pickup' || freeShipping || subtotal >= settings.freeShippingThreshold
        ? 0
        : round2(settings.shippingPrice);
    const total = Math.max(0, round2(subtotal - discountAmount + shippingCost));

    const lastSeq = s.orders.reduce((max, o) => {
      const match = /(\d+)$/.exec(o.orderNumber || '');
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    const now = new Date();
    const paid = ctx.paymentMode === 'simulation';

    const order: Order = {
      id: newId('ord'),
      orderNumber: `PCC-${now.getFullYear()}-${String(lastSeq + 1).padStart(6, '0')}`,
      accessToken: crypto.randomBytes(16).toString('hex'),
      userId: ctx.userId || null,
      customerEmail: email,
      customerFirstName: firstName,
      customerLastName: lastName,
      customerPhone: phone || null,
      shippingMethod,
      shippingCost,
      shippingAddress,
      subtotal,
      discountAmount,
      promoCode,
      total,
      status: paid ? 'PAID' : 'PENDING',
      paymentMethod: paid ? 'simulation' : 'stripe',
      paymentStatus: paid ? 'COMPLETED' : 'PENDING',
      customerNote: text(input.customerNote, 600) || null,
      createdAt: now.toISOString(),
      items,
    };

    // Le stock est réservé tout de suite, y compris pendant un paiement Stripe en cours.
    takeStock(s, order);
    if (promoCode) {
      const coupon = s.coupons.find((c) => c.code === promoCode);
      if (coupon) coupon.usesCount += 1;
    }

    s.orders.unshift(order);
    persist(s);
    return order;
  },

  /** Paiement confirmé par Stripe. Sans effet si la commande est déjà payée. */
  async markOrderPaid(orderId: string, paymentReference?: string | null): Promise<{ order: Order; changed: boolean } | null> {
    const s = load();
    const order = s.orders.find((o) => o.id === orderId);
    if (!order) return null;
    if (order.status !== 'PENDING') return { order, changed: false };
    order.status = 'PAID';
    order.paymentStatus = 'COMPLETED';
    if (paymentReference) order.paymentReference = paymentReference;
    persist(s);
    return { order, changed: true };
  },

  /** Paiement abandonné ou expiré : la commande est annulée et le stock libéré. */
  async cancelPendingOrder(orderId: string): Promise<Order | null> {
    const s = load();
    const order = s.orders.find((o) => o.id === orderId);
    if (!order || order.status !== 'PENDING') return order || null;
    order.status = 'CANCELLED';
    order.paymentStatus = 'FAILED';
    restock(s, order);
    persist(s);
    return order;
  },

  async setOrderPaymentReference(orderId: string, paymentReference: string): Promise<void> {
    const s = load();
    const order = s.orders.find((o) => o.id === orderId);
    if (!order) return;
    order.paymentReference = paymentReference;
    persist(s);
  },

  async updateOrder(
    orderId: string,
    changes: { status?: OrderStatus; adminNotes?: string; trackingNumber?: string }
  ): Promise<{ order: Order; previousStatus: OrderStatus } | null> {
    const s = load();
    const order = s.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const previousStatus = order.status;
    const next = changes.status;

    if (next && next !== previousStatus) {
      const wasActive = !INACTIVE.includes(previousStatus);
      const willBeActive = !INACTIVE.includes(next);
      if (wasActive && !willBeActive) restock(s, order);
      if (!wasActive && willBeActive) takeStock(s, order);
      order.status = next;
      if (next === 'REFUNDED') order.paymentStatus = 'REFUNDED';
      else if (next !== 'PENDING' && next !== 'CANCELLED' && order.paymentStatus === 'PENDING') {
        order.paymentStatus = 'COMPLETED';
      }
    }
    if (changes.adminNotes !== undefined) order.adminNotes = text(changes.adminNotes, 1000);
    if (changes.trackingNumber !== undefined) order.trackingNumber = text(changes.trackingNumber, 60) || null;

    persist(s);
    return { order, previousStatus };
  },

  // ----- Horaires -----
  async getOpeningHours(): Promise<OpeningHour[]> {
    return [...load().hours].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },

  async updateOpeningHours(hours: unknown): Promise<OpeningHour[]> {
    if (!Array.isArray(hours)) throw new StoreError('Format des horaires invalide.');
    const s = load();
    s.hours = hours.slice(0, 14).map((h, i) => ({
      id: text(h?.id, 40) || `h-${i + 1}`,
      dayGroup: text(h?.dayGroup, 60) || `Jour ${i + 1}`,
      morningHours: text(h?.morningHours, 40),
      afternoonHours: text(h?.afternoonHours, 40),
      isClosed: Boolean(h?.isClosed),
      sortOrder: toInt(h?.sortOrder, i + 1),
    }));
    persist(s);
    return s.hours;
  },

  // ----- Codes promo -----
  async getCoupons(): Promise<Coupon[]> {
    return load().coupons;
  },

  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const s = load();
    const code = text(data.code, 40).toUpperCase().replace(/\s+/g, '');
    if (!code) throw new StoreError('Le code promo est requis.');
    if (s.coupons.some((c) => c.code.toUpperCase() === code)) {
      throw new StoreError('Ce code promo existe déjà.', 409);
    }
    const discountType = (['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'] as const).includes(
      data.discountType as Coupon['discountType']
    )
      ? (data.discountType as Coupon['discountType'])
      : 'PERCENTAGE';
    const coupon: Coupon = {
      id: newId('coup'),
      code,
      description: text(data.description, 200),
      discountType,
      discountValue: discountType === 'FREE_SHIPPING' ? 0 : Math.max(0, toNumber(data.discountValue, 0)),
      minOrderAmount: Math.max(0, toNumber(data.minOrderAmount, 0)),
      maxUses: data.maxUses ? toInt(data.maxUses, 0) || undefined : undefined,
      usesCount: 0,
      isActive: data.isActive ?? true,
    };
    s.coupons.unshift(coupon);
    persist(s);
    return coupon;
  },

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon | null> {
    const s = load();
    const current = s.coupons.find((c) => c.id === id);
    if (!current) return null;
    if (data.code !== undefined) {
      const code = text(data.code, 40).toUpperCase().replace(/\s+/g, '');
      if (code && code !== current.code) {
        if (s.coupons.some((c) => c.id !== current.id && c.code.toUpperCase() === code)) {
          throw new StoreError('Ce code promo existe déjà.', 409);
        }
        current.code = code;
      }
    }
    if (data.description !== undefined) current.description = text(data.description, 200);
    if (data.discountType !== undefined && ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'].includes(data.discountType)) {
      current.discountType = data.discountType;
    }
    if (data.discountValue !== undefined) current.discountValue = Math.max(0, toNumber(data.discountValue, 0));
    if (current.discountType === 'FREE_SHIPPING') current.discountValue = 0;
    if (data.minOrderAmount !== undefined) current.minOrderAmount = Math.max(0, toNumber(data.minOrderAmount, 0));
    if ('maxUses' in data) current.maxUses = data.maxUses ? toInt(data.maxUses, 0) || undefined : undefined;
    if (data.isActive !== undefined) current.isActive = Boolean(data.isActive);
    persist(s);
    return current;
  },

  async deleteCoupon(id: string): Promise<boolean> {
    const s = load();
    const index = s.coupons.findIndex((c) => c.id === id);
    if (index === -1) return false;
    s.coupons.splice(index, 1);
    persist(s);
    return true;
  },

  async validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
    return checkCoupon(load().coupons, code, Math.max(0, toNumber(subtotal, 0)));
  },

  // ----- Textes et réglages -----
  async getCmsSettings(): Promise<Record<string, string>> {
    return load().cms;
  },

  async updateCmsSettings(values: Record<string, unknown>): Promise<Record<string, string>> {
    const s = load();
    for (const key of CMS_KEYS) {
      if (!(key in values)) continue;
      let value = String(values[key] ?? '').trim().slice(0, 2000);
      if (key === 'shipping_standard_price' || key === 'shipping_free_threshold') {
        const n = toNumber(value.replace(',', '.'), NaN);
        if (!Number.isFinite(n) || n < 0) throw new StoreError('Les montants de livraison doivent être des nombres positifs.');
        value = n.toFixed(2);
      }
      if (key === 'pickup_enabled' || key === 'stripe_sim_mode') {
        value = value === 'true' ? 'true' : 'false';
      }
      if (key.endsWith('_url') && value && !/^https?:\/\//i.test(value)) {
        value = `https://${value.replace(/^\/+/, '')}`;
      }
      s.cms[key] = value;
    }
    persist(s);
    return s.cms;
  },

  async getPublicSettings(): Promise<PublicSettings> {
    return readSettings(load().cms);
  },

  // ----- Comptes -----
  async getUsers(): Promise<User[]> {
    return load().users.map(publicUser);
  },

  async getUserById(id: string): Promise<User | null> {
    const user = load().users.find((u) => u.id === id);
    return user ? publicUser(user) : null;
  },

  /** Avec l'empreinte du mot de passe : réservé à la vérification de connexion. */
  async getStoredUserByEmail(email: string): Promise<StoredUser | null> {
    const wanted = email.trim().toLowerCase();
    return load().users.find((u) => u.email.toLowerCase() === wanted) || null;
  },

  async getStoredUserById(id: string): Promise<StoredUser | null> {
    return load().users.find((u) => u.id === id) || null;
  },

  async hasAdmin(): Promise<boolean> {
    return load().users.some((u) => u.role === 'ADMIN');
  },

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    role?: UserRole;
  }): Promise<User> {
    const s = load();
    const email = text(data.email, 254).toLowerCase();
    if (!isValidEmail(email)) throw new StoreError("L'adresse email n'est pas valide.");
    if (s.users.some((u) => u.email.toLowerCase() === email)) {
      throw new StoreError('Un compte existe déjà avec cette adresse email.', 409);
    }
    const firstName = text(data.firstName, 80);
    const lastName = text(data.lastName, 80);
    if (!firstName || !lastName) throw new StoreError('Merci de renseigner votre prénom et votre nom.');
    const user: StoredUser = {
      id: newId('usr'),
      email,
      passwordHash: data.passwordHash,
      firstName,
      lastName,
      phone: text(data.phone, 30) || null,
      role: data.role === 'ADMIN' ? 'ADMIN' : 'CLIENT',
      createdAt: new Date().toISOString(),
    };
    s.users.push(user);
    // Les commandes passées en invitée avec le même email sont rattachées au compte.
    s.orders.forEach((o) => {
      if (!o.userId && o.customerEmail.toLowerCase() === email) o.userId = user.id;
    });
    persist(s);
    return publicUser(user);
  },

  async updateUser(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string | null; passwordHash?: string }
  ): Promise<User | null> {
    const s = load();
    const user = s.users.find((u) => u.id === id);
    if (!user) return null;
    if (data.firstName !== undefined) user.firstName = text(data.firstName, 80) || user.firstName;
    if (data.lastName !== undefined) user.lastName = text(data.lastName, 80) || user.lastName;
    if (data.phone !== undefined) user.phone = text(data.phone, 30) || null;
    if (data.passwordHash) {
      user.passwordHash = data.passwordHash;
      user.resetTokenHash = null;
      user.resetExpiresAt = null;
    }
    persist(s);
    return publicUser(user);
  },

  async setPasswordReset(id: string, tokenHash: string, expiresAt: string): Promise<void> {
    const s = load();
    const user = s.users.find((u) => u.id === id);
    if (!user) return;
    user.resetTokenHash = tokenHash;
    user.resetExpiresAt = expiresAt;
    persist(s);
  },

  async getStoredUserByResetToken(tokenHash: string): Promise<StoredUser | null> {
    const user = load().users.find((u) => u.resetTokenHash && u.resetTokenHash === tokenHash);
    if (!user || !user.resetExpiresAt || new Date(user.resetExpiresAt).getTime() < Date.now()) return null;
    return user;
  },

  // ----- Lettre d'information -----
  async addNewsletter(rawEmail: string): Promise<boolean> {
    const email = text(rawEmail, 254).toLowerCase();
    if (!isValidEmail(email)) throw new StoreError("L'adresse email n'est pas valide.");
    const s = load();
    if (!s.newsletter.some((n) => n.email.toLowerCase() === email)) {
      s.newsletter.unshift({ email, createdAt: new Date().toISOString() });
      persist(s);
    }
    return true;
  },

  async getNewsletter(): Promise<NewsletterSubscriber[]> {
    return load().newsletter;
  },

  async removeNewsletter(email: string): Promise<boolean> {
    const s = load();
    const before = s.newsletter.length;
    s.newsletter = s.newsletter.filter((n) => n.email.toLowerCase() !== email.toLowerCase());
    if (s.newsletter.length === before) return false;
    persist(s);
    return true;
  },

  // ----- Messages du formulaire de contact -----
  async addContactMessage(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Promise<ContactMessage> {
    const name = text(data.name, 120);
    const email = text(data.email, 254).toLowerCase();
    const subject = text(data.subject, 200);
    const message = text(data.message, 5000);
    if (!name || !subject || !message) throw new StoreError('Merci de remplir tous les champs obligatoires.');
    if (!isValidEmail(email)) throw new StoreError("L'adresse email n'est pas valide.");
    const s = load();
    const entry: ContactMessage = {
      id: newId('msg'),
      name,
      email,
      phone: text(data.phone, 30) || undefined,
      subject,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    s.contactMessages.unshift(entry);
    persist(s);
    return entry;
  },

  async getContactMessages(): Promise<ContactMessage[]> {
    return load().contactMessages;
  },

  async setContactMessageRead(id: string, read: boolean): Promise<boolean> {
    const s = load();
    const msg = s.contactMessages.find((m) => m.id === id);
    if (!msg) return false;
    msg.read = read;
    persist(s);
    return true;
  },

  async deleteContactMessage(id: string): Promise<boolean> {
    const s = load();
    const before = s.contactMessages.length;
    s.contactMessages = s.contactMessages.filter((m) => m.id !== id);
    if (s.contactMessages.length === before) return false;
    persist(s);
    return true;
  },

  // ----- Journal des emails -----
  async addEmailLog(entry: Omit<EmailLog, 'id' | 'sentAt'>): Promise<void> {
    const s = load();
    s.emailLogs.unshift({ id: newId('em'), sentAt: new Date().toISOString(), ...entry });
    s.emailLogs = s.emailLogs.slice(0, 300);
    persist(s);
  },

  async getEmailLogs(): Promise<EmailLog[]> {
    return load().emailLogs;
  },
};
