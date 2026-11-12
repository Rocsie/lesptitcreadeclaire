# Mise en ligne de la boutique

Ce guide accompagne la livraison du site. Il se suit dans l'ordre, de l'installation sur le serveur jusqu'aux premières ventes, puis décrit l'entretien courant. Le détail technique de chaque point est dans le [README](README.md).

> [!TIP]
> Si votre site tournait en version de démonstration (ex. sous `virtuose-social.com/lpc`), vous pouvez le faire basculer automatiquement sur le nom de domaine de la cliente en une seule commande avec `npm run domaine`. Suivez la fiche pratique [LIVRAISON-DOMAINE.md](LIVRAISON-DOMAINE.md).

Le site sait dire lui-même ce qu'il lui manque : l'administration affiche un **contrôle de mise en ligne** qui passe au vert point par point. Quand il est complet, la boutique est prête à vendre.

## 1. Ce qu'il faut avoir sous la main

| Élément | À quoi il sert |
| --- | --- |
| Le nom de domaine, pointé vers le serveur | Adresse du site et certificat https |
| Un serveur avec Node.js 20.9 ou plus récent, Apache et PM2 | Faire tourner le site |
| Un compte Stripe validé | Encaisser les paiements par carte |
| Une boîte email avec ses réglages SMTP (serveur, identifiant, mot de passe) | Confirmations de commande, suivi, messages de contact |
| Nom de l'exploitante, forme juridique, SIRET, mention de TVA, nom et adresse de l'hébergeur | Mentions légales, obligatoires pour vendre en ligne |
| Les photos et les textes des vraies créations, avec prix et stock | Remplacer le catalogue d'exemple |
| Le vrai numéro de téléphone (ou le choix de ne pas en afficher) et l'adresse exacte de la boutique | Page contact et fiche lue par Google |
| Un compte Google | Search Console et fiche d'établissement |

## 2. Installer le site sur le serveur

Dans le dossier du site sur le serveur (`/var/www/ptites-crea-claire` dans la configuration fournie) :

```bash
cp .env.example .env
```

Remplir `.env` :

- `APP_URL` : l'adresse définitive en https, sans barre finale ;
- `AUTH_SECRET` : une longue clé aléatoire (la commande pour la créer est indiquée dans le fichier) ;
- `ADMIN_EMAIL` et `ADMIN_PASSWORD` : le compte gestionnaire, créé à la première connexion ;
- `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` : voir l'étape 4 ;
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` : la boîte email de la boutique.

Puis installer, construire et démarrer :

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

La mise en place d'Apache et du certificat https est décrite dans le README, section « Déploiement sur le VPS ». Une fois le certificat en place, le site répond sur son adresse en https, et la variante avec ou sans `www` est redirigée vers l'adresse de `APP_URL`.

Vérifier que le site tourne :

```bash
curl -s http://127.0.0.1:3015/api/health
```

La réponse attendue est `{"status":"ok"}`.

## 3. Régler le contrôle de mise en ligne

Se connecter sur `/connexion` avec le compte gestionnaire, puis ouvrir l'administration. Le tableau de bord affiche le contrôle de mise en ligne. Chaque ligne en attente a un lien « Régler » quand le réglage se fait dans le site.

| Point | Comment le régler |
| --- | --- |
| Adresse du site | `APP_URL` en https dans `.env`, puis `npm run build` et redémarrage |
| Paiement par carte | Étape 4 de ce guide |
| Envoi des emails | Variables `SMTP_*` dans `.env`, puis redémarrage. Le journal des emails est dans « Paramètres & emails » |
| Mentions légales | « Contenu du site », bloc « Informations légales » : exploitante, SIRET, hébergeur, et si possible TVA et médiateur de la consommation |
| Catalogue | « Produits » : créer les vraies créations avec leurs photos, puis supprimer les six créations d'exemple |
| Coordonnées de la boutique | « Contenu du site » : téléphone réel (ou champ vidé), numéro et rue, code postal, ville |
| Réseaux sociaux | « Contenu du site » : adresse complète du profil Instagram ou Facebook. Sans profil, les icônes ne s'affichent pas |
| Visibilité sur Google | `SITE_NOINDEX` doit rester vide sur le vrai site |
| Sécurité du compte gestionnaire | `AUTH_SECRET` défini, mot de passe choisi dans « Paramètres & emails » |
| Sauvegardes | Étape 7 de ce guide |

À revoir aussi avant d'ouvrir :

- les horaires (« Horaires de l'atelier ») : ils sont affichés sur le site et transmis à Google ;
- les frais de port et le seuil de livraison offerte (« Paramètres & emails ») ;
- les codes promo : ceux livrés en exemple sont inactifs, à activer ou à supprimer (« Codes promotionnels ») ;
- les textes des pages (« Contenu du site ») et les conditions générales de vente, à relire avec les vraies pratiques de la boutique.

## 4. Brancher le paiement Stripe

1. Dans le tableau de bord Stripe, copier la clé secrète dans `STRIPE_SECRET_KEY`. Commencer avec la clé de test.
2. Toujours dans Stripe, créer un webhook vers `APP_URL/api/stripe/webhook` avec les événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` et `checkout.session.expired`.
3. Copier la clé de signature du webhook dans `STRIPE_WEBHOOK_SECRET`.
4. Redémarrer le site :

```bash
pm2 restart ptites-crea-claire
```

5. Dans l'administration, page « Paramètres & emails », couper le mode démonstration.

## 5. Passer une commande d'essai

Avec les clés de test Stripe, passer une vraie commande de bout en bout :

1. ajouter une création au panier, commander avec une adresse email que l'on consulte ;
2. payer avec la carte de test Stripe `4242 4242 4242 4242`, date future, trois chiffres au choix ;
3. vérifier la page de confirmation, l'email reçu par la cliente et l'avis reçu par la boutique ;
4. dans l'administration, page « Commandes » : la commande doit être « payée » et le stock diminué ;
5. passer la commande en « expédiée » avec un numéro de suivi et vérifier l'email de suivi ;
6. annuler la commande : le stock doit revenir.

Quand tout est bon, remplacer les clés de test par les clés réelles (clé secrète et clé du webhook réel), puis redémarrer. La commande d'essai, déjà annulée, reste dans l'historique sans compter dans le chiffre d'affaires.

## 6. Faire connaître le site à Google

Le site fournit déjà aux moteurs de recherche tout ce qu'ils attendent (voir README, section « Référencement »). Il reste quatre démarches, à faire une fois, hors du site.

**Google Search Console**

1. Sur search.google.com/search-console, ajouter le site avec la méthode « Préfixe de l'URL ».
2. Choisir la validation par balise HTML, copier la valeur `content` de la balise dans `GOOGLE_SITE_VERIFICATION` du fichier `.env`, redémarrer le site, puis cliquer sur « Valider ».
3. Dans « Sitemaps », envoyer `sitemap.xml`.

Google indique ensuite les pages indexées, les recherches qui amènent des visites et les éventuels problèmes.

**Fiche d'établissement Google**

C'est elle qui fait apparaître la boutique sur Google Maps et dans les recherches du type « bijoux Port-la-Nouvelle ». Sur business.google.com :

- créer ou revendiquer la fiche de la boutique, dans la catégorie la plus proche de l'activité (créatrice de bijoux, bijouterie) ;
- écrire le nom, l'adresse et le téléphone exactement comme sur le site : la moindre différence affaiblit la fiche ;
- ajouter le lien du site, les horaires, des photos de la boutique et des créations ;
- proposer aux clientes satisfaites de laisser un avis, et répondre à chacun.

**Réseaux sociaux et annuaires locaux**

Mettre le lien du site dans la biographie Instagram et sur la page Facebook. Demander un lien depuis les sites locaux qui recensent les commerces : office de tourisme, mairie, association de commerçants, annuaires. Quelques liens venant de sites de la commune comptent plus que beaucoup de liens sans rapport.

**Textes des créations**

Chaque fiche gagne à avoir un texte qui lui est propre, de deux ou trois phrases : matière, couleurs, dimensions, façon de la porter. Le nom de la création sert aussi de description à sa première photo, autant qu'il dise ce que l'on voit (« Boucles d'oreilles pivoine rose poudré » plutôt que « Modèle 12 »).

Pour une démo ou une préproduction, mettre `SITE_NOINDEX="true"` dans son `.env` : elle ne sera pas indexée et ne fera pas concurrence au vrai site.

## 7. Entretien courant

**Sauvegardes.** Programmer une sauvegarde chaque nuit avec `crontab -e` :

```
0 3 * * * cd /var/www/ptites-crea-claire && npm run backup >> /var/log/ptites-crea-claire-backup.log 2>&1
```

Si la tâche ne trouve pas `npm`, écrire son chemin complet (donné par `which npm`). Lancer une première sauvegarde à la main pour vérifier :

```bash
npm run backup
```

Recopier de temps en temps le dossier `backups/` hors du serveur. La restauration est décrite dans le README, section « Données et sauvegardes ».

**Surveillance.** Donner l'adresse `APP_URL/api/health` à un service de surveillance gratuit : il prévient par email si le site ne répond plus.

**Mises à jour du site.**

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

**Mot de passe gestionnaire perdu.** Sur le serveur, dans le dossier du site :

```bash
npm run admin:password
```

## 8. En cas de problème

| Ce qui se passe | Où regarder |
| --- | --- |
| Le site ne répond plus | `pm2 status`, puis `pm2 logs ptites-crea-claire --lines 100` |
| Une cliente n'a pas reçu son email | « Paramètres & emails », journal des emails : chaque envoi y figure avec son statut |
| Une commande reste « paiement en attente » | Dans Stripe, vérifier que le webhook est actif et que ses envois réussissent |
| La commande en ligne est fermée | Mode démonstration coupé alors que la clé Stripe manque : revoir l'étape 4 |
| Une photo ne s'envoie pas | Formats acceptés : JPG, PNG, WebP, AVIF, GIF, 10 Mo au plus par photo |
| Les données semblent abîmées | Restaurer la dernière sauvegarde (README, « Données et sauvegardes ») |

Avant toute modification du code, lancer `npm run check` : la commande vérifie les types, les règles de code, la construction du site et l'ensemble des tests.
