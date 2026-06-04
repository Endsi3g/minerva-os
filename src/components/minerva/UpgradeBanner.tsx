'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useLang } from '@/i18n';
import { useTier } from '@/lib/hooks/useTier';
import { UpgradeModal } from './UpgradeModal';
import type { FeatureKey } from '@/lib/types';

interface Props {
  featureKey: FeatureKey;
  show: boolean;
}

export function UpgradeBanner({ featureKey, show }: Props) {
  const { t } = useLang();
  const { isFeatureVisible, getUnlockHint } = useTier();
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(localStorage.getItem(`minerva_banner_dismissed_${featureKey}`) === '1');
    }
  }, [featureKey]);

  if (!show || isFeatureVisible(featureKey) || dismissed) return null;

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`minerva_banner_dismissed_${featureKey}`, '1');
    }
    setDismissed(true);
  }

  const hint = getUnlockHint(featureKey) ?? '';
  const u = t.upgrade;

  return (
    <>
      <div
        className="flex items-center gap-3 rounded-xl p-4 mb-4"
        style={{
          backgroundColor: '#111522',
          border: '1px solid rgba(255,255,255,0.07)',
          borderLeft: '2px solid #B89B6A',
        }}
      >
        <Sparkles size={14} className="shrink-0" style={{ color: '#B89B6A' }} />
        <p className="text-xs text-silver flex-1 leading-relaxed">{hint}</p>
        <button
          onClick={() => setModalOpen(true)}
          className="text-[11px] font-semibold shrink-0 px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'rgba(184,155,106,0.12)', color: '#B89B6A' }}
        >
          {u.banner.cta}
        </button>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-fog hover:text-silver transition-colors p-0.5"
        >
          <X size={13} />
        </button>
      </div>
      <UpgradeModal featureKey={featureKey} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
