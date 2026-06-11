'use client';
import { Suspense } from 'react';
import Contracts from '@/modules/app/Contracts';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function ContractsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-6 text-center text-xs text-muted-foreground">Loading contracts...</div>}>
        <Contracts />
      </Suspense>
    </ErrorBoundary>
  );
}
