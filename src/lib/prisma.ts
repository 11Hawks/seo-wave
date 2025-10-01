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

// Check if we're in preview mode or if database should be disabled
const isPreviewMode = process.env.PREVIEW_MODE === 'true' || process.env.DISABLE_AUTH === 'true';

// Mock Prisma client for preview mode
const createMockPrisma = () => {
  const mockMethods = {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    upsert: () => Promise.resolve({}),
    count: () => Promise.resolve(0),
    aggregate: () => Promise.resolve({}),
    groupBy: () => Promise.resolve([]),
  };

  return {
    user: mockMethods,
    organization: mockMethods,
    organizationMember: mockMethods,
    account: mockMethods,
    auditLog: mockMethods,
    project: mockMethods,
    keyword: mockMethods,
    confidenceAlert: mockMethods,
    $queryRaw: () => Promise.resolve([]),
    $executeRaw: () => Promise.resolve(0),
    $transaction: (callback: any) => callback(mockPrisma),
    $disconnect: () => Promise.resolve(),
    $connect: () => Promise.resolve(),
  } as unknown as PrismaClient;
};

let prisma: PrismaClient;

if (isPreviewMode) {
  // Preview mode: Use mock client
  prisma = createMockPrisma();
} else if (env.NODE_ENV === 'production') {
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
    try {
      global.cachedPrisma = new PrismaClient({
        datasources: {
          db: {
            url: env.DATABASE_URL,
          },
        },
        log: ['error', 'warn'], // Reduced logging for development
        errorFormat: 'pretty',
      });
    } catch (error) {
      console.warn('Prisma client initialization failed, using mock client:', error);
      global.cachedPrisma = createMockPrisma();
    }
  }
  
  prisma = global.cachedPrisma;
}

// Create reference to mock for $transaction
const mockPrisma = prisma;

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
  if (isPreviewMode) {
    return true; // Always return true in preview mode
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('Database connection failed, using mock mode:', error);
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