'use client';
import { Suspense } from 'react';
import SLARiskAudit from '@/modules/app/SLARiskAudit';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function SLARiskAuditPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-6 text-center text-xs text-muted-foreground">Loading SLA audit...</div>}>
        <SLARiskAudit />
      </Suspense>
    </ErrorBoundary>
  );
}
