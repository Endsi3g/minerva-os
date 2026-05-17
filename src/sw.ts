import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // App shell pages — network first, fast fallback
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
      }),
    },
    // Static assets — cache first
    {
      matcher: ({ url }) => url.pathname.startsWith('/_next/static/'),
      handler: new CacheFirst({
        cacheName: 'next-static',
      }),
    },
    // Images — stale while revalidate
    {
      matcher: ({ request }) => request.destination === 'image',
      handler: new StaleWhileRevalidate({
        cacheName: 'images',
      }),
    },
    // Convex API — network only (real-time, never cache)
    {
      matcher: ({ url }) => url.hostname.includes('convex.cloud'),
      handler: new NetworkFirst({
        cacheName: 'convex-api',
        networkTimeoutSeconds: 5,
      }),
    },
  ],
  fallbacks: {
    entries: [
      { url: '/offline', matcher: ({ request }) => request.mode === 'navigate' },
    ],
  },
});

serwist.addEventListeners();
