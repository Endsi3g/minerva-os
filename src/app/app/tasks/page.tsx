'use client';
import Tasks from '@/modules/app/Tasks';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';
export default function TasksPage() {
  return (
    <ErrorBoundary>
      <Tasks />
    </ErrorBoundary>
  );
}
