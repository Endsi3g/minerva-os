import { Suspense } from 'react';
import Billing from '@/modules/app/Billing';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function BillingPage() {
  return (
    <ErrorBoundary>
      <Suspense>
        <Billing />
      </Suspense>
    </ErrorBoundary>
  );
}
