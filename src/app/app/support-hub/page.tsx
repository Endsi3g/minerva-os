'use client';
import SupportHub from '@/modules/app/SupportHub';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function SupportHubPage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('support_hub')) return <LockedFeaturePage featureKey="support_hub" />;
  return <SupportHub />;
}
