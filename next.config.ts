import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // --- ADDED: Whitelist Cloud Workstation URLs to allow Hot Module Replacement (HMR)
  allowedDevOrigins: [
    "9003-firebase-studio-1771862059110.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev",
    "*.cloudworkstations.dev"
  ],
  
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
};

export default nextConfig;