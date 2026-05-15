import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // FIX: Force Next.js 15 to stop slicing Firebase into broken vendor chunks
  serverExternalPackages: ['firebase', 'firebase-admin'],
  
  allowedDevOrigins: [
    "localhost:9003",
    "9003-firebase-studio-1771862059110.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev",
    "*.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev",
    "*.cloudworkstations.dev"
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
    ],
  },
  
  // NEW: Silent Server Rewrites to intercept legacy bot requests
  async rewrites() {
    return [
      { source: '/favicon.ico', destination: '/icon.png' },
      { source: '/apple-touch-icon.png', destination: '/apple-icon.png' },
      { source: '/apple-touch-icon-precomposed.png', destination: '/apple-icon.png' },
    ];
  },

  webpack: (config, { dev }) => {
    config.cache = {
      type: 'memory',
    };
    
    // Hard-disable source maps in Webpack to guarantee no .map files are emitted
    if (!dev) {
      config.devtool = false;
    }
    
    return config;
  },
};

export default nextConfig;