import fs from 'fs';
import path from 'path';
import { prisma, hasDatabase } from './prisma';

const DATA_FILE = path.join(process.cwd(), 'data', 'store.json');
const BACKUP_FILE = path.join(process.cwd(), 'data', 'store.backup.json');

function saveStoreToFile(data: any) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(DATA_FILE, jsonStr, 'utf-8');
    fs.writeFileSync(BACKUP_FILE, jsonStr, 'utf-8');
  } catch (err) {
    console.error('Erreur sauvegarde store.json:', err);
  }
}

function loadStoreFromFile(): MemoryStore | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        return parsed as MemoryStore;
      }
    }
    // Secours si le fichier principal était indisponible
    if (fs.existsSync(BACKUP_FILE)) {
      const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        return parsed as MemoryStore;
      }
    }
  } catch (err) {
    console.error('Erreur chargement store.json:', err);
  }
  return null;
}


// Types pour l'application
export interface Product {
  id: string;
  name: string;
  slug: string;
  reference: string;
  shortDescription?: string | null;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  categoryId?: string | null;
  collectionId?: string | null;
  stock: number;
  lowStockThreshold: number;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'SOLD_OUT';
  isUniquePiece: boolean;
  isNew: boolean;
  badgeText?: string | null;
  materials?: string | null;
  dimensions?: string | null;
  weightGrams?: number | null;
  careInstructions?: string | null;
  images: Array<{ url: string; altText?: string }>;
  variants: Array<{ id: string; name: string; color?: string | null; stock: number; priceDiff: number }>;
  viewsCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  productReference?: string;
  variantTitle?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string | null;
  shippingMethod: 'pickup' | 'standard_delivery' | 'express_delivery';
  shippingCost: number;
  shippingAddress: {
    name?: string;
    address1?: string;
    address2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
  };
  subtotal: number;
  discountAmount: number;
  promoCode?: string | null;
  total: number;
  status:
    | 'PENDING'
    | 'PAID'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'READY_FOR_PICKUP'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED';
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  customerNote?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OpeningHour {
  id: string;
  dayGroup: string;
  morningHours?: string;
  afternoonHours?: string;
  isClosed: boolean;
  sortOrder: number;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minOrderAmount: number;
  maxUses?: number;
  usesCount: number;
  isActive: boolean;
}

// État synchronisé en mémoire et sur disque (avec persistance JSON)
export interface MemoryStore {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  orders: Order[];
  hours: OpeningHour[];
  coupons: Coupon[];
  cms: Record<string, string>;
  newsletter: Array<{ email: string; createdAt: string }>;
  contactMessages: Array<{ id: string; name: string; email: string; phone?: string; subject: string; message: string; createdAt: string }>;
  emailLogs: Array<{ id: string; recipient: string; subject: string; template: string; sentAt: string }>;
  analytics: Array<{ event: string; path?: string; source: string; timestamp: string }>;
}

function getInitialStore(): MemoryStore {
  // Toujours relire depuis le fichier disque pour garantir la cohérence
  // et ne JAMAIS perdre ou écraser les articles ajoutés par l'utilisateur
  const fromDisk = loadStoreFromFile();
  if (fromDisk) {
    return fromDisk;
  }

  const initialDefaults: MemoryStore = {
    categories: [
      { id: 'cat-1', name: "Boucles d'oreilles", slug: 'boucles-d-oreilles', description: "Créations étincelantes, résines pailletées, cristaux et dormeuses délicates.", imageUrl: '/images/boucles-oreilles.jpg', displayOrder: 1 },
      { id: 'cat-2', name: 'Bagues', slug: 'bagues', description: 'Finesse des détails, anneaux ciselés, dorures et géométrie sacrée.', imageUrl: '/images/bagues.jpg', displayOrder: 2 },
      { id: 'cat-3', name: 'Broches & Pin\'s', slug: 'broches', description: 'Poésie et esprit marin, poissons chatoyants et motifs méditerranéens.', imageUrl: '/images/broches.jpg', displayOrder: 3 },
      { id: 'cat-4', name: 'Colliers & Pendentifs', slug: 'colliers', description: 'Pierres fines facettées, cabochons colorés et chaînes dorées avec soin.', imageUrl: '/images/colliers.jpg', displayOrder: 4 },
      { id: 'cat-5', name: 'Bracelets & Joncs', slug: 'bracelets', description: 'Joncs et créations au fil doré pour sublimer votre poignet.', imageUrl: '/images/hero-atelier.jpg', displayOrder: 5 },
      { id: 'cat-6', name: 'Pièces uniques', slug: 'pieces-uniques', description: 'Modèles exclusifs créés en un seul exemplaire numéroté.', imageUrl: '/images/claire-atelier.jpg', displayOrder: 6 },
    ],
    collections: [
      { id: 'col-1', name: "Éclat de Couleurs", slug: 'eclat-de-couleurs', description: 'Palette festive, paillettes lumineuses et résines coulées à la main.', imageUrl: '/images/boucles-oreilles.jpg', isActive: true },
      { id: 'col-2', name: "Esprit Marin", slug: 'esprit-marin', description: 'Inspirations du littoral de Port-la-Nouvelle, vagues et faune marine.', imageUrl: '/images/broches.jpg', isActive: true },
      { id: 'col-3', name: "Lumière & Finesse", slug: 'lumiere-et-finesse', description: 'Cristaux taillés, reflets précieux et dorures élégantes.', imageUrl: '/images/bagues.jpg', isActive: true },
    ],
    products: [
      {
        id: 'prod-1',
        name: "Boucles Pivoine Rose Poudré & Paillettes",
        slug: "boucles-pivoine-rose-poudre",
        reference: "PCC-BO-001",
        shortDescription: "Résine artisanale rose fuchsia et paillettes dorées, monture plaqué or.",
        description: "Conçues et façonnées avec passion à Port-la-Nouvelle. Chaque goutte de résine capture un kaléidoscope de micro-paillettes brillantes surmontées d'un cabochon facetté. Ultra légères à porter toute la journée.",
        price: 34.00,
        compareAtPrice: 39.00,
        categoryId: 'cat-1',
        collectionId: 'col-1',
        stock: 4,
        lowStockThreshold: 2,
        status: 'PUBLISHED',
        isUniquePiece: false,
        isNew: true,
        badgeText: "Coup de cœur",
        materials: "Résine d'inclusion hypoallergénique, poudres irisées, monture en laiton doré à l'or fin 24k sans nickel.",
        dimensions: "Longueur totale : 5,5 cm. Largeur du cabochon : 1,8 cm.",
        weightGrams: 8,
        careInstructions: "Conserver à l'abri de l'humidité et des parfums directs. Nettoyer avec un chiffon doux sec.",
        images: [
          { url: '/uploads/sans-titre-1791724914102-3982.jpg', altText: 'Boucles Pivoine Rose Poudré' },
          { url: '/uploads/gemini-generated-image-i2wp80i-1791727249322-8229.jpg', altText: 'Détail création Claire' },
          { url: '/uploads/607817539-17881145316431590-21-1791727263944-3333.jpg', altText: 'Finition atelier' },
          { url: '/images/boucles-oreilles.jpg', altText: 'Photo d\'ambiance' }
        ],
        variants: [
          { id: 'var-1', name: 'Fuchsia étincelant', color: '#D92374', stock: 2, priceDiff: 0 },
          { id: 'var-2', name: 'Vieux rose poudré', color: '#C87D88', stock: 2, priceDiff: 0 },
        ],
        viewsCount: 142,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-2',
        name: "Bague Ciselée Fleur de Vie & Anneaux Entrelacés",
        slug: "bague-ciselee-fleur-de-vie",
        reference: "PCC-BAG-002",
        shortDescription: "Dentelle de métal ciselée à la main, géométrie sacrée et triple anneau.",
        description: "Inspirée par la finesse des détails de l'artisanat d'art. Cette bague ajustable épouse avec grâce votre doigt. Son motif ajouré diffuse la lumière avec subtilité.",
        price: 29.00,
        compareAtPrice: null,
        categoryId: 'cat-2',
        collectionId: 'col-3',
        stock: 3,
        lowStockThreshold: 2,
        status: 'PUBLISHED',
        isUniquePiece: false,
        isNew: true,
        badgeText: "Nouveauté",
        materials: "Laiton doré et or rose trempé, finition vernis protecteur dermatologique.",
        dimensions: "Taille ajustable du 52 au 58.",
        weightGrams: 5,
        careInstructions: "Éviter le contact prolongé avec l'eau de mer et les produits ménagers.",
        images: [{ url: '/images/bagues.jpg', altText: 'Bague fleur de vie' }],
        variants: [
          { id: 'var-3', name: 'Doré solaire', color: '#D4AF37', stock: 2, priceDiff: 0 },
          { id: 'var-4', name: 'Or rose délicat', color: '#E8B4B8', stock: 1, priceDiff: 0 },
        ],
        viewsCount: 88,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-3',
        name: "Broche Poisson des Lagunes 'Esprit Marin'",
        slug: "broche-poisson-lagunes-esprit-marin",
        reference: "PCC-BRO-003",
        shortDescription: "Pièce haute joaillerie de fantaisie, pavage de cristaux lagon et améthyste.",
        description: "Hommage direct au littoral audois de Port-la-Nouvelle ! Ce poisson étincelant associe des cristaux facettés turquoise, bleu outremer et prune. Une pièce forte à fixer sur un blazer ou une maille d'hiver.",
        price: 45.00,
        compareAtPrice: 52.00,
        categoryId: 'cat-3',
        collectionId: 'col-2',
        stock: 2,
        lowStockThreshold: 1,
        status: 'PUBLISHED',
        isUniquePiece: true,
        isNew: true,
        badgeText: "Pièce unique",
        materials: "Cristaux facettés autrichiens sertis à la main, alliage bronze vieilli avec épingle de sécurité renforcée.",
        dimensions: "6,2 cm x 4,8 cm.",
        weightGrams: 19,
        careInstructions: "Ranger individuellement dans son écrin en velours fourni.",
        images: [{ url: '/images/broches.jpg', altText: 'Broche poisson lagunes' }],
        variants: [{ id: 'var-5', name: 'Nuance Lagon & Améthyste', color: '#00A896', stock: 2, priceDiff: 0 }],
        viewsCount: 210,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-4',
        name: "Plastron Minéral 'Un Style Unique'",
        slug: "plastron-mineral-style-unique",
        reference: "PCC-COL-004",
        shortDescription: "Cabochons turquoise, lapis-lazuli et cornaline tressés en fil d'or fin.",
        description: "Création signature entièrement forgée à la main à l'atelier. L'alliance de pierres semi-précieuses polies et de volutes dorées fait de ce bijou une œuvre d'art portable.",
        price: 68.00,
        compareAtPrice: null,
        categoryId: 'cat-4',
        collectionId: 'col-1',
        stock: 2,
        lowStockThreshold: 1,
        status: 'PUBLISHED',
        isUniquePiece: true,
        isNew: true,
        badgeText: "Pièce unique",
        materials: "Turquoise naturelle, lapis lazuli d'Afghanistan, cornaline, fil gold-filled 14k.",
        dimensions: "Longueur chaîne : 42 cm + chaînette de rallonge 5 cm. Pendentif : 6 cm.",
        weightGrams: 24,
        careInstructions: "Nettoyer uniquement avec un chiffon en microfibre doux sans solvant.",
        images: [{ url: '/images/colliers.jpg', altText: 'Plastron minéral' }],
        variants: [],
        viewsCount: 165,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-5',
        name: "Dormeuses Cascade de Cristaux 'Lumière et Élégance'",
        slug: "dormeuses-cascade-cristaux-lumiere",
        reference: "PCC-BO-005",
        shortDescription: "Gouttes de verre taillé couleur saphir et cristal pur montées sur or.",
        description: "Inspirées de l'ambiance des soirs d'été sur le port. Ces boucles pendantes captent la moindre lueur pour illuminer votre port de tête avec une grâce intemporelle.",
        price: 36.00,
        compareAtPrice: null,
        categoryId: 'cat-1',
        collectionId: 'col-3',
        stock: 5,
        lowStockThreshold: 2,
        status: 'PUBLISHED',
        isUniquePiece: false,
        isNew: false,
        badgeText: "Petite série",
        materials: "Verre de Bohême taillé facette diamant, crochets dormeuses sécurisés dorés à l'or fin.",
        dimensions: "Hauteur : 4,8 cm.",
        weightGrams: 9,
        careInstructions: "Éviter les chocs sur surfaces dures.",
        images: [{ url: '/images/hero-atelier.jpg', altText: 'Dormeuses cristaux' }],
        variants: [
          { id: 'var-6', name: 'Reflets Saphir & Cristal', color: '#104F55', stock: 3, priceDiff: 0 },
          { id: 'var-7', name: 'Cristal Pur Transparent', color: '#E0E7FF', stock: 2, priceDiff: 0 },
        ],
        viewsCount: 94,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-6',
        name: "Broche Florale Perlée Multicolore",
        slug: "broche-florale-perlee-multicolore",
        reference: "PCC-BRO-006",
        shortDescription: "Bouquet de perles baroques et gemmes étincelantes en forme de feuille.",
        description: "Une explosion de teintes prune, émeraude et ambre pour apporter un charme vintage chic à vos tenues. Réalisée avec minutie.",
        price: 42.00,
        compareAtPrice: 48.00,
        categoryId: 'cat-3',
        collectionId: 'col-1',
        stock: 1, // Déclenche l'alerte stock faible !
        lowStockThreshold: 3,
        status: 'PUBLISHED',
        isUniquePiece: true,
        isNew: false,
        badgeText: "Dernier exemplaire !",
        materials: "Perles d'eau douce nacrées, cristaux navette de synthèse, monture dorée vieillie.",
        dimensions: "5 cm x 4 cm.",
        weightGrams: 16,
        careInstructions: "Conserver dans son pochon protecteur.",
        images: [{ url: '/images/hero-atelier.jpg', altText: 'Broche florale' }],
        variants: [],
        viewsCount: 112,
        createdAt: new Date().toISOString(),
      },
    ],
    orders: [
      {
        id: 'ord-1',
        orderNumber: 'PCC-2026-000001',
        userId: 'usr-1',
        customerEmail: 'sophie.martin@example.fr',
        customerFirstName: 'Sophie',
        customerLastName: 'Martin',
        customerPhone: '06 12 34 56 78',
        shippingMethod: 'pickup',
        shippingCost: 0,
        shippingAddress: { name: 'Sophie Martin', address1: '14 Rue de la Mer', postalCode: '11210', city: 'Port-la-Nouvelle', country: 'France' },
        subtotal: 63.00,
        discountAmount: 0,
        total: 63.00,
        status: 'DELIVERED',
        paymentMethod: 'card',
        paymentStatus: 'COMPLETED',
        createdAt: '2026-10-09T10:15:00.000Z',
        items: [
          { id: 'item-1', productName: "Boucles Pivoine Rose Poudré & Paillettes", productReference: "PCC-BO-001", variantTitle: "Fuchsia étincelant", imageUrl: "/images/boucles-oreilles.jpg", unitPrice: 34.00, quantity: 1, totalPrice: 34.00 },
          { id: 'item-2', productName: "Bague Ciselée Fleur de Vie", productReference: "PCC-BAG-002", variantTitle: "Doré solaire", imageUrl: "/images/bagues.jpg", unitPrice: 29.00, quantity: 1, totalPrice: 29.00 },
        ],
      },
      {
        id: 'ord-2',
        orderNumber: 'PCC-2026-000002',
        userId: null,
        customerEmail: 'camille.durand@laposte.net',
        customerFirstName: 'Camille',
        customerLastName: 'Durand',
        customerPhone: '06 98 76 54 32',
        shippingMethod: 'standard_delivery',
        shippingCost: 4.90,
        shippingAddress: { name: 'Camille Durand', address1: '25 Avenue de la Méditerranée', postalCode: '11100', city: 'Narbonne', country: 'France' },
        subtotal: 45.00,
        discountAmount: 0,
        total: 49.90,
        status: 'PREPARING',
        paymentMethod: 'card',
        paymentStatus: 'COMPLETED',
        createdAt: '2026-10-10T15:30:00.000Z',
        items: [
          { id: 'item-3', productName: "Broche Poisson des Lagunes 'Esprit Marin'", productReference: "PCC-BRO-003", variantTitle: "Nuance Lagon & Améthyste", imageUrl: "/images/broches.jpg", unitPrice: 45.00, quantity: 1, totalPrice: 45.00 },
        ],
      },
      {
        id: 'ord-3',
        orderNumber: 'PCC-2026-000003',
        userId: null,
        customerEmail: 'elodie.petit@orange.fr',
        customerFirstName: 'Élodie',
        customerLastName: 'Petit',
        customerPhone: '07 44 33 22 11',
        shippingMethod: 'pickup',
        shippingCost: 0,
        shippingAddress: { name: 'Élodie Petit', address1: 'Retrait en boutique L\'Atelier', postalCode: '11210', city: 'Port-la-Nouvelle', country: 'France' },
        subtotal: 68.00,
        discountAmount: 6.80,
        promoCode: 'BIENVENUE10',
        total: 61.20,
        status: 'READY_FOR_PICKUP',
        paymentMethod: 'stripe_simulation',
        paymentStatus: 'COMPLETED',
        createdAt: '2026-10-11T09:40:00.000Z',
        items: [
          { id: 'item-4', productName: "Plastron Minéral 'Un Style Unique'", productReference: "PCC-COL-004", variantTitle: "Modèle original Port-la-Nouvelle", imageUrl: "/images/colliers.jpg", unitPrice: 68.00, quantity: 1, totalPrice: 68.00 },
        ],
      },
    ],
    hours: [
      { id: 'h-1', dayGroup: 'Lundi - Mardi', morningHours: '10 h - 12 h', afternoonHours: '14 h - 17 h', isClosed: false, sortOrder: 1 },
      { id: 'h-2', dayGroup: 'Mercredi - Samedi', morningHours: '10 h - 12 h', afternoonHours: '15 h - 18 h 30', isClosed: false, sortOrder: 2 },
      { id: 'h-3', dayGroup: 'Dimanche', morningHours: '10 h - 12 h', afternoonHours: '14 h - 17 h', isClosed: false, sortOrder: 3 },
    ],
    coupons: [
      { id: 'coup-1', code: 'BIENVENUE10', description: '10% de réduction immédiate pour votre première commande à l\'atelier', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 30, maxUses: 100, usesCount: 1, isActive: true },
      { id: 'coup-2', code: 'CLAIRE5', description: '5€ offerts dès 40€ d\'achat sur les créations faites main', discountType: 'FIXED_AMOUNT', discountValue: 5, minOrderAmount: 40, maxUses: 50, usesCount: 0, isActive: true },
      { id: 'coup-3', code: 'PORTLANOUVELLE', description: 'Livraison offerte dès 25€ d\'achat', discountType: 'FREE_SHIPPING', discountValue: 0, minOrderAmount: 25, maxUses: 200, usesCount: 0, isActive: true },
    ],
    cms: {
      site_title: "Les P'tites Créa de Claire",
      site_tagline: "Boutique L'Atelier • Bijoux & Créations artisanales faites main",
      hero_badge: "Créations artisanales • Pièces uniques & petites séries • Port-la-Nouvelle",
      hero_title: "Des créations uniques, imaginées et réalisées avec passion.",
      hero_subtitle: "Chaque bijou est façonné avec soin au cœur de notre atelier à Port-la-Nouvelle. Des pièces originales, étincelantes et colorées qui célèbrent la singularité de chacune.",
      hero_cta_primary: "Découvrir la boutique",
      hero_cta_secondary: "Les petites nouveautés",
      banner_announcement: "✨ Retrait gratuit à la boutique L'Atelier à Port-la-Nouvelle • Livraison offerte dès 60€ !",
      about_story_title: "L'histoire des P'tites Créa de Claire",
      about_story_text: "Nichée à Port-la-Nouvelle dans l'Aude, la boutique L'Atelier des P'tites Créa de Claire est née d'un amour sincère pour la couleur, la lumière méditerranéenne et le travail soigné des mains. Chaque création est pensée pour illuminer votre quotidien d'une touche d'originalité et de douceur.",
      contact_phone: "04 68 00 00 00",
      contact_email: "contact@lesptitescreadeclaire.fr",
      contact_address: "Boutique L'Atelier, Port-la-Nouvelle (11210), Aude, France",
      instagram_url: "https://instagram.com",
      facebook_url: "https://facebook.com",
      tiktok_url: "https://tiktok.com",
      shipping_standard_price: "4.90",
      shipping_free_threshold: "60.00",
      pickup_enabled: "true",
      exceptional_notice: "Ouverture exceptionnelle tout le week-end du marché artisanal de Port-la-Nouvelle !",
    },
    newsletter: [
      { email: 'sophie.martin@example.fr', createdAt: '2026-10-09' },
      { email: 'marie.dupont@orange.fr', createdAt: '2026-10-10' },
    ],
    contactMessages: [
      { id: 'msg-1', name: 'Valérie Roux', email: 'valerie.roux@gmail.com', phone: '06 22 11 00 99', subject: 'Demande de pièce sur-mesure pour un mariage', message: 'Bonjour Claire, j\'ai adoré votre broche poisson et je souhaiterais savoir s\'il est possible de réaliser une parure de boucles assorties dans les mêmes teintes turquoise pour un mariage le mois prochain ? Merci beaucoup !', createdAt: '2026-10-11T08:30:00.000Z' }
    ],
    emailLogs: [
      { id: 'em-1', recipient: 'sophie.martin@example.fr', subject: 'Confirmation de votre commande PCC-2026-000001 • Les P\'tites Créa de Claire', template: 'ORDER_CONFIRMATION', sentAt: '2026-10-09 10:15' },
      { id: 'em-2', recipient: 'elodie.petit@orange.fr', subject: 'Votre commande PCC-2026-000003 est prête à la boutique L\'Atelier !', template: 'ORDER_READY_FOR_PICKUP', sentAt: '2026-10-11 09:40' }
    ],
    analytics: [
      { event: 'page_view', path: '/', source: 'instagram', timestamp: '2026-10-11' },
      { event: 'page_view', path: '/boutique', source: 'instagram', timestamp: '2026-10-11' },
      { event: 'product_view', path: '/produit/boucles-pivoine-rose-poudre', source: 'instagram', timestamp: '2026-10-11' },
      { event: 'add_to_cart', path: '/produit/boucles-pivoine-rose-poudre', source: 'instagram', timestamp: '2026-10-11' },
      { event: 'purchase', path: '/checkout/succes', source: 'direct', timestamp: '2026-10-11' },
    ]
  };

  saveStoreToFile(initialDefaults);
  return initialDefaults;
}

// Data Access Layer
export const store = {
  // Produits
  async getProducts() {
    if (hasDatabase && prisma) {
      try {
        const dbProducts = await prisma.product.findMany({
          include: { images: true, variants: true },
          orderBy: { createdAt: 'desc' }
        });
        if (dbProducts && dbProducts.length > 0) {
          return dbProducts.map(p => ({
            ...p,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            variants: p.variants.map(v => ({ ...v, priceDiff: Number(v.priceDiff) })),
            images: p.images.map(img => ({ url: img.url, altText: img.altText || '' })),
            createdAt: p.createdAt.toISOString()
          })) as Product[];
        }
      } catch (e) {
        // Prisma fallback
      }
    }
    return getInitialStore().products;
  },


  async getProductBySlug(slug: string) {
    const products = await this.getProducts();
    return products.find(p => p.slug === slug) || null;
  },

  async getProductById(id: string) {
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  },

  async createProduct(data: Partial<Product>) {
    const s = getInitialStore();
    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      name: data.name || 'Nouvelle création',
      slug: data.slug || `creation-${Date.now()}`,
      reference: data.reference || `PCC-ART-${Math.floor(100 + Math.random() * 900)}`,
      shortDescription: data.shortDescription || '',
      description: data.description || '',
      price: Number(data.price) || 0,
      compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
      categoryId: data.categoryId || null,
      collectionId: data.collectionId || null,
      stock: Number(data.stock) ?? 5,
      lowStockThreshold: Number(data.lowStockThreshold) ?? 3,
      status: data.status || 'PUBLISHED',
      isUniquePiece: Boolean(data.isUniquePiece),
      isNew: Boolean(data.isNew ?? true),
      badgeText: data.badgeText || null,
      materials: data.materials || '',
      dimensions: data.dimensions || '',
      weightGrams: data.weightGrams ? Number(data.weightGrams) : null,
      careInstructions: data.careInstructions || '',
      images: data.images && data.images.length > 0 ? data.images : [{ url: '/images/hero-atelier.jpg', altText: data.name }],
      variants: data.variants || [],
      viewsCount: 0,
      createdAt: new Date().toISOString()
    };
    s.products.unshift(newProduct);
    saveStoreToFile(s);
    return newProduct;
  },

  async updateProduct(id: string, data: Partial<Product>) {
    const s = getInitialStore();
    const index = s.products.findIndex(p => p.id === id || p.slug === id);
    if (index === -1) return null;
    s.products[index] = { ...s.products[index], ...data };
    saveStoreToFile(s);
    return s.products[index];
  },

  async deleteProduct(id: string) {
    const s = getInitialStore();
    const index = s.products.findIndex(p => p.id === id || p.slug === id);
    if (index !== -1) {
      s.products.splice(index, 1);
      saveStoreToFile(s);
      return true;
    }
    return false;
  },


  // Catégories & Collections
  async getCategories() {
    return getInitialStore().categories;
  },

  async createCategory(data: Partial<Category>) {
    const s = getInitialStore();
    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name: data.name || 'Nouveau rayon',
      slug: data.slug || `rayon-${Date.now()}`,
      description: data.description || '',
      imageUrl: data.imageUrl || '/images/hero-atelier.jpg',
      displayOrder: data.displayOrder ?? (s.categories.length + 1),
    };
    s.categories.push(newCat);
    saveStoreToFile(s);
    return newCat;
  },

  async updateCategory(id: string, data: Partial<Category>) {
    const s = getInitialStore();
    const index = s.categories.findIndex(c => c.id === id || c.slug === id);
    if (index === -1) return null;
    s.categories[index] = { ...s.categories[index], ...data };
    saveStoreToFile(s);
    return s.categories[index];
  },

  async deleteCategory(id: string) {
    const s = getInitialStore();
    const index = s.categories.findIndex(c => c.id === id || c.slug === id);
    if (index !== -1) {
      s.categories.splice(index, 1);
      saveStoreToFile(s);
      return true;
    }
    return false;
  },

  async getCollections() {
    return getInitialStore().collections;
  },

  async createCollection(data: Partial<Collection>) {
    const s = getInitialStore();
    const newCol: Collection = {
      id: 'col-' + Date.now(),
      name: data.name || 'Nouvelle collection',
      slug: data.slug || `collection-${Date.now()}`,
      description: data.description || '',
      imageUrl: data.imageUrl || '/images/hero-atelier.jpg',
      isActive: data.isActive ?? true,
    };
    s.collections.push(newCol);
    saveStoreToFile(s);
    return newCol;
  },

  async updateCollection(id: string, data: Partial<Collection>) {
    const s = getInitialStore();
    const index = s.collections.findIndex(c => c.id === id || c.slug === id);
    if (index === -1) return null;
    s.collections[index] = { ...s.collections[index], ...data };
    saveStoreToFile(s);
    return s.collections[index];
  },

  async deleteCollection(id: string) {
    const s = getInitialStore();
    const index = s.collections.findIndex(c => c.id === id || c.slug === id);
    if (index !== -1) {
      s.collections.splice(index, 1);
      saveStoreToFile(s);
      return true;
    }
    return false;
  },

  // Commandes
  async getOrders() {
    return getInitialStore().orders;
  },

  async getOrderByNumber(orderNumber: string) {
    return getInitialStore().orders.find(o => o.orderNumber === orderNumber) || null;
  },

  async createOrder(data: {
    customerEmail: string;
    customerFirstName: string;
    customerLastName: string;
    customerPhone?: string;
    shippingMethod: 'pickup' | 'standard_delivery' | 'express_delivery';
    shippingCost: number;
    shippingAddress: any;
    items: Array<{ productId?: string; productName: string; variantTitle?: string; imageUrl?: string; unitPrice: number; quantity: number }>;
    promoCode?: string;
    discountAmount?: number;
    paymentMethod?: string;
    customerNote?: string;
  }) {
    const s = getInitialStore();
    const count = s.orders.length + 1;
    const orderNumber = `PCC-2026-${String(count).padStart(6, '0')}`;

    const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const discount = data.discountAmount || 0;
    const total = Math.max(0, subtotal - discount + data.shippingCost);

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber,
      customerEmail: data.customerEmail,
      customerFirstName: data.customerFirstName,
      customerLastName: data.customerLastName,
      customerPhone: data.customerPhone || null,
      shippingMethod: data.shippingMethod,
      shippingCost: data.shippingCost,
      shippingAddress: data.shippingAddress,
      subtotal,
      discountAmount: discount,
      promoCode: data.promoCode || null,
      total,
      status: 'PAID',
      paymentMethod: data.paymentMethod || 'card',
      paymentStatus: 'COMPLETED',
      customerNote: data.customerNote || null,
      createdAt: new Date().toISOString(),
      items: data.items.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        productId: item.productId,
        productName: item.productName,
        variantTitle: item.variantTitle,
        imageUrl: item.imageUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.unitPrice * item.quantity
      }))
    };

    // Déduction automatique du stock en temps réel
    data.items.forEach(orderItem => {
      if (orderItem.productId) {
        const prod = s.products.find(p => p.id === orderItem.productId);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - orderItem.quantity);
          if (prod.stock === 0) prod.status = 'SOLD_OUT';
        }
      }
    });

    s.orders.unshift(newOrder);

    // Envoi d'email de confirmation simulé
    s.emailLogs.unshift({
      id: 'em-' + Date.now(),
      recipient: data.customerEmail,
      subject: `Confirmation de votre commande ${orderNumber} • Les P'tites Créa de Claire`,
      template: 'ORDER_CONFIRMATION',
      sentAt: new Date().toLocaleString('fr-FR')
    });

    saveStoreToFile(s);
    return newOrder;
  },

  async updateOrderStatus(orderId: string, newStatus?: Order['status'], adminNotes?: string) {
    const s = getInitialStore();
    const order = s.orders.find(o => o.id === orderId);
    if (!order) return null;

    const previousStatus = order.status;
    if (newStatus) {
      order.status = newStatus;
    }
    if (adminNotes !== undefined) order.adminNotes = adminNotes;

    // Si la commande est annulée ou remboursée, réintégrer le stock
    if ((newStatus === 'CANCELLED' || newStatus === 'REFUNDED') && (previousStatus !== 'CANCELLED' && previousStatus !== 'REFUNDED')) {
      order.items.forEach(item => {
        if (item.productId) {
          const prod = s.products.find(p => p.id === item.productId);
          if (prod) {
            prod.stock += item.quantity;
            if (prod.status === 'SOLD_OUT' && prod.stock > 0) prod.status = 'PUBLISHED';
          }
        }
      });
    }

    // Logger email correspondant au changement de statut
    let emailSubject = '';
    let emailTemplate = '';
    if (newStatus === 'READY_FOR_PICKUP') {
      emailSubject = `Votre commande ${order.orderNumber} est prête à la boutique L'Atelier !`;
      emailTemplate = 'ORDER_READY_FOR_PICKUP';
    } else if (newStatus === 'SHIPPED') {
      emailSubject = `Votre commande ${order.orderNumber} vient d'être expédiée !`;
      emailTemplate = 'ORDER_SHIPPED';
    } else if (newStatus === 'CONFIRMED') {
      emailSubject = `Votre commande ${order.orderNumber} a été validée par Claire.`;
      emailTemplate = 'ORDER_CONFIRMED';
    }

    if (emailSubject) {
      s.emailLogs.unshift({
        id: 'em-' + Date.now(),
        recipient: order.customerEmail,
        subject: emailSubject,
        template: emailTemplate,
        sentAt: new Date().toLocaleString('fr-FR')
      });
    }

    saveStoreToFile(s);
    return order;
  },

  // Horaires de la boutique
  async getOpeningHours() {
    return getInitialStore().hours;
  },

  async updateOpeningHours(hours: OpeningHour[]) {
    const s = getInitialStore();
    s.hours = hours;
    saveStoreToFile(s);
    return hours;
  },

  // Coupons
  async getCoupons() {
    return getInitialStore().coupons;
  },

  async createCoupon(data: Partial<Coupon>) {
    const s = getInitialStore();
    const newCoupon: Coupon = {
      id: 'coup-' + Date.now(),
      code: (data.code || `PROMO${Math.floor(10 + Math.random() * 90)}`).toUpperCase().trim(),
      description: data.description || '',
      discountType: data.discountType || 'PERCENTAGE',
      discountValue: Number(data.discountValue) || 10,
      minOrderAmount: Number(data.minOrderAmount) || 0,
      maxUses: data.maxUses ? Number(data.maxUses) : undefined,
      usesCount: 0,
      isActive: data.isActive ?? true,
    };
    s.coupons.unshift(newCoupon);
    saveStoreToFile(s);
    return newCoupon;
  },

  async updateCoupon(id: string, data: Partial<Coupon>) {
    const s = getInitialStore();
    const index = s.coupons.findIndex(c => c.id === id || c.code.toUpperCase() === id.toUpperCase());
    if (index === -1) return null;
    s.coupons[index] = {
      ...s.coupons[index],
      ...data,
      code: data.code ? data.code.toUpperCase().trim() : s.coupons[index].code,
    };
    saveStoreToFile(s);
    return s.coupons[index];
  },

  async deleteCoupon(id: string) {
    const s = getInitialStore();
    const index = s.coupons.findIndex(c => c.id === id || c.code.toUpperCase() === id.toUpperCase());
    if (index !== -1) {
      s.coupons.splice(index, 1);
      saveStoreToFile(s);
      return true;
    }
    return false;
  },

  async validateCoupon(code: string, subtotal: number) {
    const coupon = getInitialStore().coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!coupon) return { valid: false, message: 'Code promotionnel introuvable ou inactif.' };
    if (subtotal < coupon.minOrderAmount) {
      return { valid: false, message: `Montant minimum requis pour ce code : ${coupon.minOrderAmount} €` };
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (subtotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discount = Math.min(coupon.discountValue, subtotal);
    } else if (coupon.discountType === 'FREE_SHIPPING') {
      discount = 0; // livraison gratuite
    }

    return {
      valid: true,
      coupon,
      discountAmount: discount,
      message: `Code appliqué : ${coupon.description}`
    };
  },

  // CMS
  async getCmsSettings() {
    return getInitialStore().cms;
  },

  async updateCmsSetting(key: string, value: string) {
    const s = getInitialStore();
    s.cms[key] = value;
    saveStoreToFile(s);
    return true;
  },

  // Analytics
  async getAnalytics() {
    const s = getInitialStore();
    const orders = s.orders;
    const totalRevenue = orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'REFUNDED').reduce((sum, o) => sum + o.total, 0);
    const avgCart = orders.length > 0 ? (totalRevenue / orders.length) : 0;

    return {
      totalVisitors: 842,
      pageViews: 2450,
      totalOrders: orders.length,
      totalRevenue,
      averageCart: avgCart,
      conversionRate: 3.4,
      trafficSources: [
        { name: 'Instagram', percent: 54 },
        { name: 'Facebook', percent: 22 },
        { name: 'Recherche Google', percent: 16 },
        { name: 'Direct / Bouche à oreille', percent: 8 },
      ],
      topProducts: s.products.slice(0, 4),
      lowStockProducts: s.products.filter(p => p.stock <= p.lowStockThreshold)
    };
  },

  // Newsletter
  async addNewsletter(email: string) {
    const s = getInitialStore();
    if (!s.newsletter.find(n => n.email === email)) {
      s.newsletter.unshift({ email, createdAt: new Date().toISOString() });
    }
    return true;
  },

  // Contact
  async addContactMessage(data: { name: string; email: string; phone?: string; subject: string; message: string }) {
    const s = getInitialStore();
    const newMsg = { id: 'msg-' + Date.now(), ...data, createdAt: new Date().toISOString() };
    s.contactMessages.unshift(newMsg);
    return newMsg;
  },

  async getContactMessages() {
    return getInitialStore().contactMessages;
  },

  // Email Logs
  async getEmailLogs() {
    return getInitialStore().emailLogs;
  }
};
