import type { Metadata } from 'next';
import { Providers } from '@/providers';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Minerva OS',
  description: 'The agency operating system for Uprising Studio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
