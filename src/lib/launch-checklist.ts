import fs from 'fs';
import path from 'path';
import { isSmtpConfigured } from './mailer';
import { isStripeConfigured, isStripeWebhookConfigured } from './payment-mode';
import { SITE_NOINDEX, realPhone, socialProfileUrl } from './seo';
import { SITE_ORIGIN } from './site';
import { DATA_DIR, store } from './store';

export interface ChecklistItem {
  id: string;
  label: string;
  ok: boolean;
  /** Ce qu'il reste à faire, ou ce qui est en place. */
  detail: string;
  /** Page de l'administration où régler le point, s'il se règle dans le site. */
  href?: string;
  /** Vrai si le point bloque une vraie mise en vente (les autres sont des améliorations). */
  blocking: boolean;
}

// Identifiants des créations d'exemple livrées dans data/seed.json.
const SEED_PRODUCT_IDS = ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6'];

function lastBackup(): string | null {
  const dir = process.env.BACKUP_DIR ? path.resolve(process.env.BACKUP_DIR) : path.join(process.cwd(), 'backups');
  try {
    const entries = fs.readdirSync(dir).filter((name) => /^\d{4}-\d{2}-\d{2}/.test(name)).sort();
    return entries.length > 0 ? entries[entries.length - 1] : null;
  } catch {
    return null;
  }
}

/**
 * Contrôle de mise en ligne : tout ce qui doit être réglé avant de vendre pour de vrai.
 * Affiché dans l'administration, calculé à partir de la configuration réelle du serveur.
 */
export async function getLaunchChecklist(): Promise<ChecklistItem[]> {
  const [cms, products] = await Promise.all([store.getCmsSettings(), store.getProducts()]);
  const filled = (key: string) => Boolean(cms[key]?.trim());
  const demoMode = cms.stripe_sim_mode !== 'false';
  const stripe = isStripeConfigured();
  const webhook = isStripeWebhookConfigured();
  const https = SITE_ORIGIN.startsWith('https://') && !/localhost|127\.0\.0\.1/.test(SITE_ORIGIN);
  const authSecret = Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);
  const provisionalPassword = fs.existsSync(path.join(DATA_DIR, 'admin-initial-password.txt'));
  const seedProducts = products.filter((p) => SEED_PRODUCT_IDS.includes(p.id)).length;
  const online = products.filter((p) => p.status === 'PUBLISHED').length;
  const legalMissing = [
    ['legal_owner', "nom de l'exploitant"],
    ['legal_siret', 'SIRET'],
    ['legal_host', 'hébergeur'],
  ]
    .filter(([key]) => !filled(key))
    .map(([, label]) => label);
  const backup = lastBackup();

  return [
    {
      id: 'url',
      label: 'Adresse du site',
      ok: https,
      detail: https
        ? `Le site est déclaré sur ${SITE_ORIGIN}.`
        : `APP_URL vaut ${SITE_ORIGIN} : à remplacer par l'adresse https définitive dans le fichier .env, puis reconstruire le site.`,
      blocking: true,
    },
    {
      id: 'paiement',
      label: 'Paiement par carte',
      ok: stripe && webhook && !demoMode,
      detail: !stripe
        ? 'Clé Stripe absente (STRIPE_SECRET_KEY dans le .env). La boutique reste en mode démonstration.'
        : !webhook
        ? 'Webhook Stripe absent (STRIPE_WEBHOOK_SECRET dans le .env) : les paiements ne seraient pas confirmés automatiquement.'
        : demoMode
        ? 'Stripe est prêt. Il reste à couper le mode démonstration.'
        : 'Stripe est branché et le mode démonstration est coupé.',
      href: '/admin/parametres',
      blocking: true,
    },
    {
      id: 'emails',
      label: 'Envoi des emails',
      ok: isSmtpConfigured(),
      detail: isSmtpConfigured()
        ? 'Les confirmations de commande et les messages de contact partent par email.'
        : 'Aucun serveur SMTP configuré (SMTP_HOST, SMTP_USER, SMTP_PASSWORD dans le .env) : les clientes ne reçoivent aucun email.',
      href: '/admin/parametres',
      blocking: true,
    },
    {
      id: 'legal',
      label: 'Mentions légales',
      ok: legalMissing.length === 0,
      detail:
        legalMissing.length === 0
          ? "L'exploitant, le SIRET et l'hébergeur sont renseignés."
          : `À renseigner : ${legalMissing.join(', ')}.`,
      href: '/admin/cms',
      blocking: true,
    },
    {
      id: 'catalogue',
      label: 'Catalogue',
      ok: online > 0 && seedProducts === 0,
      detail:
        seedProducts > 0
          ? `${seedProducts} création${seedProducts > 1 ? 's' : ''} d'exemple encore dans le catalogue : à remplacer par les vraies créations et leurs photos.`
          : online === 0
          ? "Aucune création en ligne pour l'instant."
          : `${online} création${online > 1 ? 's' : ''} en ligne.`,
      href: '/admin/produits',
      blocking: true,
    },
    {
      id: 'coordonnees',
      label: 'Coordonnées de la boutique',
      ok: Boolean(realPhone(cms.contact_phone)) && filled('contact_street'),
      detail: !realPhone(cms.contact_phone)
        ? "Le téléphone affiché est encore celui d'exemple : à remplacer par le vrai, ou à vider."
        : !filled('contact_street')
        ? "L'adresse (numéro et rue) n'est pas renseignée : elle aide les moteurs de recherche à situer la boutique."
        : 'Téléphone et adresse sont renseignés.',
      href: '/admin/cms',
      blocking: false,
    },
    {
      id: 'reseaux',
      label: 'Réseaux sociaux',
      ok: Boolean(socialProfileUrl(cms.instagram_url) || socialProfileUrl(cms.facebook_url)),
      detail:
        socialProfileUrl(cms.instagram_url) || socialProfileUrl(cms.facebook_url)
          ? 'Au moins un profil est relié au site.'
          : 'Aucun vrai profil Instagram ou Facebook renseigné : les icônes ne sont pas affichées.',
      href: '/admin/cms',
      blocking: false,
    },
    {
      id: 'indexation',
      label: 'Visibilité sur Google',
      ok: !SITE_NOINDEX,
      detail: SITE_NOINDEX
        ? "SITE_NOINDEX=true : le site demande aux moteurs de recherche de ne pas l'indexer. À retirer du .env pour le vrai site."
        : 'Le site autorise son indexation et publie son plan (sitemap.xml).',
      blocking: false,
    },
    {
      id: 'securite',
      label: 'Sécurité du compte gestionnaire',
      ok: authSecret && !provisionalPassword,
      detail: provisionalPassword
        ? 'Le fichier du mot de passe provisoire existe encore dans le dossier de données : changez le mot de passe puis supprimez ce fichier.'
        : !authSecret
        ? "AUTH_SECRET n'est pas défini dans le .env : une clé de secours est utilisée. À définir pour un serveur de production."
        : 'Clé de session définie, pas de mot de passe provisoire en attente.',
      href: '/admin/parametres',
      blocking: false,
    },
    {
      id: 'sauvegarde',
      label: 'Sauvegardes',
      ok: Boolean(backup),
      detail: backup
        ? `Dernière sauvegarde : ${backup}.`
        : 'Aucune sauvegarde trouvée. Lancer "npm run backup" et le programmer chaque nuit (voir le guide de mise en ligne).',
      blocking: false,
    },
  ];
}
