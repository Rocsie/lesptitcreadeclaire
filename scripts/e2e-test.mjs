// Tests de bout en bout de la boutique.
//
// Le script démarre le site construit ("npm run build" d'abord) sur un port libre, avec un dossier
// de données temporaire créé à partir de data/seed.json : il ne touche jamais aux vraies données.
// Il vérifie les droits d'accès, les commandes, le stock, les codes promo, les comptes, l'envoi de
// photos, les statistiques et le référencement, puis arrête le serveur et efface le dossier.
//
// Usage : npm run build && npm run test:e2e
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const repo = process.cwd();
if (!fs.existsSync(path.join(repo, '.next', 'BUILD_ID'))) {
  console.error('Le site n\'est pas construit : lancer "npm run build" avant les tests.');
  process.exit(1);
}

// Le sous-dossier de déploiement est figé au moment du build : on le relit pour viser les bonnes adresses.
const routesManifest = JSON.parse(fs.readFileSync(path.join(repo, '.next', 'routes-manifest.json'), 'utf-8'));
const basePath = routesManifest.basePath || '';

const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

const port = await freePort();
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boutique-e2e-'));
const ADMIN_EMAIL = 'gestion@example.test';
const ADMIN_PASSWORD = crypto.randomBytes(12).toString('base64url');
const origin = `http://127.0.0.1:${port}`;
const base = origin + basePath;

const server = spawn(process.execPath, [path.join(repo, 'node_modules/next/dist/bin/next'), 'start', '-p', String(port), '-H', '127.0.0.1'], {
  cwd: repo,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    DATA_DIR: dataDir,
    APP_URL: origin,
    // Le serveur doit démarrer avec le même sous-dossier que celui du build.
    NEXT_PUBLIC_BASE_PATH: basePath,
    AUTH_SECRET: crypto.randomBytes(48).toString('hex'),
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    // Aucun service extérieur pendant les tests : ni paiement, ni email, ni blocage d'indexation.
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    SMTP_HOST: '',
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    SITE_NOINDEX: '',
    NEXT_TELEMETRY_DISABLED: '1',
  },
});
let serverLog = '';
server.stdout.on('data', (chunk) => (serverLog += chunk));
server.stderr.on('data', (chunk) => (serverLog += chunk));

let cleaned = false;
function cleanup() {
  if (cleaned) return;
  cleaned = true;
  try {
    server.kill();
  } catch {
    /* déjà arrêté */
  }
  try {
    fs.rmSync(dataDir, { recursive: true, force: true });
  } catch {
    /* le dossier temporaire sera nettoyé par le système */
  }
}
process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(130));
process.on('uncaughtException', (error) => {
  console.error(error);
  console.error(serverLog.slice(-2000));
  process.exit(1);
});

// Attend que le site réponde.
{
  const deadline = Date.now() + 40_000;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    try {
      const res = await fetch(`${base}/api/health`);
      ready = res.ok;
    } catch {
      /* pas encore démarré */
    }
    if (!ready) await new Promise((resolve) => setTimeout(resolve, 400));
  }
  if (!ready) {
    console.error('Le site ne répond pas.\n' + serverLog.slice(-2000));
    process.exit(1);
  }
}

let passed = 0;
let failed = 0;
const check = (name, cond, detail = '') => {
  if (cond) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name} ${detail}`);
  }
};

function client() {
  let cookie = '';
  // Chaque client simule une adresse IP différente pour ne pas buter sur les limites de débit.
  const ip = `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  return async function call(method, url, body, opts = {}) {
    const headers = { 'x-forwarded-for': ip, 'user-agent': 'Mozilla/5.0 e2e-test', ...(opts.headers || {}) };
    if (cookie) headers.cookie = cookie;
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) {
      headers['content-type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    // Dans un sous-dossier, l'accueil est "/sous-dossier" sans barre finale.
    const target = url === '/' && basePath ? base : base + url;
    const res = await fetch(target, { method, headers, body: payload, redirect: 'manual' });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0].endsWith('=') ? '' : setCookie.split(';')[0];
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* pas du JSON */
    }
    return { status: res.status, json, text, headers: res.headers };
  };
}

const anon = client();
const admin = client();
const alice = client();
const bob = client();
const readStore = () => JSON.parse(fs.readFileSync(path.join(dataDir, 'store.json'), 'utf-8'));

console.log('\n== Catalogue public');
let r = await anon('GET', '/api/products');
check('liste des produits visible', r.status === 200 && Array.isArray(r.json) && r.json.length >= 6, `status ${r.status}`);
const products = r.json;
const pivoine = products.find((p) => p.slug === 'boucles-pivoine-rose-poudre');
const bague = products.find((p) => p.slug === 'bague-ciselee-fleur-de-vie');
const plastron = products.find((p) => p.slug === 'plastron-mineral-style-unique');
check('produits de test présents', Boolean(pivoine && bague && plastron));
check('aucun mot de passe ni donnée interne dans les produits', !JSON.stringify(products).includes('passwordHash'));
r = await anon('GET', '/api/settings');
check('réglages publics', r.status === 200 && r.json.paymentMode === 'simulation' && r.json.shippingPrice === 4.9 && r.json.freeShippingThreshold === 60, JSON.stringify(r.json));

console.log('\n== Routes protégées sans connexion');
for (const [method, url, body] of [
  ['GET', '/api/orders'],
  ['GET', '/api/promos'],
  ['GET', '/api/contact'],
  ['GET', '/api/newsletter'],
  ['GET', '/api/analytics'],
  ['GET', '/api/upload'],
  ['GET', '/api/admin/status'],
  ['GET', '/api/products?scope=admin'],
  ['POST', '/api/products', { name: 'Pirate', price: 1 }],
  ['PUT', '/api/products/' + pivoine.slug, { price: 0.01 }],
  ['DELETE', '/api/products/' + pivoine.slug],
  ['POST', '/api/categories', { name: 'Pirate' }],
  ['POST', '/api/collections', { name: 'Pirate' }],
  ['POST', '/api/promos', { code: 'GRATUIT', discountType: 'PERCENTAGE', discountValue: 100 }],
  ['PUT', '/api/cms', { hero_title: 'Piraté' }],
  ['PUT', '/api/cms/hours', []],
  ['PUT', '/api/orders/ord-1', { status: 'REFUNDED' }],
  ['DELETE', '/api/upload?name=x.jpg'],
]) {
  r = await anon(method, url, body);
  check(`${method} ${url} refusé`, r.status === 401 || r.status === 403, `status ${r.status}`);
}
const fd0 = new FormData();
fd0.append('file', new Blob(['x'], { type: 'image/png' }), 'x.png');
r = await anon('POST', '/api/upload', fd0);
check('POST /api/upload refusé', r.status === 401, `status ${r.status}`);
r = await anon('GET', '/admin');
check('/admin redirige vers la connexion', r.status === 307 && (r.headers.get('location') || '').includes('/connexion'), `status ${r.status} ${r.headers.get('location')}`);
r = await anon('GET', '/compte');
check('/compte redirige vers la connexion', r.status === 307 && (r.headers.get('location') || '').includes('/connexion'), `status ${r.status}`);

console.log('\n== Connexion');
r = await admin('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: 'mauvais-mot-de-passe' });
check('mauvais mot de passe refusé', r.status === 401);
r = await admin('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: 'claire2026!' });
check("l'ancien mot de passe public du README ne marche plus", r.status === 401);
r = await admin('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
check('connexion gestionnaire', r.status === 200 && r.json.user.role === 'ADMIN', `status ${r.status} ${r.text.slice(0, 100)}`);
check('cookie de session httpOnly', /pcc_session=/.test(r.headers.get('set-cookie') || '') && /HttpOnly/i.test(r.headers.get('set-cookie') || ''));
r = await admin('GET', '/api/auth/me');
check('session reconnue', r.json?.user?.role === 'ADMIN' && !('passwordHash' in r.json.user));
r = await admin('GET', '/admin');
check('/admin accessible une fois connectée', r.status === 200, `status ${r.status}`);

console.log('\n== Produits (administration)');
r = await admin('POST', '/api/products', { name: 'Collier Été Doré à l’Œil', price: '49.5', stock: 2, categoryId: 'cat-4', images: [], status: 'PUBLISHED' });
check('création produit', r.status === 201 && r.json.slug === 'collier-ete-dore-a-l-oeil', `status ${r.status} slug ${r.json?.slug}`);
const created = r.json;
r = await admin('POST', '/api/products', { name: 'Collier Été Doré à l’Œil', price: 49.5, stock: 1 });
check('nom en double : adresse différente', r.status === 201 && r.json.slug === 'collier-ete-dore-a-l-oeil-2', r.json?.slug);
const duplicate = r.json;
r = await admin('POST', '/api/products', { name: '', price: 10 });
check('nom vide refusé', r.status === 400);
r = await admin('POST', '/api/products', { name: 'Prix négatif', price: -5 });
check('prix négatif refusé', r.status === 400);
r = await admin('PUT', `/api/products/${created.slug}`, { id: created.id, status: 'DRAFT' });
check('passage en brouillon', r.status === 200 && r.json.status === 'DRAFT');
r = await anon('GET', '/api/products');
check('brouillon absent de la boutique', !r.json.some((p) => p.id === created.id));
r = await anon('GET', `/api/products/${created.slug}`);
check("fiche API du brouillon invisible pour le public", r.status === 404);
r = await anon('GET', `/produit/${created.slug}`);
check('page du brouillon : 404 pour le public', r.status === 404, `status ${r.status}`);
r = await admin('GET', `/produit/${created.slug}`);
check('page du brouillon : aperçu pour la gestionnaire', r.status === 200 && r.text.includes('Aperçu réservé'), `status ${r.status}`);
r = await admin('GET', '/api/products?scope=admin');
check('brouillon présent dans la liste admin', r.json.some((p) => p.id === created.id));
r = await admin('PUT', `/api/products/${duplicate.slug}`, { id: duplicate.id, stock: 0 });
check('stock à zéro : épuisé', r.json.status === 'SOLD_OUT');
r = await admin('PUT', `/api/products/${duplicate.slug}`, { id: duplicate.id, stock: 3 });
check('réassort : de nouveau en ligne', r.json.status === 'PUBLISHED' && r.json.stock === 3);
r = await admin('DELETE', `/api/products/${created.id}`);
check('suppression produit', r.status === 200);
r = await admin('DELETE', `/api/products/${duplicate.id}`);
r = await admin('DELETE', `/api/products/${duplicate.id}`);
check('suppression répétée : 404', r.status === 404);

console.log('\n== Supprimer tous les produits ne réinitialise pas la boutique');
{
  const before = readStore();
  const backup = JSON.stringify(before);
  const emptied = { ...before, products: [] };
  fs.writeFileSync(path.join(dataDir, 'store.json'), JSON.stringify(emptied));
  r = await anon('GET', '/api/products');
  check('catalogue vide accepté', r.status === 200 && r.json.length === 0, `len ${r.json?.length}`);
  check('les autres données sont intactes', readStore().coupons.length === before.coupons.length);
  fs.writeFileSync(path.join(dataDir, 'store.json'), backup);
}

console.log('\n== Codes promo');
{
  const seeded = (await admin('GET', '/api/promos')).json;
  check('codes promo de départ livrés inactifs', seeded.length > 0 && seeded.every((c) => c.isActive === false));
  r = await anon('POST', '/api/promos/validate', { code: 'BIENVENUE10', subtotal: 100 });
  check('code inactif refusé', r.json.valid === false);
  for (const c of seeded) await admin('PUT', '/api/promos', { id: c.id, isActive: true });
}
r = await anon('POST', '/api/promos/validate', { code: 'bienvenue10', subtotal: 20 });
check('minimum non atteint', r.json.valid === false);
r = await anon('POST', '/api/promos/validate', { code: 'bienvenue10', subtotal: 50 });
check('10 % calculés', r.json.valid && r.json.discountAmount === 5 && !('coupon' in r.json), JSON.stringify(r.json));
r = await anon('POST', '/api/promos/validate', { code: 'PORTLANOUVELLE', subtotal: 30 });
check('code livraison offerte', r.json.valid && r.json.freeShipping === true && r.json.discountAmount === 0);
r = await anon('POST', '/api/promos/validate', { code: 'INCONNU', subtotal: 100 });
check('code inconnu refusé', r.json.valid === false);
r = await admin('POST', '/api/promos', { code: 'unique1', discountType: 'FIXED_AMOUNT', discountValue: 5, maxUses: 1 });
check('création code promo', r.status === 201 && r.json.code === 'UNIQUE1');
const coupon = r.json;
r = await admin('POST', '/api/promos', { code: 'UNIQUE1', discountType: 'FIXED_AMOUNT', discountValue: 5 });
check('code en double refusé', r.status === 409);

console.log('\n== Commandes');
const stockBefore = (await anon('GET', `/api/products/${bague.slug}`)).json.stock;
const orderBody = {
  customerEmail: 'alice.test@example.fr',
  customerFirstName: 'Alice',
  customerLastName: 'Test',
  customerPhone: '06 00 00 00 00',
  shippingMethod: 'standard_delivery',
  shippingAddress: { address1: '1 rue du Port', postalCode: '11210', city: 'Port-la-Nouvelle' },
  items: [{ productId: bague.id, variantId: bague.variants[0].id, quantity: 1, unitPrice: 0.01, productName: 'Truqué' }],
  // Tentatives de triche : le serveur doit tout ignorer
  discountAmount: 999,
  shippingCost: 0,
  total: 0.01,
  status: 'DELIVERED',
};
r = await anon('POST', '/api/orders', orderBody);
check('commande créée', r.status === 201 && r.json.orderNumber, `status ${r.status} ${r.text.slice(0, 200)}`);
const order1 = r.json;
check('total recalculé par le serveur (29 + 4,90)', order1.total === 33.9, `total ${order1.total}`);
check("réponse sans données d'autres clientes", !('items' in order1) && Boolean(order1.accessToken));
let stored = readStore().orders.find((o) => o.orderNumber === order1.orderNumber);
check('prix unitaire issu du catalogue', stored.items[0].unitPrice === 29 && stored.items[0].productName === bague.name);
check('statut imposé par le serveur', stored.status === 'PAID' && stored.paymentMethod === 'simulation');
check('stock décompté', (await anon('GET', `/api/products/${bague.slug}`)).json.stock === stockBefore - 1);
check('numéro de commande cohérent', /^PCC-\d{4}-\d{6}$/.test(order1.orderNumber), order1.orderNumber);

r = await anon('POST', '/api/orders', { ...orderBody, items: [{ productId: bague.id, quantity: 99 }] });
check('quantité supérieure au stock refusée', r.status === 409, `status ${r.status} ${r.json?.error}`);
r = await anon('POST', '/api/orders', { ...orderBody, items: [] });
check('panier vide refusé', r.status === 400);
r = await anon('POST', '/api/orders', { ...orderBody, items: [{ productId: 'prod-inexistant', quantity: 1 }] });
check('produit inconnu refusé', r.status === 400);
r = await anon('POST', '/api/orders', { ...orderBody, customerEmail: 'pas-un-email' });
check('email invalide refusé', r.status === 400);
r = await anon('POST', '/api/orders', { ...orderBody, shippingAddress: { address1: 'x', postalCode: 'ABC', city: 'y' } });
check('code postal invalide refusé', r.status === 400);
r = await anon('POST', '/api/orders', { ...orderBody, promoCode: 'BIENVENUE10' });
check('code promo sous le minimum refusé à la commande', r.status === 400, `status ${r.status}`);

// Retrait + code promo à usage unique
r = await anon('POST', '/api/orders', {
  ...orderBody,
  shippingMethod: 'pickup',
  items: [{ productId: plastron.id, quantity: 1 }],
  promoCode: 'UNIQUE1',
});
check('commande retrait avec code fixe', r.status === 201 && r.json.total === 63, `total ${r.json?.total} ${r.json?.error || ''}`);
const order2 = r.json;
r = await anon('POST', '/api/orders', { ...orderBody, shippingMethod: 'pickup', items: [{ productId: plastron.id, quantity: 1 }], promoCode: 'UNIQUE1' });
check('code à usage unique épuisé', r.status === 400, `status ${r.status} ${r.json?.error}`);
// Livraison offerte au-dessus du seuil
r = await anon('POST', '/api/orders', { ...orderBody, items: [{ productId: plastron.id, quantity: 1 }] });
check('livraison offerte dès 60 €', r.status === 201 && r.json.total === 68, `total ${r.json?.total} ${r.json?.error || ''}`);
const order3 = r.json;
r = await anon('POST', '/api/orders', { ...orderBody, items: [{ productId: plastron.id, quantity: 1 }] });
check('pièce épuisée refusée', r.status === 409 || r.status === 400, `status ${r.status} ${r.json?.error}`);
r = await anon('GET', `/api/products/${plastron.slug}`);
check('produit épuisé toujours visible, marqué épuisé', r.status === 200 && r.json.stock === 0 && r.json.status === 'SOLD_OUT');

console.log('\n== Page de confirmation');
r = await anon('GET', `/checkout/succes?commande=${order1.orderNumber}&cle=${order1.accessToken}`);
check('confirmation avec la bonne clé', r.status === 200 && r.text.includes(order1.orderNumber) && r.text.includes('33,90'));
r = await anon('GET', `/checkout/succes?commande=${order1.orderNumber}&cle=fausse`);
check('confirmation refusée sans la clé', r.status === 200 && r.text.includes('Commande introuvable') && !r.text.includes('alice.test@example.fr'));

console.log('\n== Annulation et remise en stock');
const allOrders = (await admin('GET', '/api/orders')).json;
check('la gestionnaire voit toutes les commandes', allOrders.length >= 3);
const o3 = allOrders.find((o) => o.orderNumber === order3.orderNumber);
r = await admin('PUT', `/api/orders/${o3.id}`, { status: 'CANCELLED' });
check('annulation', r.status === 200 && r.json.status === 'CANCELLED');
r = await anon('GET', `/api/products/${plastron.slug}`);
check('stock remis et produit de nouveau en ligne', r.json.stock === 1 && r.json.status === 'PUBLISHED', `stock ${r.json.stock} ${r.json.status}`);
r = await admin('PUT', `/api/orders/${o3.id}`, { status: 'N_IMPORTE_QUOI' });
check('statut inconnu refusé', r.status === 400);
const o1 = allOrders.find((o) => o.orderNumber === order1.orderNumber);
r = await admin('PUT', `/api/orders/${o1.id}`, { trackingNumber: '6A12345678901', status: 'SHIPPED' });
check('expédition avec numéro de suivi', r.json.status === 'SHIPPED' && r.json.trackingNumber === '6A12345678901');
const o2 = allOrders.find((o) => o.orderNumber === order2.orderNumber);
r = await admin('PUT', `/api/orders/${o2.id}`, { status: 'CANCELLED' });
check('annulation : le code promo redevient disponible', readStore().coupons.find((c) => c.id === coupon.id).usesCount === 0);

console.log('\n== Comptes clientes');
r = await alice('POST', '/api/auth/register', { email: 'alice.test@example.fr', password: 'court', firstName: 'Alice', lastName: 'Test' });
check('mot de passe trop court refusé', r.status === 400);
r = await alice('POST', '/api/auth/register', { email: 'alice.test@example.fr', password: 'motdepasse-alice-1', firstName: 'Alice', lastName: 'Test' });
check('inscription', r.status === 201 && r.json.user.role === 'CLIENT');
r = await bob('POST', '/api/auth/register', { email: 'alice.test@example.fr', password: 'motdepasse-bob-123', firstName: 'Bob', lastName: 'Test' });
check('email déjà utilisé refusé', r.status === 409);
r = await bob('POST', '/api/auth/register', { email: 'bob.test@example.fr', password: 'motdepasse-bob-123', firstName: 'Bob', lastName: 'Test', role: 'ADMIN' });
check('inscription : impossible de se donner le rôle admin', r.status === 201 && r.json.user.role === 'CLIENT');
r = await alice('GET', '/api/orders');
check('Alice voit ses commandes passées en invitée', r.status === 200 && r.json.length === 3 && r.json.every((o) => o.customerEmail === 'alice.test@example.fr'), `len ${r.json?.length}`);
check('sans champs internes', r.json.every((o) => o.accessToken === undefined && o.adminNotes === undefined));
r = await bob('GET', '/api/orders');
check('Bob ne voit aucune commande des autres', r.status === 200 && r.json.length === 0);
r = await bob('GET', '/api/products?scope=admin');
check('une cliente ne peut pas lister les brouillons', r.status === 403);
r = await bob('POST', '/api/products', { name: 'Pirate', price: 1 });
check("une cliente ne peut pas créer de produit", r.status === 403);
r = await bob('GET', '/admin');
check('/admin interdit aux clientes', r.status === 307 && (r.headers.get('location') || '').includes('/compte'), `status ${r.status} ${r.headers.get('location')}`);
r = await alice('PUT', '/api/auth/me', { currentPassword: 'faux', newPassword: 'nouveau-mot-de-passe-2' });
check('changement de mot de passe : ancien requis', r.status === 403);
r = await alice('PUT', '/api/auth/me', { currentPassword: 'motdepasse-alice-1', newPassword: 'nouveau-mot-de-passe-2', phone: '07 11 22 33 44' });
check('changement de mot de passe', r.status === 200 && r.json.user.phone === '07 11 22 33 44');
r = await alice('GET', '/api/auth/me');
check('session conservée après changement', r.json.user?.email === 'alice.test@example.fr');
const alice2 = client();
r = await alice2('POST', '/api/auth/login', { email: 'alice.test@example.fr', password: 'motdepasse-alice-1' });
check('ancien mot de passe refusé', r.status === 401);
r = await alice2('POST', '/api/auth/login', { email: 'ALICE.test@example.fr', password: 'nouveau-mot-de-passe-2' });
check('nouveau mot de passe accepté (email insensible à la casse)', r.status === 200);
r = await alice('POST', '/api/auth/logout');
r = await alice('GET', '/api/auth/me');
check('déconnexion', r.json.user === null);
check("aucun mot de passe en clair dans le fichier de données", !fs.readFileSync(path.join(dataDir, 'store.json'), 'utf-8').includes('nouveau-mot-de-passe-2'));

console.log('\n== Contact et lettre d\'information');
r = await anon('POST', '/api/contact', { name: 'Zoé', email: 'zoe@example.fr', subject: 'Question', message: 'Bonjour <script>alert(1)</script>' });
check('message de contact accepté', r.status === 201);
r = await anon('POST', '/api/contact', { name: 'Robot', email: 'bot@example.fr', subject: 'Spam', message: 'spam', website: 'http://spam' });
check('robot (champ piège) : accepté en apparence', r.status === 201);
r = await anon('POST', '/api/contact', { name: '', email: 'x', subject: '', message: '' });
check('message incomplet refusé', r.status === 400);
r = await admin('GET', '/api/contact');
check('message enregistré, spam écarté', r.json.some((m) => m.name === 'Zoé') && !r.json.some((m) => m.name === 'Robot'));
const msg = r.json.find((m) => m.name === 'Zoé');
r = await admin('PATCH', '/api/contact', { id: msg.id, read: true });
check('message marqué lu', r.status === 200 && readStore().contactMessages.find((m) => m.id === msg.id).read === true);
r = await anon('POST', '/api/newsletter', { email: 'lectrice@example.fr' });
check('inscription lettre', r.status === 200);
r = await anon('POST', '/api/newsletter', { email: 'pas-un-email' });
check('email invalide refusé', r.status === 400);
check('abonnée enregistrée sur disque', readStore().newsletter.some((n) => n.email === 'lectrice@example.fr'));

console.log('\n== Contenus et réglages');
r = await admin('PUT', '/api/cms', { banner_announcement: 'Annonce de test', shipping_standard_price: '5,5', cle_inconnue: 'x', instagram_url: 'javascript:alert(1)' });
check('mise à jour des contenus', r.status === 200);
const cms = (await anon('GET', '/api/cms')).json;
check('prix de livraison normalisé', cms.shipping_standard_price === '5.50');
check('clé inconnue ignorée', !('cle_inconnue' in cms));
check('lien dangereux neutralisé', !cms.instagram_url.toLowerCase().startsWith('javascript:'), cms.instagram_url);
r = await anon('GET', '/');
check('bannière visible sur le site sans reconstruction', r.text.includes('Annonce de test'));
check('lien javascript absent du HTML', !r.text.includes('href="javascript:'));
r = await admin('PUT', '/api/cms', { shipping_standard_price: 'abc' });
check('montant invalide refusé', r.status === 400);
await admin('PUT', '/api/cms', { banner_announcement: "Retrait gratuit à la boutique L'Atelier à Port-la-Nouvelle • Livraison offerte dès 60 € d'achat", shipping_standard_price: '4.90', instagram_url: 'https://instagram.com' });
r = await admin('PUT', '/api/cms/hours', [{ id: 'h-1', dayGroup: 'Lundi', morningHours: '9 h - 12 h', afternoonHours: '', isClosed: false, sortOrder: 1 }]);
check('mise à jour des horaires', r.status === 200 && r.json.length === 1);
r = await anon('GET', '/contact');
check('horaires à jour sur la page contact', r.text.includes('9 h - 12 h'));
const seed = JSON.parse(fs.readFileSync(path.join(repo, 'data', 'seed.json'), 'utf-8'));
await admin('PUT', '/api/cms/hours', seed.hours);

console.log('\n== Envoi de photos');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
let fd = new FormData();
fd.append('file', new Blob([png], { type: 'image/png' }), 'Photo Été.png');
r = await admin('POST', '/api/upload', fd);
check('envoi PNG', r.status === 200 && /^\/uploads\/photo-ete-.*\.png$/.test(r.json.url), `${r.status} ${r.json?.url || r.text.slice(0, 100)}`);
const uploadedUrl = r.json.url;
r = await anon('GET', uploadedUrl);
check('photo servie', r.status === 200 && r.headers.get('content-type') === 'image/png', `status ${r.status} ${r.headers.get('content-type')}`);
{
  // Les photos envoyées passent par le même redimensionnement que celles du site.
  const res = await fetch(`${base}/_next/image?url=${encodeURIComponent(basePath + uploadedUrl)}&w=640&q=75`, { headers: { accept: 'image/avif,image/webp,*/*' } });
  await res.arrayBuffer();
  check('photo envoyée redimensionnée comme les autres', res.status === 200 && (res.headers.get('content-type') || '').startsWith('image/'), `${res.status} ${res.headers.get('content-type')}`);
}
fd = new FormData();
fd.append('file', new Blob(['<html><script>alert(1)</script></html>'], { type: 'image/jpeg' }), 'piege.jpg');
r = await admin('POST', '/api/upload', fd);
check('faux fichier image refusé', r.status === 400);
fd = new FormData();
fd.append('file', new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: 'image/svg+xml' }), 'piege.svg');
r = await admin('POST', '/api/upload', fd);
check('SVG refusé', r.status === 400);
r = await anon('GET', '/uploads/..%2F..%2Fpackage.json');
check('pas de sortie du dossier des photos', r.status === 404 || r.status === 400, `status ${r.status}`);
r = await anon('GET', '/uploads/%2e%2e/%2e%2e/.env.local');
check('pas de lecture de fichiers sensibles', r.status === 404 || r.status === 400, `status ${r.status}`);
r = await admin('DELETE', `/api/upload?name=${uploadedUrl.split('/').pop()}`);
check('suppression de la photo', r.status === 200);
r = await admin('DELETE', '/api/upload?name=../../package.json');
check('suppression hors dossier refusée', r.status === 400);

console.log('\n== Statistiques');
await anon('POST', '/api/analytics/track', { event: 'page_view', referrer: 'https://www.instagram.com/' });
await anon('POST', '/api/analytics/track', { event: 'product_view', slug: pivoine.slug });
r = await admin('GET', '/api/analytics?days=7');
check('rapport réel', r.status === 200 && r.json.totalVisitors >= 1 && r.json.pageViews >= 1 && r.json.totalOrders >= 1, JSON.stringify({ v: r.json.totalVisitors, p: r.json.pageViews, o: r.json.totalOrders }));
check('provenance Instagram comptée', r.json.trafficSources.some((s) => s.name === 'Instagram'));
check('chiffre d\'affaires = commandes non annulées', Math.abs(r.json.totalRevenue - 33.9) < 0.001, `CA ${r.json.totalRevenue}`);
r = await admin('GET', '/api/admin/status');
check('état technique', r.status === 200 && r.json.stripeConfigured === false && r.json.emailLogs.length > 0);
const expectedMailStatus = r.json.smtpConfigured ? 'SENT' : 'NOT_CONFIGURED';
check('emails journalisés avec le bon statut (' + expectedMailStatus + ')', r.json.emailLogs.every((l) => l.status === expectedMailStatus), JSON.stringify(r.json.emailLogs.map((l) => l.status)));
check('email d\'expédition journalisé', r.json.emailLogs.some((l) => l.template === 'ORDER_SHIPPED'));

console.log('\n== Mode de paiement');
r = await admin('PUT', '/api/cms', { stripe_sim_mode: 'false' });
r = await anon('GET', '/api/settings');
check('sans Stripe ni démonstration : commande fermée', r.json.paymentMode === 'disabled');
r = await anon('POST', '/api/orders', { ...orderBody, items: [{ productId: pivoine.id, quantity: 1 }] });
check('commande refusée proprement', r.status === 503 && /pas encore ouverte/.test(r.json.error), `${r.status} ${r.json?.error}`);
await admin('PUT', '/api/cms', { stripe_sim_mode: 'true' });

console.log('\n== Pages');
for (const url of ['/', '/boutique', '/boutique?filtre=nouveautes', '/boutique/bagues', '/collections/esprit-marin', '/collections', '/a-propos', '/contact', '/connexion', '/inscription', '/mot-de-passe-oublie', '/reinitialisation?jeton=x', '/checkout', '/compte/favoris', '/mentions-legales', '/cgv', '/confidentialite', '/cookies', `/produit/${pivoine.slug}`, '/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/icon.svg', '/apple-icon.png', '/favicon.ico']) {
  r = await anon('GET', url);
  check(`GET ${url}`, r.status === 200, `status ${r.status}`);
}
r = await anon('GET', '/produit/inexistant');
check('produit inexistant : 404', r.status === 404);
r = await anon('GET', '/page-inexistante');
check('page inexistante : 404', r.status === 404);
r = await anon('GET', `/produit/${pivoine.slug}`);
check('fiche produit rendue côté serveur avec titre et données structurées', r.text.includes(`<title>${pivoine.name.replace(/&/g, '&amp;')}`) && r.text.includes('application/ld+json'), r.text.match(/<title>[^<]*/)?.[0]);
r = await anon('GET', '/sitemap.xml');
check('sitemap avec les produits', r.text.includes(`/produit/${pivoine.slug}`));
for (const url of ['/admin', '/admin/commandes', '/admin/produits', '/admin/categories', '/admin/stocks', '/admin/clients', '/admin/messages', '/admin/promos', '/admin/cms', '/admin/horaires', '/admin/analytics', '/admin/parametres']) {
  r = await admin('GET', url);
  check(`GET ${url} (gestionnaire)`, r.status === 200, `status ${r.status}`);
}

console.log('\n== Référencement');
const metaContent = (html, key) => {
  const tag = html.match(new RegExp(`<meta[^>]+(?:name|property)="${key}"[^>]*>`, 'i'));
  const value = tag && tag[0].match(/content="([^"]*)"/i);
  return value ? value[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'") : null;
};
const canonicalOf = (html) => {
  const tag = html.match(/<link[^>]+rel="canonical"[^>]*>/i);
  const value = tag && tag[0].match(/href="([^"]*)"/i);
  return value ? value[1] : null;
};
const titleOf = (html) => ((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
const jsonLd = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const typesOf = (html) => jsonLd(html).map((d) => d['@type']);

r = await anon('GET', '/');
check('accueil : titre court avec le lieu', titleOf(r.text).includes('Port-la-Nouvelle') && titleOf(r.text).length <= 65, titleOf(r.text));
check('accueil : description entre 120 et 160 caractères', (metaContent(r.text, 'description') || '').length >= 120 && (metaContent(r.text, 'description') || '').length <= 160);
check('accueil : adresse canonique', canonicalOf(r.text) === base, String(canonicalOf(r.text)));
check('accueil : boutique locale et site décrits', typesOf(r.text).includes('JewelryStore') && typesOf(r.text).includes('WebSite'), typesOf(r.text).join(','));
{
  const store = jsonLd(r.text).find((d) => d['@type'] === 'JewelryStore');
  check('boutique : adresse, horaires, pas de téléphone factice', store.address.postalCode === '11210' && store.openingHoursSpecification.length >= 4 && !('telephone' in store), JSON.stringify(store.openingHoursSpecification).slice(0, 120));
  const monday = store.openingHoursSpecification.find((spec) => spec.dayOfWeek.includes('Monday'));
  check('horaires convertis (lundi 10:00 à 12:00)', monday && monday.opens === '10:00' && monday.closes === '12:00', JSON.stringify(monday));
  const saturday = store.openingHoursSpecification.filter((spec) => spec.dayOfWeek.includes('Saturday'));
  check('plage de jours comprise (mercredi à samedi, jusqu\'à 18:30)', saturday.some((spec) => spec.closes === '18:30') && saturday[0].dayOfWeek.length === 4, JSON.stringify(saturday));
}
check('accueil : image de partage', (metaContent(r.text, 'og:image') || '').endsWith('/images/partage.jpg') && metaContent(r.text, 'twitter:card') === 'summary_large_image');
check('accueil : photos optimisées', !/<img(?![^>]*data-nimg)[^>]*src="\/images/.test(r.text) && r.text.includes('/_next/image?url='));

r = await anon('GET', '/boutique/bagues');
check('rayon : titre et adresse canonique propres', titleOf(r.text).startsWith('Bagues') && canonicalOf(r.text) === `${base}/boutique/bagues`, `${titleOf(r.text)} | ${canonicalOf(r.text)}`);
check('rayon : fil d\'Ariane et liste de créations', typesOf(r.text).includes('BreadcrumbList') && typesOf(r.text).includes('ItemList'));
check('rayon : un seul titre principal', (r.text.match(/<h1/g) || []).length === 1);
r = await anon('GET', '/boutique?categorie=bagues');
check('ancienne adresse de rayon redirigée définitivement', r.status === 308 && (r.headers.get('location') || '').endsWith('/boutique/bagues'), `${r.status} ${r.headers.get('location')}`);
r = await anon('GET', '/boutique?collection=esprit-marin');
check('ancienne adresse de collection redirigée', r.status === 308 && (r.headers.get('location') || '').endsWith('/collections/esprit-marin'));
r = await anon('GET', '/boutique/rayon-inexistant');
check('rayon inexistant : 404', r.status === 404);
r = await anon('GET', '/collections/collection-inexistante');
check('collection inexistante : 404', r.status === 404);

r = await anon('GET', `/produit/${pivoine.slug}`);
{
  const product = jsonLd(r.text).find((d) => d['@type'] === 'Product');
  check('produit : prix, disponibilité, livraison et retour décrits', product && product.offers.price === '34.00' && product.offers.shippingDetails && product.offers.hasMerchantReturnPolicy.merchantReturnDays === 14, JSON.stringify(product && product.offers).slice(0, 160));
  check('produit : ni note ni avis inventés', product && !('aggregateRating' in product) && !('review' in product));
  check('produit : fil d\'Ariane avec le rayon', jsonLd(r.text).some((d) => d['@type'] === 'BreadcrumbList' && d.itemListElement.length === 4));
  check('produit : adresse canonique et image de partage', canonicalOf(r.text) === `${base}/produit/${pivoine.slug}` && Boolean(metaContent(r.text, 'og:image')));
}

r = await anon('GET', '/contact');
check('contact : questions fréquentes décrites', typesOf(r.text).includes('FAQPage') && r.text.includes('Questions fréquentes'));
r = await anon('GET', '/connexion');
check('connexion : non indexée', /noindex/.test(metaContent(r.text, 'robots') || ''));
r = await anon('GET', '/boutique');
check('boutique : indexable', !/noindex/.test(metaContent(r.text, 'robots') || '') && canonicalOf(r.text) === `${base}/boutique`);

{
  // Chaque page publique a un titre et une description à elle, de la bonne longueur pour les résultats de recherche.
  const titles = new Map();
  for (const url of ['/', '/boutique', '/collections', '/a-propos', '/contact', '/cgv', '/boutique/bagues', '/collections/esprit-marin', ...products.map((p) => `/produit/${p.slug}`)]) {
    const page = await anon('GET', url);
    if (page.status !== 200) continue; // création supprimée ou masquée plus haut dans les tests
    const title = titleOf(page.text);
    const description = metaContent(page.text, 'description') || '';
    check(`titre et description de ${url}`, title.length >= 20 && title.length <= 65 && description.length >= 70 && description.length <= 160 && !titles.has(title), `${title.length}c "${title}" / description ${description.length}c${titles.has(title) ? ` / même titre que ${titles.get(title)}` : ''}`);
    titles.set(title, url);
  }
}

r = await anon('GET', '/sitemap.xml');
check('sitemap : rayons, collections et photos', r.text.includes('/boutique/bagues</loc>') && r.text.includes('/collections/esprit-marin</loc>') && r.text.includes('<image:loc>'));
check('sitemap : pas de page privée', !/\/(admin|compte|checkout|connexion)/.test(r.text));
r = await anon('GET', '/robots.txt');
check('robots.txt : sitemap déclaré, administration exclue', /Sitemap: .*\/sitemap\.xml/.test(r.text) && r.text.includes(`Disallow: ${basePath}/admin`));

{
  const res = await fetch(`${base}/_next/image?url=${encodeURIComponent(`${basePath}/images/bagues.jpg`)}&w=640&q=75`, { headers: { accept: 'image/avif,image/webp,*/*' } });
  const size = (await res.arrayBuffer()).byteLength;
  check('photo redimensionnée et convertie (moins de 150 Ko)', res.status === 200 && /image\/(avif|webp)/.test(res.headers.get('content-type') || '') && size < 150_000, `${res.status} ${res.headers.get('content-type')} ${size}`);
}

console.log('\n== Signature du studio');
{
  const maker = 'https://ocdigital.cloud/';
  const linksTo = (html) => [...html.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]).filter((tag) => tag.includes(`href="${maker}"`));
  r = await anon('GET', '/');
  const footerLinks = linksTo(r.text);
  check('pied de page : « Site réalisé par » avec le logo et le lien du studio', footerLinks.length === 1 && r.text.includes('Site réalisé par') && r.text.includes('<circle cx="96" cy="120" r="44"'), `${footerLinks.length} lien(s)`);
  check('lien du studio : nouvel onglet, sans accès à la page d\'origine', footerLinks.every((tag) => tag.includes('target="_blank"') && /rel="[^"]*noopener/.test(tag)), footerLinks.join(' '));
  const site = jsonLd(r.text).find((d) => d['@type'] === 'WebSite');
  check('données structurées : studio déclaré comme réalisateur du site', site && site.creator && site.creator.name === 'Oc’Digital' && site.creator.url === maker && Boolean(site.publisher && site.publisher['@id']), JSON.stringify(site && site.creator));
  r = await anon('GET', '/mentions-legales');
  check('mentions légales : conception et réalisation', r.text.includes('Conception et réalisation') && r.text.includes('conçu et réalisé par') && linksTo(r.text).length >= 2);
  r = await admin('GET', '/admin');
  check('administration : signature du studio', linksTo(r.text).length >= 1 && r.text.includes('Site réalisé par'));
}

console.log('\n== Mise en production');
r = await anon('GET', '/api/health');
check('point de contrôle de santé', r.status === 200 && r.json.status === 'ok');
r = await admin('GET', '/api/admin/status');
check('contrôle de mise en ligne disponible', Array.isArray(r.json.checklist) && r.json.checklist.length >= 8);
{
  const byId = Object.fromEntries(r.json.checklist.map((item) => [item.id, item]));
  check('contrôle : paiement, emails et mentions légales signalés à régler', !byId.paiement.ok && !byId.emails.ok && !byId.legal.ok);
  check('contrôle : créations d\'exemple signalées', !byId.catalogue.ok && /exemple/.test(byId.catalogue.detail));
}
await admin('PUT', '/api/cms', { legal_owner: 'Claire Exemple', legal_siret: '000 000 000 00000', legal_host: 'Hébergeur Exemple, 1 rue du Test, 75000 Paris' });
r = await admin('GET', '/api/admin/status');
check('contrôle : mentions légales validées une fois remplies', r.json.checklist.find((item) => item.id === 'legal').ok === true);
r = await anon('GET', '/mentions-legales');
check('mentions légales alimentées par l\'administration', r.text.includes('Claire Exemple') && r.text.includes('000 000 000 00000'));
r = await anon('GET', '/');
check('en-tête technique masqué', !r.headers.get('x-powered-by'));

console.log(`\n${passed} réussis, ${failed} échoués`);
if (failed) console.error(serverLog.slice(-1500));
process.exit(failed ? 1 : 0);
