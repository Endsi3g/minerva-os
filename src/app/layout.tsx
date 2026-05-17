import type { Metadata, Viewport } from 'next';
import { Providers } from '@/providers';
import Script from 'next/script';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Minerva OS',
  description: 'The agency operating system for Uprising Studio — CRM, projects, billing and AI agents.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Minerva',
  },
  icons: {
    apple: '/icons/icon-192.png',
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0D14',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Mautic Tracking */}
        <Script id="mautic-tracking" strategy="afterInteractive">
          {`
            (function(w,d,t,u,n,a,m){w['MauticTrackingObject']=n;
                w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)},a=d.createElement(t),
                m=d.getElementsByTagName(t)[0];a.async=1;a.src=u;m.parentNode.insertBefore(a,m)
            })(window,document,'script','https://mautic.yourdomain.com/mtc.js','mt');
            mt('send', 'pageview');
          `}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
