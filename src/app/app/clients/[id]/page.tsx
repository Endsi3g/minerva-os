'use client';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import ClientDetail from '@/modules/app/ClientDetail';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';

export const dynamic = 'force-dynamic';

export default function ClientDetailPage() {
  const { isFeatureVisible } = useTier();
  const params = useParams();
  const id = params?.id as string;

  if (!isFeatureVisible('pipeline')) {
    return <LockedFeaturePage featureKey="pipeline" />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-6 text-center text-xs text-muted-foreground">Loading client profile...</div>}>
        <ClientDetail clientId={id} />
      </Suspense>
    </ErrorBoundary>
  );
}
