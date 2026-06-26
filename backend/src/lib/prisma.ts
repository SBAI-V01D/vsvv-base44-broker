import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// avaai Backend — Prisma Client Singleton
// Prevents multiple instances during hot-reload in development.
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient instance.
 * - Development: logs queries + errors + warnings
 * - Production: logs only errors
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
