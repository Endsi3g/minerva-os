import { useWorkspace } from '@/contexts/WorkspaceContext';
import { isFeatureVisibleForTier, FEATURE_MIN_TIER } from '@/lib/tier';
import { useLang } from '@/i18n';
import type { FeatureKey, WorkspaceTier, AgencyType } from '@/lib/types';

export interface TierHook {
  tier: WorkspaceTier;
  agencyType: AgencyType | null;
  isFeatureVisible: (key: FeatureKey) => boolean;
  getUnlockHint: (key: FeatureKey) => string | null;
  getRequiredTier: (key: FeatureKey) => WorkspaceTier;
}

export function useTier(): TierHook {
  const { workspace, isLoading } = useWorkspace();
  const { t } = useLang();

  // While loading, default to 'scale' so no features flash-disappear
  const tier: WorkspaceTier = isLoading ? 'scale' : (workspace?.tier ?? 'scale');
  const agencyType = workspace?.agencyType ?? null;

  function isFeatureVisible(key: FeatureKey): boolean {
    return isFeatureVisibleForTier(key, tier);
  }

  function getRequiredTier(key: FeatureKey): WorkspaceTier {
    return FEATURE_MIN_TIER[key];
  }

  function getUnlockHint(key: FeatureKey): string | null {
    if (isFeatureVisible(key)) return null;
    return (t.tier.hints as Record<string, string>)[key] ?? null;
  }

  return { tier, agencyType, isFeatureVisible, getUnlockHint, getRequiredTier };
}
