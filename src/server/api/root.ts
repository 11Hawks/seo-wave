/**
 * tRPC API Root Router
 * Combines all API routers into a single router
 */

import { router } from '@/server/api/trpc';

/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = router({
  // Add your routers here
  // example: exampleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;