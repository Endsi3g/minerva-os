import { Suspense } from 'react';
import DeliveryHub from '@/modules/app/DeliveryHub';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function DeliveryPage() {
  return (
    <ErrorBoundary>
      <Suspense>
        <DeliveryHub />
      </Suspense>
    </ErrorBoundary>
  );
}
