import type { FeatureKey, WorkspaceTier } from './types';

const TIER_RANK: Record<WorkspaceTier, number> = {
  starter: 0,
  growth: 1,
  scale: 2,
};

export const FEATURE_MIN_TIER: Record<FeatureKey, WorkspaceTier> = {
  pipeline:      'starter',
  proposals:     'starter',
  finance_hub:   'growth',
  intelligence:  'growth',
  workflows:     'growth',
  resources:     'growth',
  scorecards:    'growth',
  nps:           'growth',
  marketplace:   'growth',
  knowledge:     'growth',
  expenses:      'growth',
  profitability: 'growth',
  time_tracking: 'growth',
  reports:       'growth',
  support_hub:   'growth',
  agent_ops:     'scale',
};

export function deriveTier(teamSize: string): WorkspaceTier {
  if (teamSize === '50+') return 'scale';
  if (teamSize === '16-50') return 'growth';
  return 'starter';
}

export function isFeatureVisibleForTier(key: FeatureKey, tier: WorkspaceTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[key]];
}
