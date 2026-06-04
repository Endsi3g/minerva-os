'use client';
import Workflows from '@/modules/app/Workflows';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function WorkflowsPage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('workflows')) return <LockedFeaturePage featureKey="workflows" />;
  return <Workflows />;
}
