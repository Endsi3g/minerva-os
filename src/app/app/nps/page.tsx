'use client';
import NPSPage from '@/modules/app/NPS';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function NPSRoute() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('nps')) return <LockedFeaturePage featureKey="nps" />;
  return <NPSPage />;
}
