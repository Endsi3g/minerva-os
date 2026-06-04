'use client';
import ResourcePlanning from '@/modules/app/ResourcePlanning';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function ResourcePlanningPage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('resources')) return <LockedFeaturePage featureKey="resources" />;
  return <ResourcePlanning />;
}
