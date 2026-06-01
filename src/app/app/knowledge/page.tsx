'use client';
import KnowledgeBase from '@/modules/app/KnowledgeBase';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';
export default function KnowledgeBasePage() {
  return (
    <ErrorBoundary>
      <KnowledgeBase />
    </ErrorBoundary>
  );
}
