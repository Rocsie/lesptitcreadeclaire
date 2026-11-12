import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { BASE_PATH } from './paths';
import { DATA_DIR, StoreError, store, type StoredUser } from './store';
import type { User } from './types';

export const SESSION_COOKIE = 'pcc_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours
const DEFAULT_ADMIN_EMAIL = 'admin@lesptitescreadeclaire.com';

let cachedSecret: string | null = null;

// AUTH_SECRET vient du .env. S'il manque, une clé aléatoire est créée une fois
// dans le dossier de données pour que les sessions survivent aux redémarrages.
function getSecret(): string {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 32 && !fromEnv.startsWith('votre_')) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }
  const file = path.join(DATA_DIR, '.auth-secret');
  try {
    const existing = fs.readFileSync(file, 'utf-8').trim();
    if (existing.length >= 32) {
      cachedSecret = existing;
      return cachedSecret;
    }
  } catch {
    // premier démarrage : le fichier n'existe pas encore
  }
  const generated = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, generated, { encoding: 'utf-8', mode: 0o600 });
  cachedSecret = generated;
  return cachedSecret;
}

// Changer de mot de passe modifie cette empreinte et invalide donc les anciennes sessions.
function passwordVersion(passwordHash: string): string {
  return crypto.createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch {
    return false;
  }
}

export function checkPasswordStrength(password: unknown): string {
  if (typeof password !== 'string' || password.length < 8) {
    throw new StoreError('Le mot de passe doit contenir au moins 8 caractères.');
  }
  if (password.length > 200) throw new StoreError('Le mot de passe est trop long.');
  return password;
}

async function isSecureRequest(): Promise<boolean> {
  const h = await headers();
  const proto = (h.get('x-forwarded-proto') || '').split(',')[0].trim();
  return proto === 'https';
}

export async function startSession(user: StoredUser): Promise<void> {
  const token = jwt.sign({ sub: user.id, pv: passwordVersion(user.passwordHash) }, getSecret(), {
    algorithm: 'HS256',
    expiresIn: SESSION_MAX_AGE,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: await isSecureRequest(),
    path: BASE_PATH || '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: await isSecureRequest(),
    path: BASE_PATH || '/',
    maxAge: 0,
  });
}

/** Utilisateur connecté, ou null. Le compte est relu à chaque fois : un compte supprimé perd l'accès. */
export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub) return null;
    const stored = await store.getStoredUserById(String(payload.sub));
    if (!stored || payload.pv !== passwordVersion(stored.passwordHash)) return null;
    return {
      id: stored.id,
      email: stored.email,
      firstName: stored.firstName,
      lastName: stored.lastName,
      phone: stored.phone ?? null,
      role: stored.role,
      createdAt: stored.createdAt,
    };
  } catch {
    return null;
  }
}

/** À placer en tête des routes d'administration. Renvoie l'admin, ou la réponse d'erreur à retourner. */
export async function requireAdmin(): Promise<User | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Accès réservé à la gestionnaire.' }, { status: 403 });
  return user;
}

/**
 * Crée le compte gestionnaire au premier démarrage.
 * Identifiants pris dans ADMIN_EMAIL / ADMIN_PASSWORD. Sans mot de passe fourni,
 * un mot de passe aléatoire est écrit dans DATA_DIR/admin-initial-password.txt.
 */
export async function ensureAdminAccount(): Promise<void> {
  if (await store.hasAdmin()) return;

  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const fromEnv = process.env.ADMIN_PASSWORD;
  const usable = Boolean(fromEnv && fromEnv.length >= 8 && !fromEnv.startsWith('votre_'));
  const password = usable ? (fromEnv as string) : crypto.randomBytes(12).toString('base64url');
  const passwordHash = await hashPassword(password);

  try {
    if (await store.hasAdmin()) return;
    await store.createUser({
      email,
      passwordHash,
      firstName: 'Claire',
      lastName: "L'Atelier",
      role: 'ADMIN',
    });
  } catch (err) {
    console.error('[auth] création du compte gestionnaire impossible', err);
    return;
  }

  if (!usable) {
    const file = path.join(DATA_DIR, 'admin-initial-password.txt');
    fs.writeFileSync(
      file,
      [
        'Compte gestionnaire créé automatiquement au premier démarrage.',
        `Email : ${email}`,
        `Mot de passe provisoire : ${password}`,
        '',
        'Changez ce mot de passe dans Administration > Paramètres, puis supprimez ce fichier.',
        '',
      ].join('\n'),
      { encoding: 'utf-8', mode: 0o600 }
    );
    console.warn(`[auth] Compte gestionnaire créé. Mot de passe provisoire dans ${file}`);
  }
}

// ---------------------------------------------------------------------------
// Limitation simple des tentatives (en mémoire, par processus)
// ---------------------------------------------------------------------------
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (v.resetAt < now) attempts.delete(k);
  }
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

// Derrière Apache, la dernière adresse de X-Forwarded-For est celle ajoutée par notre proxy :
// les précédentes sont fournies par le visiteur et pourraient être inventées.
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = (h.get('x-forwarded-for') || '').split(',').map((part) => part.trim()).filter(Boolean);
  return forwarded[forwarded.length - 1] || h.get('x-real-ip') || 'local';
}
