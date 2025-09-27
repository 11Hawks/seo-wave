/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features
    // typedRoutes: true, // Disabled for now
  },
  
  // Performance optimizations
  swcMinify: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Bundle analyzer in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = 'eval-source-map';
    }
    
    return config;
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;