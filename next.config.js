/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features
    // typedRoutes: true, // Disabled for now
    optimizeCss: true,
    // Reduce build memory usage
    craCompat: true,
  },
  
  // Development server configuration for sandbox environments
  ...(process.env.NODE_ENV === 'development' && {
    assetPrefix: '',
    allowedDevOrigins: [
      '3000-i9xc6i2n4ddg5o035yjm6-6532622b.e2b.dev',
      'localhost:3000',
      '127.0.0.1:3000'
    ],
  }),
  
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
  
  // Bundle analyzer and memory optimization
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = 'eval-source-map';
    }
    
    // Memory optimization for large projects
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\/]node_modules[\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
    
    // Reduce memory usage during builds
    config.parallelism = 1;
    
    return config;
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;