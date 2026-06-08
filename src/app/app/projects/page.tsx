import { Suspense } from 'react';
import Projects from '@/modules/app/Projects';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  return (
    <ErrorBoundary>
      <Suspense>
        <Projects />
      </Suspense>
    </ErrorBoundary>
  );
}
