/**
 * tRPC Configuration
 * Base tRPC setup with context and middleware
 */

import { initTRPC } from '@trpc/server';
import { type NextRequest } from 'next/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

/**
 * Context type for tRPC
 */
export interface Context {
  req: NextRequest | undefined;
  // Add other context properties here
}

/**
 * Create context for tRPC
 */
export const createContext = ({ req }: { req?: NextRequest }): Context => {
  return {
    req,
  };
};

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware for authenticated procedures
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  // Add authentication logic here
  return next({
    ctx: {
      ...ctx,
      // Add authenticated user context
    },
  });
});

/**
 * Protected procedure helper
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);