'use client';
import AppShell from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AppShell>
  );
}
