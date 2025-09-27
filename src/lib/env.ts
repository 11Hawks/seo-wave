/**
 * Environment variable validation and configuration
 * Ensures type safety and validation for all environment variables
 */

import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    // Database
    DATABASE_URL: z.string().url(),
    
    // NextAuth.js
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),
    
    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    
    // Google APIs
    GOOGLE_SEARCH_CONSOLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_ANALYTICS_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_ANALYTICS_CLIENT_SECRET: z.string().min(1).optional(),
    
    // Stripe
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    
    // Redis
    REDIS_URL: z.string().url().optional(),
    
    // External APIs
    SERPAPI_API_KEY: z.string().min(1).optional(),
    DATAFORSEO_LOGIN: z.string().min(1).optional(),
    DATAFORSEO_PASSWORD: z.string().min(1).optional(),
    
    // Security
    JWT_SECRET: z.string().min(32),
    ENCRYPTION_KEY: z.string().min(32),
    
    // Rate Limiting
    RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).optional(),
    RATE_LIMIT_WINDOW: z.string().regex(/^\d+$/).transform(Number).optional(),
    
    // Monitoring
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    
    // Node Environment
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
  
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  },
  
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  runtimeEnv: {
    // Server
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_SEARCH_CONSOLE_CLIENT_ID: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
    GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
    GOOGLE_ANALYTICS_CLIENT_ID: process.env.GOOGLE_ANALYTICS_CLIENT_ID,
    GOOGLE_ANALYTICS_CLIENT_SECRET: process.env.GOOGLE_ANALYTICS_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
    DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN,
    DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
    
    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  
  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a URL, it'll throw. This might not be what you want.
   *
   * You can set this to `true` to skip the validation when building the app.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});