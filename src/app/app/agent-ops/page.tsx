'use client';
import AgentOps from "@/modules/app/AgentOps";
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { useTier } from '@/lib/hooks/useTier';
export default function Page() {
  const { isFeatureVisible } = useTier();
  if (!isFeatureVisible('agent_ops')) return <LockedFeaturePage featureKey="agent_ops" />;
  return <AgentOps />;
}
