# Fiche Mémo : Livraison chez la cliente & Passage au Nom de Domaine

Cette fiche est conçue pour être suivie pas à pas lorsque vous êtes **chez Claire** pour lui livrer la boutique.

Elle permet de basculer facilement le site depuis l'adresse de démonstration (**`https://virtuose-social.com/lpc`**) vers son **nom de domaine officiel et définitif** (ex. `https://lesptitescreadeclaire.fr`), servi directement à la racine, avec certificat HTTPS gratuit et référencement Google actif.

---

## 1. Ce qu'il faut demander à Claire à votre arrivée

| Élément | À quoi il sert | Exemple |
| --- | --- | --- |
| **Le nom de domaine acheté** | L'adresse officielle du site | `lesptitescreadeclaire.fr` (ou `.com`) |
| **L'accès au compte du bureau d'enregistrement** | Configurer les DNS pour faire pointer le domaine vers votre serveur | OVH, Hostinger, Gandi, Ionos, etc. |
| **L'adresse email de la boutique** | Certificat SSL et avis de commande | `contact@lesptitescreadeclaire.fr` |

---

## 2. Étape 1 : Faire pointer le nom de domaine sur le VPS (Chez l'hébergeur)

Connectez-vous sur l'espace client où Claire a acheté son nom de domaine, puis allez dans **Zone DNS** (ou Gestion DNS).

Vous devez faire pointer le domaine vers l'**adresse IP de votre VPS** :

### Les deux enregistrements à configurer :
1. **Domaine principal** :
   - **Type** : `A`
   - **Nom / Sous-domaine** : `@` (ou laissez vide selon l'interface)
   - **Cible / Valeur** : `IP_DE_VOTRE_VPS`
   - **TTL** : standard (ex. 300 ou 3600 secondes)
2. **Variante avec www** :
   - **Type** : `A` (ou `CNAME`)
   - **Nom / Sous-domaine** : `www`
   - **Cible / Valeur** : `IP_DE_VOTRE_VPS` (ou `lesptitescreadeclaire.fr.`)

> [!TIP]
> Si d'anciens enregistrements `A` pointaient vers une page d'attente de l'hébergeur, supprimez-les ou remplacez leur cible par l'IP de votre VPS.

---

## 3. Étape 2 : Lancer la configuration automatique sur le serveur

Ouvrez un terminal SSH vers votre serveur VPS :

```bash
cd /var/www/ptites-crea-claire
```

Lancez le script interactif de changement de domaine :

```bash
npm run domaine
```
*(ou en commande directe : `bash scripts/configurer-domaine.sh`)*

### Ce que le script va vous demander :
1. **Nom de domaine** : Tapez le domaine officiel (ex: `lesptitescreadeclaire.fr`). Le script nettoie automatiquement les fautes de frappe (retire `http`, `www`, barre de fin, etc.).
2. **Vérification DNS** : Le script vérifie en direct si le domaine résout bien vers l'IP de votre serveur.
3. **Email gestionnaire & SSL** : Entrez l'adresse de contact (ex: `contact@lesptitescreadeclaire.fr`).
4. **Validation des étapes** : Répondez `O` (Entrée) aux confirmations pour :
   - Mettre à jour `.env` (supprime automatiquement `/lpc` et autorise Google).
   - Générer et activer le VirtualHost Apache.
   - Reconstruire l'application Next.js (`npm run build`).
   - Redémarrer PM2.
   - Obtenir le certificat HTTPS gratuit avec Certbot.

---

## 4. Ce que le script réalise automatiquement en coulisses

Le script effectue automatiquement les 6 actions indispensables :
- **Sauvegarde** : crée une copie de secours `.env.backup.<date>`.
- **Fichier `.env`** :
  - `APP_URL="https://<domaine-officiel>"`
  - `NEXT_PUBLIC_BASE_PATH=""` *(vide le sous-dossier `/lpc` de la démo)*
  - `SITE_NOINDEX=""` *(autorise l'indexation par Google)*
- **VirtualHost Apache** :
  - Écrit `apache/ptites-crea-claire.conf` avec `ServerName <domaine>` et `ProxyPass / http://127.0.0.1:3015/`.
  - Active le site (`sudo a2ensite ptites-crea-claire.conf`) et recharge Apache sans coupure.
- **Next.js** : relance `npm run build` car le préfixe `/lpc` est compilé au moment du build.
- **PM2** : redémarre le service (`pm2 restart ptites-crea-claire`).
- **Certificat SSL** : lance Certbot pour activer HTTPS et la redirection automatique.

---

## 5. Étape 3 : Les 4 vérifications à faire avec Claire avant de partir

Faites ces vérifications avec elle pour lui montrer son site en direct :

### 1. Ouvrir le site sur smartphone et ordinateur
- Rendez-vous sur `https://lesptitescreadeclaire.fr`.
- Vérifiez la présence du **cadenas sécurisé (HTTPS)** dans la barre d'adresse.
- Testez que la version sans les www redirige bien vers l'adresse officielle.

### 2. Se connecter à l'administration
- Allez sur `https://lesptitescreadeclaire.fr/connexion`.
- Connectez-vous avec le compte gestionnaire.
- Ouvrez le tableau de bord : observez le bloc **Contrôle de mise en ligne** :
  - L'adresse du site doit être au vert.
  - L'indexation Google doit être au vert.

### 3. Mettre à jour Stripe (si les paiements réels sont activés)
Si vous passez en paiement réel chez la cliente :
1. Dans le tableau de bord Stripe (dashboard.stripe.com), ouvrez **Développeurs > Webhooks**.
2. Modifiez l'URL du webhook ou créez-en un nouveau vers :
   ```
   https://lesptitescreadeclaire.fr/api/stripe/webhook
   ```
   *(Remplacer l'ancienne adresse contenant `virtuose-social.com/lpc`)*.
3. Événements à écouter : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`.
4. Renseignez la clé `STRIPE_WEBHOOK_SECRET` dans le `.env` et faites `pm2 restart ptites-crea-claire`.

### 4. Passer une commande d'essai
- Ajoutez un bijou au panier, passez la commande jusqu'au bout.
- Vérifiez l'affichage de la page de confirmation et la réception de l'email.

---

## 6. Que faire en cas d'imprévu chez la cliente ?

### Le certificat Certbot a échoué
**Cause :** Vous venez de modifier les DNS chez OVH/Hostinger et la propagation prend entre 5 et 20 minutes selon les opérateurs. Let's Encrypt ne voit pas encore la nouvelle IP.  
**Solution :**
1. Attendez 10 à 15 minutes.
2. Relancez simplement la commande Certbot :
   ```bash
   sudo certbot --apache -d lesptitescreadeclaire.fr -d www.lesptitescreadeclaire.fr
   ```
3. Certbot validera le domaine dès que la propagation sera effective et appliquera le HTTPS.

### Que devient l'ancienne adresse démo `virtuose-social.com/lpc` ?
Le site de Claire écoute désormais à la racine de son propre domaine.  
L'ancienne URL `virtuose-social.com/lpc` ne mènera plus à la boutique.  
Si vous aviez une directive `ProxyPass /lpc` dans le VirtualHost de `virtuose-social.com` sur le VPS, vous pouvez la supprimer ou la laisser sans incidence.

### Retour en arrière (si Claire n'a finalement pas son domaine aujourd'hui)
Pour réactiver temporairement la démo :
```bash
cp .env.backup.* .env
npm run build
pm2 restart ptites-crea-claire
```

