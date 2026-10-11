import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null };

export const hasDatabase = Boolean(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('VOTRE_MOT_DE_PASSE') &&
  !process.env.DATABASE_URL.includes('your_password')
);

export const prisma: PrismaClient | null = hasDatabase
  ? (globalForPrisma.prisma ||
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      }))
  : null;

if (hasDatabase && process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

