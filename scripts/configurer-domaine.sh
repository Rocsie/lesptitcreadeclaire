#!/usr/bin/env bash
# ==============================================================================
# Script de configuration du nom de domaine pour la livraison client
# Les P'tites Créa de Claire
#
# Permet de passer de https://virtuose-social.com/lpc à https://<client-domaine>
# en une seule commande depuis le serveur VPS.
# ==============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Répertoire du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_DIR}"

clear || true
echo -e "${MAGENTA}${BOLD}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}${BOLD}║      Les P'tites Créa de Claire — Configuration de Domaine       ║${NC}"
echo -e "${MAGENTA}${BOLD}║       Passage de la démo (virtuose-social.com/lpc) au direct     ║${NC}"
echo -e "${MAGENTA}${BOLD}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Détection de l'IP du VPS
echo -e "${CYAN}${BOLD}=== 1. Détection de l'IP du VPS ===${NC}"
SERVER_IP=$(curl -4 -s --max-time 4 https://api.ipify.org || curl -4 -s --max-time 4 https://icanhazip.com || true)
if [ -n "${SERVER_IP}" ]; then
  echo -e "Adresse IP publique détectée : ${GREEN}${BOLD}${SERVER_IP}${NC}"
else
  echo -e "${YELLOW}Impossible de détecter l'IP publique automatiquement.${NC}"
  SERVER_IP="<IP_DE_VOTRE_VPS>"
fi
echo ""

# 2. Saisie du nom de domaine
echo -e "${CYAN}${BOLD}=== 2. Nom de domaine officiel ===${NC}"
read -rp "Entrez le nom de domaine de Claire (ex: lesptitescreadeclaire.com) : " RAW_DOMAIN

# Nettoyage de la saisie
DOMAIN=$(echo "${RAW_DOMAIN}" | tr '[:upper:]' '[:lower:]' | sed -e 's|^https\?://||' -e 's|^www\.||' -e 's|/.*$||' -e 's|:\([0-9]\+\)$||')

if [ -z "${DOMAIN}" ]; then
  echo -e "${RED}Erreur : nom de domaine obligatoire.${NC}"
  exit 1
fi

echo -e "Domaine principal : ${GREEN}${BOLD}${DOMAIN}${NC}"
echo -e "Alias www         : ${GREEN}${BOLD}www.${DOMAIN}${NC}"
echo -e "URL finale        : ${GREEN}${BOLD}https://${DOMAIN}${NC}"
echo ""

# 3. Rappel DNS & Vérification
echo -e "${CYAN}${BOLD}=== 3. Vérification des DNS ===${NC}"
echo -e "Rappel de la configuration chez l'hébergeur du domaine (OVH, Hostinger, Gandi...) :"
echo -e "  • Enregistrement ${BOLD}A${NC}    (nom: ${BOLD}@${NC})   -> Cible : ${BOLD}${SERVER_IP}${NC}"
echo -e "  • Enregistrement ${BOLD}CNAME${NC}(nom: ${BOLD}www${NC}) -> Cible : ${BOLD}${DOMAIN}.${NC} (ou type A vers ${SERVER_IP})"
echo ""

if command -v dig >/dev/null 2>&1; then
  RESOLVED_IP=$(dig +short "${DOMAIN}" | tail -n1 || true)
elif command -v getent >/dev/null 2>&1; then
  RESOLVED_IP=$(getent hosts "${DOMAIN}" | awk '{ print $1 }' || true)
else
  RESOLVED_IP=""
fi

if [ -n "${RESOLVED_IP}" ]; then
  echo -e "Résolution actuelle pour ${DOMAIN} : ${BOLD}${RESOLVED_IP}${NC}"
  if [ "${RESOLVED_IP}" = "${SERVER_IP}" ]; then
    echo -e "${GREEN}✔ Le domaine pointe bien vers ce serveur !${NC}"
  else
    echo -e "${YELLOW}⚠ Le domaine ne pointe pas encore vers l'IP de ce serveur (${SERVER_IP}).${NC}"
    echo -e "${YELLOW}  Si vous venez de faire la modification DNS, comptez 5 à 15 minutes.${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Le domaine n'est pas encore résolu.${NC}"
fi

read -rp "Continuer la configuration du serveur ? [O/n] : " CONT
CONT=${CONT:-O}
if [[ ! "${CONT}" =~ ^[oOyY]$ ]]; then
  echo "Opération annulée."
  exit 0
fi
echo ""

# 4. Email gestionnaire & SSL
echo -e "${CYAN}${BOLD}=== 4. Email gestionnaire & Certificat SSL ===${NC}"
DEFAULT_EMAIL="contact@${DOMAIN}"
read -rp "Email pour le compte gestionnaire et Certbot [${DEFAULT_EMAIL}] : " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-$DEFAULT_EMAIL}
echo ""

# 5. Mise à jour de .env
echo -e "${CYAN}${BOLD}=== 5. Mise à jour du fichier .env ===${NC}"
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if [ -f .env ]; then
  cp .env ".env.backup.${TIMESTAMP}"
  echo -e "${GREEN}✔ Sauvegarde créée : .env.backup.${TIMESTAMP}${NC}"
fi

# Remplacement / Ajout des variables clés
# 1. APP_URL
if grep -q "^APP_URL=" .env; then
  sed -i "s|^APP_URL=.*|APP_URL=\"https://${DOMAIN}\"|" .env
else
  echo "APP_URL=\"https://${DOMAIN}\"" >> .env
fi

# 2. NEXT_PUBLIC_BASE_PATH (doit être vide pour supprimer /lpc)
if grep -q "^NEXT_PUBLIC_BASE_PATH=" .env; then
  sed -i 's|^NEXT_PUBLIC_BASE_PATH=.*|NEXT_PUBLIC_BASE_PATH=""|' .env
else
  echo 'NEXT_PUBLIC_BASE_PATH=""' >> .env
fi

# 3. SITE_NOINDEX (doit être vide pour autoriser le référencement)
if grep -q "^SITE_NOINDEX=" .env; then
  sed -i 's|^SITE_NOINDEX=.*|SITE_NOINDEX=""|' .env
else
  echo 'SITE_NOINDEX=""' >> .env
fi

echo -e "${GREEN}✔ Fichier .env mis à jour :${NC}"
echo -e "  • APP_URL=\"https://${DOMAIN}\""
echo -e "  • NEXT_PUBLIC_BASE_PATH=\"\""
echo -e "  • SITE_NOINDEX=\"\""
echo ""

# 6. Configuration Apache
echo -e "${CYAN}${BOLD}=== 6. Configuration du VirtualHost Apache ===${NC}"
cat <<EOF > apache/ptites-crea-claire.conf
# VirtualHost Apache2 pour "${DOMAIN}"
# Boutique "Les P'tites Créa de Claire"
# Fichier généré automatiquement pour la mise en production.

<VirtualHost *:80>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}
    ServerAdmin ${ADMIN_EMAIL}

    # Photos de bijoux : 12 photos de 10 Mo au plus par envoi
    LimitRequestBody 125829120

    ProxyPreserveHost On
    ProxyRequests Off

    # Indique à Next.js si la visite arrive en HTTPS (cookie de session "Secure").
    # Certbot recopie ce bloc dans le VirtualHost HTTPS, où REQUEST_SCHEME vaut "https".
    RequestHeader set X-Forwarded-Proto expr=%{REQUEST_SCHEME}

    ProxyPass / http://127.0.0.1:3015/
    ProxyPassReverse / http://127.0.0.1:3015/

    ErrorLog \${APACHE_LOG_DIR}/ptites-crea-claire-error.log
    CustomLog \${APACHE_LOG_DIR}/ptites-crea-claire-access.log combined
</VirtualHost>
EOF
echo -e "${GREEN}✔ Fichier apache/ptites-crea-claire.conf créé.${NC}"

if [ -d /etc/apache2/sites-available ]; then
  read -rp "Installer et recharger cette configuration dans Apache ? [O/n] : " APPLY_APACHE
  APPLY_APACHE=${APPLY_APACHE:-O}
  if [[ "${APPLY_APACHE}" =~ ^[oOyY]$ ]]; then
    sudo a2enmod proxy proxy_http headers rewrite ssl
    sudo cp apache/ptites-crea-claire.conf /etc/apache2/sites-available/ptites-crea-claire.conf
    sudo a2ensite ptites-crea-claire.conf
    if sudo apache2ctl configtest; then
      sudo systemctl reload apache2
      echo -e "${GREEN}✔ Apache rechargé avec succès.${NC}"
    else
      echo -e "${RED}Erreur dans la configuration Apache. Vérifiez avec sudo apache2ctl configtest.${NC}"
    fi
  fi
fi
echo ""

# 7. Recompilation Next.js
echo -e "${CYAN}${BOLD}=== 7. Recompilation de l'application (npm run build) ===${NC}"
read -rp "Lancer 'npm run build' maintenant pour valider le nouveau domaine et retirer /lpc ? [O/n] : " DO_BUILD
DO_BUILD=${DO_BUILD:-O}
if [[ "${DO_BUILD}" =~ ^[oOyY]$ ]]; then
  echo "Construction en cours..."
  npm run build
  echo -e "${GREEN}✔ Construction terminée.${NC}"
fi
echo ""

# 8. Redémarrage PM2
echo -e "${CYAN}${BOLD}=== 8. Redémarrage du serveur Node (PM2) ===${NC}"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart ptites-crea-claire || pm2 start ecosystem.config.js
  pm2 save
  echo -e "${GREEN}✔ Processus PM2 redémarré et sauvegardé.${NC}"
fi
echo ""

# 9. Certificat SSL (Certbot)
echo -e "${CYAN}${BOLD}=== 9. Certificat SSL HTTPS (Certbot) ===${NC}"
if command -v certbot >/dev/null 2>&1; then
  read -rp "Générer le certificat SSL gratuit avec Certbot maintenant ? [O/n] : " DO_SSL
  DO_SSL=${DO_SSL:-O}
  if [[ "${DO_SSL}" =~ ^[oOyY]$ ]]; then
    if sudo certbot --apache -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos --email "${ADMIN_EMAIL}" --redirect; then
      echo -e "${GREEN}✔ Certificat SSL Let's Encrypt installé et actif !${NC}"
    else
      echo -e "${YELLOW}⚠ Certbot n'a pas pu valider le domaine immédiatement.${NC}"
      echo -e "Dès que les DNS ont fini de se propager, relancez simplement :"
      echo -e "  ${BOLD}sudo certbot --apache -d ${DOMAIN} -d www.${DOMAIN}${NC}"
    fi
  fi
else
  echo -e "Certbot n'est pas installé sur ce serveur."
  echo -e "Pour l'installer : sudo apt update && sudo apt install -y certbot python3-certbot-apache"
fi
echo ""

# 10. Récapitulatif
echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  FÉLICITATIONS ! VOTRE SITE EST PRÊT SUR LE NOUVEAU DOMAINE       ${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Adresse publique :${NC}  https://${DOMAIN}"
echo -e "  ${BOLD}Administration :${NC}      https://${DOMAIN}/connexion"
echo ""
echo -e "${YELLOW}${BOLD}À VÉRIFIER CHEZ LA CLIENTE :${NC}"
echo -e "  1. ${BOLD}Stripe Webhook :${NC}"
echo -e "     Si Stripe est branché, mettez à jour l'URL du webhook dans le tableau de bord Stripe :"
echo -e "     👉 ${CYAN}https://${DOMAIN}/api/stripe/webhook${NC}"
echo ""
echo -e "  2. ${BOLD}Contrôle de mise en ligne :${NC}"
echo -e "     Connectez-vous sur ${CYAN}https://${DOMAIN}/connexion${NC} pour vérifier que"
echo -e "     tous les voyants du tableau de bord passent au vert."
echo ""
echo -e "  3. ${BOLD}Ancienne démo (virtuose-social.com/lpc) :${NC}"
echo -e "     Le site répond désormais directement sur ${DOMAIN}."
echo -e "     Vous pouvez retirer la directive ProxyPass /lpc dans la conf de virtuose-social.com."
echo ""
echo -e "Consultez ${BOLD}LIVRAISON-DOMAINE.md${NC} pour le guide pas-à-pas complet."
echo ""

