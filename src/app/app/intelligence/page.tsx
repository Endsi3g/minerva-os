'use client';
import IntelligenceHub from '@/modules/app/IntelligenceHub';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function IntelligencePage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('intelligence')) return <LockedFeaturePage featureKey="intelligence" />;
  return <IntelligenceHub />;
}
