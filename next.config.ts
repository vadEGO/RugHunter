import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      // This ensures that the 'data/rugged-wallets.json' file from your project root
      // is included in the serverless function bundle at 'data/rugged-wallets.json'
      // relative to the function's root directory (e.g., /var/task/data/rugged-wallets.json).
      'data/rugged-wallets.json': ['./data/rugged-wallets.json'],
    },
  },
};

export default nextConfig;
