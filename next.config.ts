import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Static export for Capacitor APK
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['motion'],
  // Disable webpack caching to avoid snapshot errors
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
