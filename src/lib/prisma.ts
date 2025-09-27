/**
 * Prisma Client configuration with connection pooling and error handling
 * Implements singleton pattern for optimal database connection management
 */

import { PrismaClient } from '@prisma/client';
import { env } from '@/lib/env';

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (env.NODE_ENV === 'production') {
  /**
   * Production: Create new instance
   */
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });
} else {
  /**
   * Development: Use global variable to prevent multiple instances
   * during hot reloads
   */
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
      log: ['query', 'error', 'warn'],
      errorFormat: 'pretty',
    });
  }
  
  prisma = global.cachedPrisma;
}

/**
 * Graceful shutdown handler
 */
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Database transaction wrapper with error handling
 */
export async function withTransaction<T>(
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback as any, {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
    isolationLevel: 'ReadCommitted',
  });
}

export { prisma };