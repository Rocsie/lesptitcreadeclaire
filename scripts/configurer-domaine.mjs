// Configuration interactive du nom de domaine pour la livraison client.
// Permet de passer facilement de la démo (ex. virtuose-social.com/lpc) au domaine officiel.
//
// Usage sur le serveur :
//   npm run domaine
//   ou : node scripts/configurer-domaine.mjs [domaine]
//
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import dns from 'node:dns/promises';
import https from 'node:https';
import { spawnSync, execSync } from 'node:child_process';

const root = process.cwd();

// Couleurs ANSI pour le terminal
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(msg = '') {
  console.log(msg);
}

function title(msg) {
  log(`\n${c.bold}${c.cyan}=== ${msg} ===${c.reset}\n`);
}

function success(msg) {
  log(`${c.green}✔ ${msg}${c.reset}`);
}

function warn(msg) {
  log(`${c.yellow}⚠ ${msg}${c.reset}`);
}

function error(msg) {
  log(`${c.red}✖ ${msg}${c.reset}`);
}

function info(msg) {
  log(`${c.blue}ℹ ${msg}${c.reset}`);
}

// Récupère l'IP publique du serveur via un service externe
async function getServerPublicIp() {
  const providers = [
    'https://api.ipify.org',
    'https://icanhazip.com',
    'https://ifconfig.me/ip',
  ];

  for (const url of providers) {
    try {
      const ip = await new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 3500 }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data.trim()));
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        return ip;
      }
    } catch {
      // essayer le suivant
    }
  }
  return null;
}

// Nettoie la saisie d'un nom de domaine
function cleanDomain(input) {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '') // retire http:// ou https://
    .replace(/^www\./, '') // retire www.
    .replace(/\/.*$/, '') // retire les chemins (ex: /lpc)
    .replace(/:\d+$/, '') // retire les ports éventuels
    .replace(/\.+$/, ''); // retire les points de fin
}

// Lit un fichier d'environnement et renvoie un dictionnaire de clés/valeurs
function readEnvFile(filepath) {
  const values = {};
  if (!fs.existsSync(filepath)) return values;
  const content = fs.readFileSync(filepath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!match) continue;
    let val = match[2].trim();
    const quoted = val.match(/^(["'])(.*)\1/);
    values[match[1]] = quoted ? quoted[2] : val.replace(/\s+#.*$/, '');
  }
  return values;
}

// Met à jour le fichier .env en préservant commentaires et structure
function updateEnvContent(content, updates) {
  let lines = content.split(/\r?\n/);
  const updatedKeys = new Set();

  lines = lines.map((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!match) return line;
    const key = match[1];
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      updatedKeys.add(key);
      const val = updates[key];
      const commentMatch = match[2].match(/\s+(#.*)$/);
      const comment = commentMatch ? commentMatch[1] : '';
      return `${key}="${val}"${comment ? ' ' + comment : ''}`;
    }
    return line;
  });

  for (const [key, val] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      lines.push(`${key}="${val}"`);
    }
  }

  return lines.join('\n');
}

// Génère la configuration Apache du VirtualHost
function generateApacheConfig(domain, adminEmail) {
  return `# VirtualHost Apache2 pour "${domain}"
# Boutique "Les P'tites Créa de Claire"
# Fichier généré automatiquement lors du passage au nom de domaine officiel.

<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}
    ServerAdmin ${adminEmail}

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
`;
}

async function main() {
  log();
  log(`${c.bold}${c.magenta}╔══════════════════════════════════════════════════════════════════╗${c.reset}`);
  log(`${c.bold}${c.magenta}║      Les P'tites Créa de Claire — Configuration de Domaine       ║${c.reset}`);
  log(`${c.bold}${c.magenta}║       Passage de la démo (virtuose-social.com/lpc) au direct     ║${c.reset}`);
  log(`${c.bold}${c.magenta}╚══════════════════════════════════════════════════════════════════╝${c.reset}`);
  log();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const envPath = path.join(root, '.env');
  const envExamplePath = path.join(root, '.env.example');
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    info('Création du fichier .env à partir de .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
  }
  const currentEnv = readEnvFile(envPath);

  // 1. Détection de l'IP publique
  title('1. Détection du serveur');
  process.stdout.write('Recherche de l\'adresse IP publique du VPS... ');
  const serverIp = await getServerPublicIp();
  if (serverIp) {
    log(`${c.green}${c.bold}${serverIp}${c.reset}`);
  } else {
    log(`${c.yellow}non détectée (pas d'accès internet sortant ou timeout)${c.reset}`);
  }

  // 2. Choix du nom de domaine
  title('2. Nom de domaine');
  let domain = cleanDomain(process.argv[2]);
  if (!domain) {
    const defDomain = currentEnv.APP_URL ? cleanDomain(currentEnv.APP_URL) : 'lesptitescreadeclaire.com';
    const rep = await rl.question(
      `Nom de domaine officiel de Claire [ex: ${defDomain}] : `
    );
    domain = cleanDomain(rep) || defDomain;
  }

  while (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(domain) || domain.includes('/')) {
    error(`Format invalide : "${domain}". Veuillez saisir un nom de domaine valide (ex: lesptitescreadeclaire.fr)`);
    const rep = await rl.question('Nom de domaine : ');
    domain = cleanDomain(rep);
  }

  log();
  info(`Domaine configuré : ${c.bold}${domain}${c.reset}`);
  info(`Variante avec www : ${c.bold}www.${domain}${c.reset}`);
  info(`URL finale du site : ${c.bold}https://${domain}${c.reset}`);

  // 3. DNS Checklist & Test
  title('3. Vérification des DNS');
  log(`Rappel de la configuration chez l'hébergeur du domaine (OVH, Hostinger, Gandi, Ionos...) :`);
  log(`  ${c.cyan}Type A${c.reset}     nom: ${c.bold}@${c.reset}    cible: ${c.bold}${serverIp || '<IP_DE_VOTRE_VPS>'}${c.reset}`);
  log(`  ${c.cyan}Type CNAME${c.reset} nom: ${c.bold}www${c.reset}  cible: ${c.bold}${domain}.${c.reset} (ou Type A vers l'IP)`);
  log();

  process.stdout.write(`Test de résolution DNS pour ${domain}... `);
  let dnsOk = false;
  try {
    const resolvedIps = await dns.resolve4(domain);
    log(`${c.green}${resolvedIps.join(', ')}${c.reset}`);
    if (serverIp && resolvedIps.includes(serverIp)) {
      success(`Le nom de domaine pointe parfaitement vers ce serveur (${serverIp}) !`);
      dnsOk = true;
    } else if (serverIp) {
      warn(`Le domaine pointe vers ${resolvedIps.join(', ')} au lieu de ${serverIp}.`);
      warn(`Si vous venez de modifier les DNS, comptez 5 à 15 minutes de propagation.`);
    } else {
      dnsOk = true;
    }
  } catch (err) {
    log(`${c.yellow}non résolu pour le moment (${err.code || err.message})${c.reset}`);
    warn(`Le nom de domaine n'est pas encore résolu sur internet.`);
  }

  if (!dnsOk) {
    const cont = await rl.question('\nContinuer la configuration du serveur quand même ? [O/n] : ');
    if (cont.trim().toLowerCase() === 'n') {
      log('\nOpération interrompue. Relancez ce script dès que les DNS sont à jour.');
      rl.close();
      return;
    }
  }

  // 4. Email pour Certbot / Admin
  title('4. Contact gestionnaire & SSL');
  const defaultEmail = currentEnv.ADMIN_EMAIL || `contact@${domain}`;
  const repEmail = await rl.question(`Adresse email gestionnaire & Certbot [${defaultEmail}] : `);
  const adminEmail = repEmail.trim() || defaultEmail;

  // 5. Mise à jour de .env
  title('5. Mise à jour du fichier .env');
  const now = new Date();
  const backupEnvName = `.env.backup.${now.toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, path.join(root, backupEnvName));
    success(`Sauvegarde créée : ${backupEnvName}`);
  }

  const currentContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const envUpdates = {
    APP_URL: `https://${domain}`,
    NEXT_PUBLIC_BASE_PATH: '', // Supprime le sous-dossier /lpc de la démo
    SITE_NOINDEX: '', // Autorise le référencement Google sur le vrai domaine
  };

  if (adminEmail && (!currentEnv.ADMIN_EMAIL || currentEnv.ADMIN_EMAIL.includes('virtuose-social.com'))) {
    envUpdates.ADMIN_EMAIL = adminEmail;
  }

  const updatedEnvContent = updateEnvContent(currentContent, envUpdates);
  fs.writeFileSync(envPath, updatedEnvContent, 'utf-8');
  success(`Fichier .env mis à jour :`);
  log(`  • APP_URL="https://${domain}"`);
  log(`  • NEXT_PUBLIC_BASE_PATH="" (désactivation de /lpc)`);
  log(`  • SITE_NOINDEX="" (site ouvert aux moteurs de recherche)`);

  // 6. Mise à jour d'Apache
  title('6. Configuration Apache');
  const apacheConfPath = path.join(root, 'apache', 'ptites-crea-claire.conf');
  const newApacheConf = generateApacheConfig(domain, adminEmail);
  fs.mkdirSync(path.dirname(apacheConfPath), { recursive: true });
  fs.writeFileSync(apacheConfPath, newApacheConf, 'utf-8');
  success(`Fichier apache/ptites-crea-claire.conf régénéré.`);

  const isLinux = process.platform === 'linux';
  const hasApacheSites = isLinux && fs.existsSync('/etc/apache2/sites-available');

  if (hasApacheSites) {
    const applyApache = await rl.question('\nAppliquer cette configuration dans Apache maintenant ? [O/n] : ');
    if (applyApache.trim().toLowerCase() !== 'n') {
      try {
        log('Activation des modules Apache nécessaires...');
        spawnSync('sudo', ['a2enmod', 'proxy', 'proxy_http', 'headers', 'rewrite', 'ssl'], { stdio: 'inherit' });

        log('Copie du VirtualHost vers /etc/apache2/sites-available/ptites-crea-claire.conf...');
        spawnSync('sudo', ['cp', apacheConfPath, '/etc/apache2/sites-available/ptites-crea-claire.conf'], { stdio: 'inherit' });

        log('Activation du site dans Apache...');
        spawnSync('sudo', ['a2ensite', 'ptites-crea-claire.conf'], { stdio: 'inherit' });

        log('Test de la syntaxe Apache...');
        const testRes = spawnSync('sudo', ['apache2ctl', 'configtest'], { encoding: 'utf-8' });
        if ((testRes.stderr || testRes.stdout || '').includes('Syntax OK')) {
          success('Syntaxe Apache OK.');
          log('Rechargement du serveur Apache...');
          spawnSync('sudo', ['systemctl', 'reload', 'apache2'], { stdio: 'inherit' });
          success('Apache rechargé avec succès.');
        } else {
          warn('Attention lors du test Apache :');
          log(testRes.stderr || testRes.stdout);
        }
      } catch (err) {
        error(`Erreur lors de la configuration Apache : ${err.message}`);
      }
    }
  } else {
    info(`(Système non-Linux ou sans Apache détecté localement. Fichier Apache prêt dans apache/ptites-crea-claire.conf)`);
  }

  // 7. Reconstruction du site Next.js
  title('7. Reconstruction Next.js (Build)');
  log(`Next.js doit être reconstruit pour supprimer le sous-dossier /lpc et intégrer la nouvelle adresse.`);
  const doBuild = await rl.question('Lancer la reconstruction maintenant (npm run build) ? [O/n] : ');
  if (doBuild.trim().toLowerCase() !== 'n') {
    log('\nConstruction en cours (veuillez patienter quelques secondes)...');
    const buildRes = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', cwd: root });
    if (buildRes.status === 0) {
      success('Reconstruction Next.js terminée avec succès !');
    } else {
      error('La commande "npm run build" a retourné une erreur. Vérifiez les logs ci-dessus.');
    }
  }

  // 8. Redémarrage PM2
  title('8. Redémarrage de l\'application (PM2)');
  let hasPm2 = false;
  try {
    execSync('pm2 -v', { stdio: 'ignore' });
    hasPm2 = true;
  } catch {
    hasPm2 = false;
  }

  if (hasPm2) {
    const doRestart = await rl.question('Redémarrer le processus PM2 ptites-crea-claire ? [O/n] : ');
    if (doRestart.trim().toLowerCase() !== 'n') {
      try {
        log('Redémarrage de ptites-crea-claire via PM2...');
        const restartRes = spawnSync('pm2', ['restart', 'ptites-crea-claire'], { stdio: 'inherit' });
        if (restartRes.status !== 0) {
          log('Démarrage via ecosystem.config.js...');
          spawnSync('pm2', ['start', 'ecosystem.config.js'], { stdio: 'inherit', cwd: root });
        }
        spawnSync('pm2', ['save'], { stdio: 'inherit' });
        success('Processus PM2 redémarré et sauvegardé.');
      } catch (err) {
        error(`Erreur PM2 : ${err.message}`);
      }
    }
  } else {
    info('PM2 non détecté sur cette machine.');
  }

  // 9. Certificat SSL (Certbot)
  title('9. Certificat SSL HTTPS (Certbot)');
  let hasCertbot = false;
  try {
    execSync('certbot --version', { stdio: 'ignore' });
    hasCertbot = true;
  } catch {
    hasCertbot = false;
  }

  if (hasCertbot && isLinux) {
    log(`Certbot permet d'obtenir un certificat HTTPS gratuit et d'activer la redirection automatique.`);
    const doSsl = await rl.question(`Générer le certificat HTTPS pour ${domain} et www.${domain} ? [O/n] : `);
    if (doSsl.trim().toLowerCase() !== 'n') {
      log('\nExécution de Certbot...');
      const certRes = spawnSync(
        'sudo',
        [
          'certbot',
          '--apache',
          '-d',
          domain,
          '-d',
          `www.${domain}`,
          '--non-interactive',
          '--agree-tos',
          '--email',
          adminEmail,
          '--redirect',
        ],
        { stdio: 'inherit' }
      );
      if (certRes.status === 0) {
        success('Certificat SSL installé et redirection HTTPS en place !');
      } else {
        warn('Certbot a rencontré un problème (souvent dû au délai de propagation DNS).');
        info(`Une fois les DNS propagés, relancez simplement cette commande :`);
        log(`  ${c.bold}sudo certbot --apache -d ${domain} -d www.${domain}${c.reset}`);
      }
    }
  } else {
    info(`Pour activer le certificat HTTPS avec Certbot plus tard sur le VPS :`);
    log(`  ${c.bold}sudo certbot --apache -d ${domain} -d www.${domain}${c.reset}`);
  }

  // 10. Test de santé local
  title('10. Vérification');
  try {
    const health = await new Promise((resolve, reject) => {
      const req = https.get('http://127.0.0.1:3015/api/health', (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      });
      req.on('error', reject);
    });
    if (health.status === 200 && health.body.includes('"status":"ok"')) {
      success('Le serveur local répond parfaitement sur http://127.0.0.1:3015/api/health (status: ok)');
    }
  } catch {
    // Normal si pas lancé ou test depuis un autre poste
  }

  // 11. Récapitulatif et démarches chez la cliente
  log();
  log(`${c.bold}${c.green}════════════════════════════════════════════════════════════════════${c.reset}`);
  log(`${c.bold}${c.green}  FÉLICITATIONS ! VOTRE SITE EST PRÊT SUR LE NOUVEAU DOMAINE       ${c.reset}`);
  log(`${c.bold}${c.green}════════════════════════════════════════════════════════════════════${c.reset}`);
  log();
  log(`  ${c.bold}Adresse officielle :${c.reset}  https://${domain}`);
  log(`  ${c.bold}Administration :${c.reset}      https://${domain}/connexion`);
  log();
  log(`${c.bold}${c.yellow}À VÉRIFIER CHEZ LA CLIENTE :${c.reset}`);
  log(`  1. ${c.bold}Stripe Webhook :${c.reset}`);
  log(`     Si Stripe est activé, mettez à jour l'URL du webhook dans le dashboard Stripe :`);
  log(`     👉 ${c.cyan}https://${domain}/api/stripe/webhook${c.reset}`);
  log();
  log(`  2. ${c.bold}Contrôle de mise en ligne :${c.reset}`);
  log(`     Connectez-vous sur ${c.cyan}https://${domain}/connexion${c.reset} et vérifiez que`);
  log(`     les voyants du tableau de bord passent au vert.`);
  log();
  log(`  3. ${c.bold}Ancienne démo (virtuose-social.com/lpc) :${c.reset}`);
  log(`     Le site répond désormais directement sur ${domain}.`);
  log(`     Si besoin, vous pouvez supprimer la ligne ProxyPass /lpc dans la conf de`);
  log(`     virtuose-social.com sur le VPS.`);
  log();
  log(`${c.dim}Consultez LIVRAISON-DOMAINE.md pour la fiche mémo complète.${c.reset}\n`);

  rl.close();
}

main().catch((err) => {
  error(`Erreur inattendue : ${err.stack || err.message}`);
  process.exit(1);
});

