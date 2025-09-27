/**
 * Root Layout Component
 * Provides global providers and styling for the entire application
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClientSessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { TrpcProvider } from '@/components/providers/trpc-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import '@/styles/globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'SEO Analytics Platform - Transparent SEO Tools & Analytics',
    template: '%s | SEO Analytics Platform',
  },
  description: 'Professional SEO analytics platform with transparent billing, real-time data accuracy, and unlimited collaboration. Better than Semrush and Ahrefs.',
  keywords: [
    'SEO analytics',
    'keyword tracking',
    'backlink analysis', 
    'rank tracking',
    'SEO tools',
    'digital marketing',
    'search console',
    'competitor analysis',
    'site audit',
  ],
  authors: [{ name: 'SEO Analytics Platform' }],
  creator: 'SEO Analytics Platform',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'SEO Analytics Platform - Transparent SEO Tools & Analytics',
    description: 'Professional SEO analytics platform with transparent billing, real-time data accuracy, and unlimited collaboration.',
    siteName: 'SEO Analytics Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SEO Analytics Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO Analytics Platform - Transparent SEO Tools & Analytics',
    description: 'Professional SEO analytics platform with transparent billing, real-time data accuracy, and unlimited collaboration.',
    images: ['/og-image.png'],
    creator: '@seoplatform',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="origin-when-cross-origin" />
        
        {/* Performance hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//js.stripe.com" />
      </head>
      <body 
        className={`
          ${inter.className} 
          min-h-screen bg-background font-sans antialiased
          selection:bg-primary/20 selection:text-primary-foreground
        `}
        suppressHydrationWarning
      >
        <QueryProvider>
          <TrpcProvider>
            <ClientSessionProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {/* Skip to main content link for accessibility */}
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
                >
                  Skip to main content
                </a>
                
                {/* Main application content */}
                <div id="main-content" className="min-h-screen">
                  {children}
                </div>
                
                {/* Global toast notifications */}
                <Toaster />
              </ThemeProvider>
            </ClientSessionProvider>
          </TrpcProvider>
        </QueryProvider>
        
        {/* Performance monitoring and error tracking */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    anonymize_ip: true,
                    respect_consent: true,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}