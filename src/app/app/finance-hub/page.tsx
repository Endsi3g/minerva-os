'use client';
import FinanceHub from '@/modules/app/FinanceHub';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function FinanceHubPage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('finance_hub')) return <LockedFeaturePage featureKey="finance_hub" />;
  return <FinanceHub />;
}
