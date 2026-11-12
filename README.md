# Les P'tites Créa de Claire, boutique L'Atelier (Port-la-Nouvelle)

Boutique en ligne de bijoux artisanaux avec son espace d'administration : catalogue, panier, commande avec retrait en boutique ou livraison Colissimo, comptes clientes, codes promo, horaires et textes modifiables sans toucher au code.

Pour mettre le site en ligne pas à pas, suivre [MISE-EN-LIGNE.md](MISE-EN-LIGNE.md). Ce README sert de référence technique.

## Ce que contient le site

Côté boutique :

- accueil, boutique avec filtres (collection, prix, nouveautés, stock), une page par rayon et par collection, fiches produits, page atelier, contact, horaires et questions fréquentes ;
- panier conservé dans le navigateur, codes promo, livraison offerte à partir d'un seuil réglable ;
- commande en trois étapes, avec ou sans compte, puis page de confirmation ;
- compte cliente : commandes, suivi Colissimo, profil, mot de passe oublié.

Côté administration (`/admin`, réservé au compte gestionnaire) :

- tableau de bord et statistiques calculés à partir des vraies commandes et des visites mesurées par le site ;
- commandes (statuts, numéro de suivi, bordereau, remise en stock à l'annulation), produits et photos, rayons, collections, stocks ;
- clientes, abonnées à la lettre d'information, messages du formulaire de contact ;
- codes promo, textes du site, informations légales, horaires, frais de port, mode de paiement, journal des emails ;
- contrôle de mise en ligne : la liste de ce qu'il reste à régler avant de vendre pour de vrai.

## Technique

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
- Données dans un fichier JSON (`data/store.json`), sans base de données à installer.
- Sessions par cookie signé `httpOnly`, mots de passe hachés (bcrypt).
- Paiement par carte via Stripe Checkout, emails via SMTP (nodemailer).

Le dossier `prisma/` (schéma MySQL et script d'amorçage) vient d'une première version du projet. Il n'est pas branché : le site n'utilise pas MySQL. Il est conservé comme base pour une éventuelle migration.

## Lancer le site en local

```bash
npm install
```

```bash
cp .env.example .env.local
```

Renseigner au minimum `ADMIN_PASSWORD` dans `.env.local`, puis :

```bash
npm run dev
```

Le site est sur http://localhost:3000 (ou le port passé avec `npm run dev -- --port 3015`). Au premier démarrage, `data/store.json` est créé à partir de `data/seed.json` (catalogue d'exemple, aucune commande).

## Vérifications et tests

```bash
npm run check
```

Cette commande enchaîne les quatre vérifications, qu'on peut aussi lancer une par une : `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.

Les tests de bout en bout (`scripts/e2e-test.mjs`) démarrent le site construit sur un port libre, avec un dossier de données temporaire créé à partir de `data/seed.json`. Ils ne touchent jamais aux vraies données, n'envoient aucun email et n'appellent pas Stripe. Ils couvrent les droits d'accès, les commandes, le stock, les codes promo, les comptes, l'envoi de photos, les statistiques, le référencement et le contrôle de mise en ligne.

Les mêmes vérifications tournent sur GitHub à chaque envoi de code (`.github/workflows/ci.yml`).

## Configuration (.env)

| Variable | Rôle |
| --- | --- |
| `APP_URL` | Adresse publique du site, sans barre finale. Sert aux liens des emails, au sitemap et aux retours de paiement. |
| `NEXT_PUBLIC_BASE_PATH` | Sous-dossier de déploiement (ex. `/lpc`). Vide pour un site à la racine. À définir avant `npm run build`. |
| `PORT` | Port local de Next.js (3015 dans la configuration PM2 et Apache fournie). |
| `DATA_DIR` | Dossier des données. Par défaut `./data`. |
| `AUTH_SECRET` | Clé de signature des sessions, 32 caractères minimum. Sans elle, une clé est créée dans `DATA_DIR/.auth-secret`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Compte gestionnaire créé à la première connexion. `ADMIN_EMAIL` reçoit aussi les avis de commande et les messages de contact. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Paiement par carte. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Envoi des emails. |
| `GOOGLE_SITE_VERIFICATION` | Code de validation Google Search Console. |
| `SITE_NOINDEX` | `true` sur une démo ou une préproduction : le site demande aux moteurs de recherche de ne rien indexer. Vide sur le vrai site. |
| `BACKUP_DIR`, `BACKUP_KEEP` | Dossier des sauvegardes (par défaut `./backups`) et nombre de sauvegardes conservées (par défaut 14). |

`APP_URL` et `NEXT_PUBLIC_BASE_PATH` sont lus au moment du build : après les avoir changés, relancer `npm run build`. Les autres variables sont prises en compte au redémarrage du site.

Le fichier `.env` ne doit jamais être versionné.

## Données et sauvegardes

- `data/seed.json` : catalogue de départ, versionné.
- `data/store.json` : données vivantes (produits, commandes, comptes, textes). Créé au premier démarrage, non versionné.
- `data/store.backup.json` : version précédente, réécrite à chaque enregistrement.
- `data/analytics.json` : compteurs de visites par jour.
- `public/uploads/` : photos envoyées depuis l'administration, non versionnées.

Créer une sauvegarde datée des données et des photos envoyées :

```bash
npm run backup
```

La commande garde les 14 dernières sauvegardes et supprime les plus anciennes. À programmer chaque nuit sur le serveur, par exemple avec `crontab -e` :

```
0 3 * * * cd /var/www/ptites-crea-claire && npm run backup >> /var/log/ptites-crea-claire-backup.log 2>&1
```

Les sauvegardes restent sur le serveur : en recopier une de temps en temps ailleurs (autre machine, espace de stockage) protège aussi d'une panne du serveur.

Voir les sauvegardes disponibles :

```bash
npm run backup -- liste
```

Restaurer une sauvegarde : arrêter le site (`pm2 stop ptites-crea-claire`), lancer la commande ci-dessous avec le nom de la sauvegarde, puis redémarrer le site. L'état présent avant la restauration est mis de côté dans le dossier des sauvegardes.

```bash
npm run backup -- restaurer 2026-11-10_03-00-00
```

Le site doit tourner dans un seul processus Node (c'est le cas de la configuration PM2 fournie) : le fichier de données n'est pas prévu pour plusieurs instances en parallèle.

## Contrôle de mise en ligne et surveillance

Le tableau de bord et la page Paramètres de l'administration affichent le contrôle de mise en ligne : adresse du site, paiement, emails, mentions légales, catalogue, coordonnées, réseaux sociaux, indexation, sécurité du compte et sauvegardes. Chaque point indique ce qu'il reste à faire et où le régler. La carte disparaît du tableau de bord quand tout est en place.

`/api/health` répond `200` avec `{"status":"ok"}` quand le site lit ses données et peut écrire dans son dossier, `503` sinon. Cette adresse peut être donnée à un service de surveillance pour être prévenu en cas de panne.

## Référencement

Ce qui est en place, sans réglage à faire :

- une adresse propre par rayon (`/boutique/bagues`) et par collection (`/collections/esprit-marin`), les anciennes adresses avec paramètres sont redirigées définitivement ;
- titre, description, adresse canonique et image de partage pour chaque page, pages privées (compte, panier, connexion, administration) exclues de l'indexation ;
- données structurées lues par Google : boutique locale avec adresse et horaires, produits avec prix, disponibilité, livraison et retour, fil d'Ariane, listes de créations, questions fréquentes ;
- `sitemap.xml` avec les rayons, les collections, les produits et leurs photos, `robots.txt`, icônes et fiche d'application ;
- photos redimensionnées et converties à la demande (AVIF ou WebP), chargées quand elles approchent de l'écran ;
- redirection de la variante avec ou sans `www` vers l'adresse de `APP_URL`, quand celle-ci est en https.

Les données structurées reprennent les textes, les horaires et les réglages de l'administration : les tenir à jour suffit. Aucune note ni aucun avis n'est inventé.

L'image de partage et les icônes sont produites par `npm run assets:brand` (à relancer seulement si l'identité visuelle change).

Ce qui se fait hors du site (Google Search Console, fiche d'établissement Google) est décrit dans [MISE-EN-LIGNE.md](MISE-EN-LIGNE.md).

## Compte gestionnaire

Le compte est créé à la première tentative de connexion sur `/connexion`, avec `ADMIN_EMAIL` et `ADMIN_PASSWORD`. Sans `ADMIN_PASSWORD`, un mot de passe provisoire est écrit dans `data/admin-initial-password.txt` : le changer dans Administration > Paramètres, puis supprimer ce fichier.

Mot de passe perdu : sur le serveur, dans le dossier du projet,

```bash
npm run admin:password
```

## Paiement

Le réglage se fait dans Administration > Paramètres, qui affiche aussi l'état des branchements.

- Mode démonstration activé (réglage de départ) : les commandes sont enregistrées et le stock décompté, mais aucune carte n'est débitée. Le site l'indique clairement à la cliente.
- Mode démonstration coupé et clé Stripe présente : la cliente est envoyée sur la page de paiement Stripe. La commande reste « paiement en attente » jusqu'à la confirmation de Stripe, puis passe en « payée ». Un paiement abandonné annule la commande et libère le stock.
- Mode démonstration coupé sans clé Stripe : la commande en ligne est fermée.

Pour activer Stripe :

1. Mettre `STRIPE_SECRET_KEY` dans `.env`.
2. Dans le tableau de bord Stripe, créer un webhook vers `APP_URL/api/stripe/webhook` avec les événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` et `checkout.session.expired`.
3. Mettre la clé de signature du webhook dans `STRIPE_WEBHOOK_SECRET`.
4. Redémarrer le site, puis couper le mode démonstration dans Administration > Paramètres.

Faire une commande d'essai avec les clés de test Stripe avant de passer en clés réelles.

## Emails

Sans SMTP configuré, aucun email ne part : chaque email apparaît « non envoyé » dans Administration > Paramètres. Une fois `SMTP_*` renseigné, le site envoie la confirmation de commande, l'avis à la boutique, les changements de statut (validée, prête au retrait, expédiée avec lien de suivi, annulée, remboursée), les messages du formulaire de contact et les liens de réinitialisation de mot de passe.

## Déploiement sur le VPS

Le site cohabite avec d'autres projets : port dédié `3015`, processus PM2 nommé `ptites-crea-claire`, fichier Apache séparé. Ne jamais lancer `pm2 delete all`.

```bash
cd /var/www/ptites-crea-claire
```

```bash
cp .env.example .env
```

Remplir `.env`, puis :

```bash
npm ci
```

```bash
npm run build
```

```bash
pm2 start ecosystem.config.js
```

```bash
pm2 save
```

Apache (proxy vers le port 3015) :

```bash
sudo a2enmod proxy proxy_http headers rewrite ssl
```

```bash
sudo cp apache/ptites-crea-claire.conf /etc/apache2/sites-available/ptites-crea-claire.conf
```

```bash
sudo a2ensite ptites-crea-claire.conf
```

```bash
sudo apache2ctl configtest
```

Ne recharger Apache que si la commande précédente répond `Syntax OK` :

```bash
sudo systemctl reload apache2
```

Certificat HTTPS (Certbot crée lui-même la partie SSL et la redirection vers https) :

```bash
sudo certbot --apache -d lesptitescreadeclaire.com -d www.lesptitescreadeclaire.com
```

## Mise à jour

```bash
git pull
```

```bash
npm ci
```

```bash
npm run build
```

```bash
pm2 restart ptites-crea-claire
```

Première mise à jour depuis l'ancienne version : `data/store.json` était versionné et ne l'est plus. Avant le `git pull`, copier le fichier ailleurs (`cp data/store.json ~/store.json.sauvegarde`), annuler ses modifications locales (`git checkout -- data`), faire le `git pull`, puis remettre le fichier en place (`cp ~/store.json.sauvegarde data/store.json`). Les anciens comptes de démonstration n'existent plus : se connecter avec le compte défini dans `.env`.

## Déploiement dans un sous-dossier

Pour servir le site sous `https://exemple.com/lpc` :

- `NEXT_PUBLIC_BASE_PATH="/lpc"` et `APP_URL="https://exemple.com"` dans `.env` avant le build ;
- dans Apache, `ProxyPass /lpc http://127.0.0.1:3015/lpc` et `ProxyPassReverse /lpc http://127.0.0.1:3015/lpc`.

## Passer d'une démo au domaine officiel (livraison client)

Pour basculer en direct le site depuis une adresse de démonstration (ex. `virtuose-social.com/lpc`) vers le domaine officiel de la cliente lors de la livraison chez elle :

```bash
npm run domaine
```

*(ou `bash scripts/configurer-domaine.sh`)*

Ce script interactif configure le nouveau domaine, supprime le sous-dossier `/lpc`, met à jour `.env` et Apache, reconstruit le site, redémarre PM2 et installe le certificat HTTPS Let's Encrypt. Voir la fiche mémo complète dans [LIVRAISON-DOMAINE.md](LIVRAISON-DOMAINE.md).

## Sécurité

- Toutes les routes d'administration (`/admin` et les routes `/api` qui modifient ou exposent des données) exigent une session gestionnaire.
- Les prix, remises et frais de port d'une commande sont recalculés par le serveur à partir du catalogue.
- Une cliente connectée ne voit que ses propres commandes.
- Les photos envoyées sont vérifiées (format réel du fichier, 10 Mo maximum, pas de SVG).
- Connexion, inscription, commande, contact et codes promo sont limités en nombre de tentatives.

## Réalisation

Site conçu et réalisé par [Oc’Digital](https://ocdigital.cloud/), studio de création et de gestion de sites web en Occitanie.

La signature « Site réalisé par Oc’Digital » apparaît en bas de chaque page de la boutique, dans les mentions légales et dans le menu de l'administration. Le nom et l'adresse du studio sont définis une seule fois, dans `src/lib/site.ts` (`SITE_MAKER`). Le logo (`src/components/brand/OcDigitalLogo.tsx`) reprend le fichier de référence du studio : ses couleurs et ses proportions ne se modifient pas.
