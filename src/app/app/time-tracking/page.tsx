'use client';
import TimeTracking from '@/modules/app/TimeTracking';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function TimeTrackingPage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('time_tracking')) return <LockedFeaturePage featureKey="time_tracking" />;
  return <TimeTracking />;
}
