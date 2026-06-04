'use client';
import Expenses from '@/modules/app/Expenses';
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function ExpensesPage() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('expenses')) return <LockedFeaturePage featureKey="expenses" />;
  return <Expenses />;
}
