'use client';
import Projects from '@/modules/app/Projects';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';
export default function ProjectsPage() {
  return (
    <ErrorBoundary>
      <Projects />
    </ErrorBoundary>
  );
}
