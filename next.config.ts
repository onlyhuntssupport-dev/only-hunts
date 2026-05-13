
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Externalize firebase and firebase-admin to prevent bundling issues on the server
  // especially when client SDKs are pre-rendered or used in server actions.
  serverExternalPackages: ['firebase-admin', 'firebase'],
  allowedDevOrigins: [
    "localhost:9003",
    "9003-firebase-studio-1771862059110.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev",
    "*.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev",
    "*.cloudworkstations.dev"
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Explicitly tell Next.js not to generate browser source maps to save memory
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
  webpack: (config, { dev }) => {
    // Disable webpack cache if we are hitting sync issues in Cloud Workstations
    config.cache = false;
    
    // Disable source maps in production to prevent 404 log spam and reduce bundle size
    if (!dev) {
      config.devtool = false;
    }
    
    return config;
  },
};

export default nextConfig;
