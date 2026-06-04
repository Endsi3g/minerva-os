'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/i18n';
import { useTier } from '@/lib/hooks/useTier';
import { UpgradeModal, FEATURE_ICONS, TIER_BADGE_COLORS } from './UpgradeModal';
import { FEATURE_MIN_TIER } from '@/lib/tier';
import type { FeatureKey } from '@/lib/types';

export function LockedFeaturePage({ featureKey }: { featureKey: FeatureKey }) {
  const { t } = useLang();
  const { getUnlockHint } = useTier();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const u = t.upgrade;
  const Icon = FEATURE_ICONS[featureKey];
  const featureName = (u.plan.featureLabels as Record<string, string>)[featureKey] ?? featureKey;
  const hint = getUnlockHint(featureKey) ?? '';
  const targetTier = FEATURE_MIN_TIER[featureKey];
  const tierColors = TIER_BADGE_COLORS[targetTier];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: 'rgba(138,144,153,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Icon size={28} color="#8A9099" />
      </div>

      <div className="space-y-2 max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
            style={tierColors}
          >
            {targetTier}
          </span>
        </div>
        <h2
          className="text-2xl font-bold text-ivory"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {featureName}
        </h2>
        <p className="text-sm text-fog leading-relaxed">{hint}</p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
        >
          {u.modal.cta.replace('{tier}', targetTier)}
        </button>
        <button
          onClick={() => router.push('/app/dashboard')}
          className="h-10 rounded-xl text-sm font-medium text-fog hover:text-silver transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Back to Dashboard
        </button>
      </div>

      <UpgradeModal featureKey={featureKey} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
