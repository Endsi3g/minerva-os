import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // Only register SW in production to avoid dev-mode cache issues
  disable: process.env.NODE_ENV === 'development' || process.env.DISABLE_SW === '1',
});

const nextConfig: NextConfig = {
  // tsconfig "paths" (@/* → src/*) are auto-resolved by Next.js — no extra aliases needed.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-tooltip',
      'recharts',
    ],
  },
};

export default withSerwist(nextConfig);
