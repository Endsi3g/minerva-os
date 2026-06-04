import { useWorkspace } from '@/contexts/WorkspaceContext';
import { isFeatureVisibleForTier } from '@/lib/tier';
import type { FeatureKey, WorkspaceTier, AgencyType } from '@/lib/types';

export interface TierHook {
  tier: WorkspaceTier;
  agencyType: AgencyType | null;
  isFeatureVisible: (key: FeatureKey) => boolean;
  getUnlockHint: (key: FeatureKey) => string | null;
}

const UNLOCK_HINTS: Record<FeatureKey, string> = {
  pipeline:      'Upgrade to Growth to unlock Pipeline analytics.',
  proposals:     'Proposals unlock on the Growth plan.',
  finance_hub:   'Finance Hub unlocks on Growth. Track margins, expenses and profitability.',
  intelligence:  'Intelligence Hub becomes available on the Growth plan.',
  workflows:     'Automated workflows unlock on the Growth plan.',
  resources:     'Resource planning unlocks on Growth for larger teams.',
  scorecards:    'Team Scorecards unlock on the Growth plan.',
  nps:           'NPS tracking is available on the Growth plan.',
  marketplace:   'The Marketplace unlocks on the Growth plan.',
  knowledge:     'Knowledge Base is available on the Growth plan.',
  expenses:      'Expense tracking unlocks on the Growth plan.',
  profitability: 'Profitability reports unlock on the Growth plan.',
  time_tracking: 'Time Tracking unlocks on the Growth plan.',
  reports:       'Advanced Reports unlock on the Growth plan.',
  support_hub:   'Support Hub unlocks on the Growth plan.',
  agent_ops:     'Agent Ops is a Scale plan feature for large agencies.',
};

export function useTier(): TierHook {
  const { workspace, isLoading } = useWorkspace();

  // While loading, default to 'scale' so no features flash-disappear
  const tier: WorkspaceTier = isLoading ? 'scale' : (workspace?.tier ?? 'scale');
  const agencyType = workspace?.agencyType ?? null;

  function isFeatureVisible(key: FeatureKey): boolean {
    return isFeatureVisibleForTier(key, tier);
  }

  function getUnlockHint(key: FeatureKey): string | null {
    if (isFeatureVisible(key)) return null;
    return UNLOCK_HINTS[key] ?? null;
  }

  return { tier, agencyType, isFeatureVisible, getUnlockHint };
}
