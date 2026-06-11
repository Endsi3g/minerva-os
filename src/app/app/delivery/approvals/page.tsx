'use client';
import { Suspense } from 'react';
import Approvals from '@/modules/app/Approvals';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function ApprovalsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-6 text-center text-xs text-muted-foreground">Loading approvals...</div>}>
        <Approvals />
      </Suspense>
    </ErrorBoundary>
  );
}
