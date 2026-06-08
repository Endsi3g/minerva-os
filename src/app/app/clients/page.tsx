import { Suspense } from 'react';
import Clients from '@/modules/app/Clients';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function ClientsPage() {
  return (
    <ErrorBoundary>
      <Suspense>
        <Clients />
      </Suspense>
    </ErrorBoundary>
  );
}
