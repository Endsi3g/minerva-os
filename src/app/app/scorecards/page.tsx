'use client';
import Scorecards from '@/modules/app/Scorecards';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function ScorecardsPage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('scorecards')) return <LockedFeaturePage featureKey="scorecards" />;
  return <Scorecards />;
}
