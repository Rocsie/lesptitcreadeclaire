// Sauvegarde et restauration des données de la boutique.
//
//   npm run backup                      crée une sauvegarde datée (données + photos envoyées)
//   npm run backup -- liste             affiche les sauvegardes disponibles
//   npm run backup -- restaurer <nom>   remet en place une sauvegarde (site arrêté)
//
// Dossier des sauvegardes : BACKUP_DIR dans le .env, sinon ./backups.
// Nombre de sauvegardes conservées : BACKUP_KEEP dans le .env, sinon 14.
// À programmer chaque nuit sur le serveur (voir MISE-EN-LIGNE.md).
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// Les variables du .env ne sont chargées que par Next.js : on relit ici celles dont le script a besoin.
function readEnvFiles() {
  const values = {};
  for (const name of ['.env', '.env.production', '.env.local', '.env.production.local']) {
    let text;
    try {
      text = fs.readFileSync(path.join(root, name), 'utf-8');
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!match) continue;
      let value = match[2].trim();
      const quoted = value.match(/^(["'])(.*)\1/);
      value = quoted ? quoted[2] : value.replace(/\s+#.*$/, '');
      values[match[1]] = value;
    }
  }
  return values;
}

const fileEnv = readEnvFiles();
const setting = (key) => process.env[key] || fileEnv[key] || '';

const dataDir = setting('DATA_DIR') ? path.resolve(setting('DATA_DIR')) : path.join(root, 'data');
const uploadsDir = path.join(root, 'public', 'uploads');
const backupDir = setting('BACKUP_DIR') ? path.resolve(setting('BACKUP_DIR')) : path.join(root, 'backups');
const keep = Math.max(1, Number.parseInt(setting('BACKUP_KEEP'), 10) || 14);

// Fichiers du dossier de données qui ne se sauvegardent pas : le modèle de départ (déjà dans le dépôt),
// la copie de secours interne, les fichiers temporaires et le mot de passe provisoire.
const SKIPPED = new Set(['seed.json', 'store.backup.json', 'admin-initial-password.txt']);
const isBackupName = (name) => /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(name);

const pad = (n) => String(n).padStart(2, '0');
function stamp(date = new Date()) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

function listBackups() {
  try {
    return fs.readdirSync(backupDir).filter(isBackupName).sort();
  } catch {
    return [];
  }
}

function folderSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? folderSize(full) : fs.statSync(full).size;
  }
  return total;
}

const readable = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : `${Math.ceil(bytes / 1024)} Ko`);

function isValidStore(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return Array.isArray(data.products) && Array.isArray(data.orders);
  } catch {
    return false;
  }
}

function create() {
  const storeFile = path.join(dataDir, 'store.json');
  if (!fs.existsSync(storeFile)) {
    console.error(`Rien à sauvegarder : ${storeFile} n'existe pas encore (le site n'a jamais démarré ?).`);
    process.exit(1);
  }

  const name = stamp();
  const final = path.join(backupDir, name);
  if (fs.existsSync(final)) {
    console.error(`Une sauvegarde nommée ${name} existe déjà : relancer dans une seconde.`);
    process.exit(1);
  }
  // La sauvegarde est préparée dans un dossier provisoire, puis renommée une fois complète et vérifiée :
  // une sauvegarde interrompue ne peut ni passer pour une bonne, ni en abîmer une autre.
  const target = path.join(backupDir, `.en-cours_${name}`);
  fs.rmSync(target, { recursive: true, force: true });
  const targetData = path.join(target, 'data');
  fs.mkdirSync(targetData, { recursive: true });

  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    if (!entry.isFile() || SKIPPED.has(entry.name) || entry.name.endsWith('.tmp')) continue;
    fs.copyFileSync(path.join(dataDir, entry.name), path.join(targetData, entry.name));
  }

  // Le site remplace store.json d'un seul coup : la copie est donc complète. On le vérifie quand même,
  // une sauvegarde illisible ne sert à rien.
  if (!isValidStore(path.join(targetData, 'store.json'))) {
    fs.copyFileSync(storeFile, path.join(targetData, 'store.json'));
    if (!isValidStore(path.join(targetData, 'store.json'))) {
      fs.rmSync(target, { recursive: true, force: true });
      console.error('Sauvegarde abandonnée : le fichier de données est illisible.');
      process.exit(1);
    }
  }

  if (fs.existsSync(uploadsDir)) {
    fs.cpSync(uploadsDir, path.join(target, 'uploads'), { recursive: true });
  }

  fs.renameSync(target, final);

  const all = listBackups();
  const removed = all.slice(0, Math.max(0, all.length - keep));
  for (const old of removed) fs.rmSync(path.join(backupDir, old), { recursive: true, force: true });

  console.log(`Sauvegarde créée : ${final} (${readable(folderSize(final))})`);
  if (removed.length > 0) console.log(`${removed.length} ancienne(s) sauvegarde(s) supprimée(s), ${keep} conservées.`);
}

function list() {
  const all = listBackups();
  if (all.length === 0) {
    console.log(`Aucune sauvegarde dans ${backupDir}.`);
    return;
  }
  console.log(`Sauvegardes dans ${backupDir} :`);
  for (const name of all) console.log(`  ${name}  ${readable(folderSize(path.join(backupDir, name)))}`);
}

function restore(name) {
  const all = listBackups();
  if (!name || !all.includes(name)) {
    console.error(name ? `Sauvegarde introuvable : ${name}` : 'Indiquer le nom de la sauvegarde à restaurer.');
    list();
    process.exit(1);
  }
  const source = path.join(backupDir, name);
  if (!isValidStore(path.join(source, 'data', 'store.json'))) {
    console.error('Cette sauvegarde est illisible : rien n\'a été modifié.');
    process.exit(1);
  }

  // L'état actuel est mis de côté avant d'être remplacé, pour pouvoir revenir en arrière.
  if (fs.existsSync(path.join(dataDir, 'store.json'))) {
    const aside = path.join(backupDir, `avant-restauration_${stamp()}`);
    fs.mkdirSync(path.join(aside, 'data'), { recursive: true });
    for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
      if (!entry.isFile() || SKIPPED.has(entry.name) || entry.name.endsWith('.tmp')) continue;
      fs.copyFileSync(path.join(dataDir, entry.name), path.join(aside, 'data', entry.name));
    }
    console.log(`État actuel mis de côté dans ${aside}`);
  }

  fs.mkdirSync(dataDir, { recursive: true });
  for (const entry of fs.readdirSync(path.join(source, 'data'), { withFileTypes: true })) {
    if (entry.isFile()) fs.copyFileSync(path.join(source, 'data', entry.name), path.join(dataDir, entry.name));
  }
  // La copie de secours interne date d'après la sauvegarde : elle ne doit pas reprendre la main.
  fs.rmSync(path.join(dataDir, 'store.backup.json'), { force: true });

  // Les photos sont rajoutées sans rien effacer : celles envoyées depuis restent en place.
  if (fs.existsSync(path.join(source, 'uploads'))) {
    fs.cpSync(path.join(source, 'uploads'), uploadsDir, { recursive: true });
  }

  console.log(`Sauvegarde ${name} restaurée. Redémarrer le site pour la prendre en compte.`);
}

const [command, argument] = process.argv.slice(2);
if (!command) create();
else if (command === 'liste') list();
else if (command === 'restaurer') restore(argument);
else {
  console.error('Commande inconnue. Usage : npm run backup [-- liste | -- restaurer <nom>]');
  process.exit(1);
}
