'use client';
import Clients from '@/modules/app/Clients';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';
export default function ClientsPage() {
  return (
    <ErrorBoundary>
      <Clients />
    </ErrorBoundary>
  );
}
