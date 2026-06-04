'use client';
import KnowledgeBase from '@/modules/app/KnowledgeBase';
import { ErrorBoundary } from '@/components/minerva/ErrorBoundary';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function KnowledgeBasePage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('knowledge')) return <LockedFeaturePage featureKey="knowledge" />;
  return (
    <ErrorBoundary>
      <KnowledgeBase />
    </ErrorBoundary>
  );
}
