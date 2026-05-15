import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // Only register SW in production to avoid dev-mode cache issues
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  // tsconfig "paths" (@/* → src/*) are auto-resolved by Next.js — no extra aliases needed.
};

export default withSerwist(nextConfig);
