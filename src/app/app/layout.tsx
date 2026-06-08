import { Suspense } from 'react';
import AppShell from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ErrorBoundary>
        <Suspense>
          {children}
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}
