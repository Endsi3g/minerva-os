'use client';
import Billing from '@/modules/app/Billing';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';
export default function BillingPage() {
  return (
    <ErrorBoundary>
      <Billing />
    </ErrorBoundary>
  );
}
