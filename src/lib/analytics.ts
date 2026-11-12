import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DATA_DIR, store } from './store';
import type { Order, Product } from './types';

// Mesure d'audience maison, sans cookie ni donnée personnelle :
// uniquement des compteurs par jour. L'identifiant visiteur est une empreinte
// (IP + navigateur + sel) qui n'est conservée que pour la journée en cours.

const FILE = path.join(DATA_DIR, 'analytics.json');
const KEEP_DAYS = 400;

export type AnalyticsEvent = 'page_view' | 'product_view' | 'add_to_cart' | 'begin_checkout' | 'purchase';
export type TrafficSource = 'instagram' | 'facebook' | 'google' | 'tiktok' | 'direct' | 'autre';

interface DayStats {
  views: number;
  visitors: number;
  productViews: number;
  addToCart: number;
  checkouts: number;
  purchases: number;
  sources: Partial<Record<TrafficSource, number>>;
}

interface AnalyticsFile {
  salt: string;
  days: Record<string, DayStats>;
  today: { date: string; visitors: string[] };
}

function emptyDay(): DayStats {
  return { views: 0, visitors: 0, productViews: 0, addToCart: 0, checkouts: 0, purchases: 0, sources: {} };
}

export function parisDate(date = new Date()): string {
  // en-CA donne directement AAAA-MM-JJ
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(date);
}

function read(): AnalyticsFile {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, 'utf-8')) as AnalyticsFile;
    if (data && typeof data === 'object' && data.days) {
      return {
        salt: data.salt || crypto.randomBytes(16).toString('hex'),
        days: data.days,
        today: data.today || { date: '', visitors: [] },
      };
    }
  } catch {
    // fichier absent ou illisible : on repart de zéro
  }
  return { salt: crypto.randomBytes(16).toString('hex'), days: {}, today: { date: '', visitors: [] } };
}

function write(data: AnalyticsFile) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data), 'utf-8');
    fs.renameSync(tmp, FILE);
  } catch (err) {
    console.error('[analytics] écriture impossible', err);
  }
}

export function sourceFromReferrer(referrer: string | undefined, utmSource: string | undefined): TrafficSource {
  const hint = `${utmSource || ''} ${referrer || ''}`.toLowerCase();
  if (!hint.trim()) return 'direct';
  if (hint.includes('instagram')) return 'instagram';
  if (hint.includes('facebook') || hint.includes('fb.')) return 'facebook';
  if (hint.includes('tiktok')) return 'tiktok';
  if (hint.includes('google')) return 'google';
  return 'autre';
}

export function trackEvent(input: {
  event: AnalyticsEvent;
  visitorKey?: string;
  source?: TrafficSource;
}): void {
  const data = read();
  const date = parisDate();
  if (data.today.date !== date) data.today = { date, visitors: [] };
  const day = (data.days[date] ||= emptyDay());

  if (input.visitorKey) {
    const hash = crypto.createHash('sha256').update(`${data.salt}|${date}|${input.visitorKey}`).digest('hex').slice(0, 16);
    if (!data.today.visitors.includes(hash)) {
      data.today.visitors.push(hash);
      day.visitors += 1;
      const source = input.source || 'direct';
      day.sources[source] = (day.sources[source] || 0) + 1;
    }
  }

  if (input.event === 'page_view') day.views += 1;
  if (input.event === 'product_view') day.productViews += 1;
  if (input.event === 'add_to_cart') day.addToCart += 1;
  if (input.event === 'begin_checkout') day.checkouts += 1;
  if (input.event === 'purchase') day.purchases += 1;

  const dates = Object.keys(data.days).sort();
  while (dates.length > KEEP_DAYS) delete data.days[dates.shift() as string];

  write(data);
}

const SOURCE_LABELS: Record<TrafficSource, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Recherche Google',
  tiktok: 'TikTok',
  direct: 'Accès direct',
  autre: 'Autres sites',
};

const isSale = (o: Order) => !['PENDING', 'CANCELLED', 'REFUNDED'].includes(o.status);

export interface AnalyticsReport {
  periodDays: number;
  totalVisitors: number;
  pageViews: number;
  productViews: number;
  addToCart: number;
  checkouts: number;
  totalOrders: number;
  totalRevenue: number;
  averageCart: number;
  conversionRate: number;
  revenueChangePercent: number | null;
  trafficSources: Array<{ name: string; count: number; percent: number }>;
  daily: Array<{ date: string; label: string; revenue: number; orders: number; views: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  lowStockProducts: Product[];
  allTime: { orders: number; revenue: number; averageCart: number };
}

/** Statistiques réelles sur les N derniers jours (commandes + compteurs de visite). */
export async function getAnalyticsReport(periodDays: number): Promise<AnalyticsReport> {
  const days = Math.min(365, Math.max(1, Math.round(periodDays) || 7));
  const data = read();
  const [orders, products] = await Promise.all([store.getOrders(), store.getProducts()]);
  const sales = orders.filter(isSale);

  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    dates.push(parisDate(new Date(Date.now() - i * 86_400_000)));
  }
  const inPeriod = new Set(dates);
  const previous = new Set<string>();
  for (let i = days * 2 - 1; i >= days; i -= 1) {
    previous.add(parisDate(new Date(Date.now() - i * 86_400_000)));
  }

  const totals = emptyDay();
  for (const date of dates) {
    const day = data.days[date];
    if (!day) continue;
    totals.views += day.views;
    totals.visitors += day.visitors;
    totals.productViews += day.productViews;
    totals.addToCart += day.addToCart;
    totals.checkouts += day.checkouts;
    for (const [source, count] of Object.entries(day.sources || {})) {
      const key = source as TrafficSource;
      totals.sources[key] = (totals.sources[key] || 0) + (count || 0);
    }
  }

  const periodSales = sales.filter((o) => inPeriod.has(parisDate(new Date(o.createdAt))));
  const previousSales = sales.filter((o) => previous.has(parisDate(new Date(o.createdAt))));
  const revenue = periodSales.reduce((sum, o) => sum + o.total, 0);
  const previousRevenue = previousSales.reduce((sum, o) => sum + o.total, 0);

  const sold = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of periodSales) {
    for (const item of order.items) {
      const key = item.productId || item.productName;
      const entry = sold.get(key) || { name: item.productName, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.totalPrice;
      sold.set(key, entry);
    }
  }

  const sourceTotal = Object.values(totals.sources).reduce((sum, n) => sum + (n || 0), 0);
  const allRevenue = sales.reduce((sum, o) => sum + o.total, 0);

  return {
    periodDays: days,
    totalVisitors: totals.visitors,
    pageViews: totals.views,
    productViews: totals.productViews,
    addToCart: totals.addToCart,
    checkouts: totals.checkouts,
    totalOrders: periodSales.length,
    totalRevenue: revenue,
    averageCart: periodSales.length > 0 ? revenue / periodSales.length : 0,
    conversionRate: totals.visitors > 0 ? Math.round((periodSales.length / totals.visitors) * 1000) / 10 : 0,
    revenueChangePercent:
      previousRevenue > 0 ? Math.round(((revenue - previousRevenue) / previousRevenue) * 1000) / 10 : null,
    trafficSources: (Object.entries(totals.sources) as Array<[TrafficSource, number]>)
      .map(([source, count]) => ({
        name: SOURCE_LABELS[source] || source,
        count,
        percent: sourceTotal > 0 ? Math.round((count / sourceTotal) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count),
    daily: dates.map((date) => {
      const dayOrders = periodSales.filter((o) => parisDate(new Date(o.createdAt)) === date);
      return {
        date,
        label: new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
        views: data.days[date]?.views || 0,
      };
    }),
    topProducts: [...sold.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    lowStockProducts: products.filter((p) => p.status !== 'DRAFT' && p.status !== 'HIDDEN' && p.stock <= p.lowStockThreshold),
    allTime: {
      orders: sales.length,
      revenue: allRevenue,
      averageCart: sales.length > 0 ? allRevenue / sales.length : 0,
    },
  };
}
