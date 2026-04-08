import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['motion'],
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
