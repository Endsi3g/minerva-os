'use client';
import { Suspense } from 'react';
import Clients from '@/modules/app/Clients';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';

export const dynamic = 'force-dynamic';

export default function ClientsPage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('pipeline')) {
    return <LockedFeaturePage featureKey="pipeline" />;
  }
  return (
    <ErrorBoundary>
      <Suspense>
        <Clients />
      </Suspense>
    </ErrorBoundary>
  );
}
