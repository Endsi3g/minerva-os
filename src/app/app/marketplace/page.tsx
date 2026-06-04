'use client';
import Marketplace from '@/modules/app/Marketplace';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function MarketplacePage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('marketplace')) return <LockedFeaturePage featureKey="marketplace" />;
  return <Marketplace />;
}
