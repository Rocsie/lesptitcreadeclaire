# Les P'tites Créa de Claire • Boutique L'Atelier (Port-la-Nouvelle)

Site e-commerce artisanal d'art complet, sur-mesure et entièrement administrable, développé avec **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **MySQL / MariaDB**, et prêt pour un déploiement sécurisé avec **Apache2** et **PM2** sur VPS multi-projets.

---

## 🌸 Identité Graphique & Direction Artistique

L'univers visuel a été directement extrait et harmonisé à partir des supports de communication et affiches de la boutique **L'Atelier** à Port-la-Nouvelle :
- **Palette chromatique** : Crème ivoire (`#FDFBF7`), Rose poudré (`#E8B4B8`), Vieux rose (`#C87D88`), Bordeaux / Prune (`#6E2D4A`), Vert sauge (`#87A287`), Eucalyptus (`#4E6B5D`) et dorures discrètes (`#D4AF37`).
- **Mascotte officielle vectorielle** : La petite pieuvre souriante ornée de son cœur, emblème de la boutique.
- **Typographie** : Calligraphie manuscrite élégante pour les titres d'atelier (*Alex Brush / Cormorant Garamond*) et typographie moderne ultra-lisible pour les menus, prix, fiches et l'administration (*Plus Jakarta Sans*).

---

## 🛠️ Stack Technique

- **Frontend / Application** : Node.js, TypeScript, Next.js 16 (App Router), React 19, Tailwind CSS.
- **Base de données** : MySQL ou MariaDB.
- **ORM** : Prisma ORM (`prisma/schema.prisma` avec type `Decimal` pour les montants financiers).
- **Gestionnaire de processus** : PM2 (`ecosystem.config.js` dédié, application `ptites-crea-claire`).
- **Serveur web & Reverse Proxy** : Apache2 (`/etc/apache2/sites-available/ptites-crea-claire.conf` sur port local dédié `3015`).
- **Certificat SSL** : Let's Encrypt via Certbot.

---

## 🔒 Sécurité & Isolation VPS Multi-Sites

> **Règle absolue :** Ce projet est conçu pour cohabiter avec d'autres applications déjà en production sur votre VPS sans impacter aucun autre site.

1. **Port dédié** : L'application écoute sur `127.0.0.1:3015` (ou tout autre port libre configuré dans `.env`).
2. **Nom PM2 isolé** : L'instance est nommée `ptites-crea-claire`. Ne jamais exécuter `pm2 delete all`.
3. **Base de données dédiée** : Base `ptites_crea_claire` avec un utilisateur MySQL restreint uniquement à cette base.
4. **VirtualHost Apache séparé** : Fichier unique `ptites-crea-claire.conf` dans `/etc/apache2/sites-available/`.

---

## 🚀 Guide d'Installation sur le VPS

### 1. Cloner le projet dans son dossier dédié

```bash
cd /var/www
# git clone <votre-repo> ptites-crea-claire
cd /var/www/ptites-crea-claire
```

### 2. Configurer les variables d'environnement (`.env`)

Copiez l'exemple et complétez vos identifiants :
```bash
cp .env.example .env
nano .env
```

Vérifiez notamment :
```env
PORT=3015
DATABASE_URL="mysql://ptites_crea_user:VOTRE_MOT_DE_PASSE@127.0.0.1:3306/ptites_crea_claire"
APP_URL="https://lesptitescreadeclaire.fr"
AUTH_SECRET="une_chaine_aleatoire_securisee_de_32_caracteres_min"
```

### 3. Installer les dépendances Node.js

```bash
npm install
```

### 4. Générer le client Prisma & Déployer les tables MySQL

```bash
# Générer le client TypeScript
npx prisma generate

# Déployer les migrations sur la base MySQL
npx prisma migrate deploy

# (Optionnel) Peupler avec les données et photos de l'atelier
npm run prisma:seed
```

### 5. Compiler l'application pour la production

```bash
npm run build
```

---

## ⚙️ Configuration PM2

Lancez et sauvegardez l'application dans PM2 :

```bash
# Démarrer avec le fichier de configuration dédié
pm2 start ecosystem.config.js

# Enregistrer la liste PM2 pour redémarrer automatiquement en cas de reboot serveur
pm2 save
```

Commandes utiles au quotidien :
```bash
# Redémarrer l'application
pm2 restart ptites-crea-claire

# Voir les logs en direct
pm2 logs ptites-crea-claire

# Voir l'état des processus
pm2 status
```

---

## 🌐 Configuration Apache2 (Reverse Proxy)

### 1. Vérifier et activer les modules nécessaires

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod proxy_wstunnel
```

### 2. Copier le VirtualHost dédié

Le fichier pré-configuré se trouve dans `apache/ptites-crea-claire.conf`.

```bash
sudo cp apache/ptites-crea-claire.conf /etc/apache2/sites-available/ptites-crea-claire.conf
```

Éditez le fichier si vous devez ajuster votre nom de domaine :
```bash
sudo nano /etc/apache2/sites-available/ptites-crea-claire.conf
```

### 3. Activer le site et tester la syntaxe Apache

```bash
# Activer le site
sudo a2ensite ptites-crea-claire.conf

# Vérifier impérativement la syntaxe avant de recharger !
sudo apache2ctl configtest
```

Le retour doit impérativement afficher :
```text
Syntax OK
```

### 4. Recharger Apache en toute sécurité

```bash
sudo systemctl reload apache2
```

### 5. Activer le certificat SSL Let's Encrypt (HTTPS)

```bash
sudo certbot --apache -d lesptitescreadeclaire.fr -d www.lesptitescreadeclaire.fr
```

---

## 🔄 Procédure de Mise à Jour Future

Lors d'un futur déploiement ou mise à jour de code :

```bash
cd /var/www/ptites-crea-claire
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart ptites-crea-claire
```

---

## 👑 Accès à l'Administration de Claire

- **URL d'accès** : `/admin` ou `/connexion`
- **Email d'administration** : `admin@lesptitescreadeclaire.fr`
- **Mot de passe initial** : `claire2026!`
- **Compte cliente de test** : `sophie.martin@example.fr` / `client123!`

### Fonctionnalités disponibles dans `/admin` :
- **Dashboard** : CA du jour, de la semaine et du mois, graphiques de ventes, dernières commandes, alertes stocks faibles.
- **Commandes** : Gestion des 10 statuts avec réintégration automatique des stocks en cas d'annulation.
- **Produits** : Formulaire d'ajout/modification avec photos, références, variantes de couleurs et descriptifs.
- **Stocks** : Tableau d'inventaire avec ajustement rapide +/- et gestion du seuil d'alerte (&lt; 3 unités).
- **CMS sans code** : Modification en direct des textes, slogan Hero, horaires d'hiver/été et bannières.
- **Analytics** : Suivi des visiteuses, sources de trafic (Instagram, Facebook, Google) et entonnoir d'achat.
- **Codes promo** : Création de coupons en pourcentage, montant fixe ou livraison offerte.
- **Paramètres** : Configuration des frais de port et consultation du journal des e-mails envoyés.
