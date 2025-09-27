/**
 * Session Provider Wrapper
 * Client-side wrapper for NextAuth SessionProvider
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { type ReactNode } from 'react';

interface ClientSessionProviderProps {
  children: ReactNode;
}

export function ClientSessionProvider({ children }: ClientSessionProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}