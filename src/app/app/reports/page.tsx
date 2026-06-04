'use client';
import Reports from '@/modules/app/Reports';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function ReportsPage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('reports')) return <LockedFeaturePage featureKey="reports" />;
  return <Reports />;
}
