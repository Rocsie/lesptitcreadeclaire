// Définit ou réinitialise le mot de passe du compte gestionnaire.
// Usage : npm run admin:password            (questions posées dans le terminal)
//         npm run admin:password -- email   (email fourni, mot de passe demandé)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), 'data');
const file = path.join(dataDir, 'store.json');
const seedFile = path.join(process.cwd(), 'data', 'seed.json');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const email = (process.argv[2] || (await rl.question('Email du compte gestionnaire : '))).trim().toLowerCase();
const password = (await rl.question('Nouveau mot de passe (8 caractères minimum) : ')).trim();
rl.close();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.error('Adresse email invalide.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Mot de passe trop court (8 caractères minimum).');
  process.exit(1);
}

const source = fs.existsSync(file) ? file : seedFile;
const data = JSON.parse(fs.readFileSync(source, 'utf-8'));
if (!Array.isArray(data.users)) data.users = [];

const passwordHash = await bcrypt.hash(password, 12);
const existing = data.users.find((u) => u.email.toLowerCase() === email);
if (existing) {
  existing.passwordHash = passwordHash;
  existing.role = 'ADMIN';
} else {
  data.users.push({
    id: `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    email,
    passwordHash,
    firstName: 'Claire',
    lastName: "L'Atelier",
    phone: null,
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
  });
}

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Mot de passe enregistré pour ${email}. Les anciennes sessions de ce compte sont fermées.`);
