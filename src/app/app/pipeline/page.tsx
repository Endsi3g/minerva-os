'use client';
import Pipeline from '@/modules/app/Pipeline';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';
export default function PipelinePage() {
  return (
    <ErrorBoundary>
      <Pipeline />
    </ErrorBoundary>
  );
}
