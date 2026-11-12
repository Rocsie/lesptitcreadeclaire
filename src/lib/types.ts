// Types partagés entre le serveur et les composants client.
// Ce fichier ne doit importer aucun module Node (fs, path...) : il est chargé côté navigateur.

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'SOLD_OUT';

export interface ProductImage {
  url: string;
  altText?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  color?: string | null;
  stock: number;
  priceDiff: number;
}

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
  status: ProductStatus;
  isUniquePiece: boolean;
  isNew: boolean;
  badgeText?: string | null;
  materials?: string | null;
  dimensions?: string | null;
  weightGrams?: number | null;
  careInstructions?: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  viewsCount: number;
  createdAt: string;
  /** Dernière modification de la fiche, utilisée par le sitemap. */
  updatedAt?: string;
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
  variantId?: string;
  variantTitle?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export type ShippingMethod = 'pickup' | 'standard_delivery' | 'express_delivery';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface ShippingAddress {
  name?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  // Clé secrète qui autorise l'affichage de la page de confirmation sans être connecté.
  accessToken?: string;
  userId?: string | null;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string | null;
  shippingMethod: ShippingMethod;
  shippingCost: number;
  shippingAddress: ShippingAddress;
  subtotal: number;
  discountAmount: number;
  promoCode?: string | null;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string | null;
  trackingNumber?: string | null;
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

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxUses?: number;
  usesCount: number;
  isActive: boolean;
}

export type UserRole = 'ADMIN' | 'CLIENT';

// Utilisateur tel qu'il est exposé au navigateur (jamais de mot de passe).
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  createdAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

export interface NewsletterSubscriber {
  email: string;
  createdAt: string;
}

export type EmailLogStatus = 'SENT' | 'FAILED' | 'NOT_CONFIGURED' | 'SIMULATED';

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  template: string;
  sentAt: string;
  status?: EmailLogStatus;
  error?: string;
}

export type PaymentMode = 'stripe' | 'simulation' | 'disabled';

// Réglages publics nécessaires au panier et au tunnel de commande.
export interface PublicSettings {
  shippingPrice: number;
  freeShippingThreshold: number;
  pickupEnabled: boolean;
  paymentMode: PaymentMode;
}

export interface CouponValidation {
  valid: boolean;
  message: string;
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  discountAmount?: number;
  freeShipping?: boolean;
}

export const VISIBLE_STATUSES: ProductStatus[] = ['PUBLISHED', 'SOLD_OUT'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: 'Paiement en attente', color: 'bg-amber-100 text-amber-800' },
  PAID: { label: 'Payée', color: 'bg-blue-100 text-blue-800' },
  CONFIRMED: { label: 'Confirmée', color: 'bg-indigo-100 text-indigo-800' },
  PREPARING: { label: 'En préparation', color: 'bg-purple-100 text-purple-800' },
  READY_FOR_PICKUP: { label: 'Prête à la boutique', color: 'bg-emerald-100 text-emerald-800' },
  SHIPPED: { label: 'Expédiée', color: 'bg-teal-100 text-teal-800' },
  DELIVERED: { label: 'Terminée', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Remboursée', color: 'bg-gray-100 text-gray-800' },
};
