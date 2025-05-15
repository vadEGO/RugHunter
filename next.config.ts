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
      // This tells Next.js: "When you trace any .js files in the .next/server/app directory
      // (which are the server-side parts of your App Router pages/components),
      // also include the './data/rugged-wallets.json' file from the project root."
      // This should copy data/rugged-wallets.json to /var/task/data/rugged-wallets.json
      'app/**/*.js': ['./data/rugged-wallets.json'],
    },
  },
};

export default nextConfig;
