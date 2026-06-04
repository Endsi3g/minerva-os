'use client';
import Profitability from '@/modules/app/Profitability';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function ProfitabilityPage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('profitability')) return <LockedFeaturePage featureKey="profitability" />;
  return <Profitability />;
}
