'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GitBranch,
  FileSignature,
  WalletCards,
  Sparkles,
  GitPullRequest,
  CalendarRange,
  Award,
  BarChart2,
  ShoppingBag,
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  BarChart,
  Headphones,
  Settings2,
  Layers,
  Palette,
  Key,
  Shield,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useLang } from '@/i18n';
import { useTier } from '@/lib/hooks/useTier';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { FEATURE_MIN_TIER } from '@/lib/tier';
import type { FeatureKey, WorkspaceTier } from '@/lib/types';

export const FEATURE_ICONS: Record<FeatureKey, React.ElementType> = {
  pipeline:      GitBranch,
  proposals:     FileSignature,
  finance_hub:   WalletCards,
  intelligence:  Sparkles,
  workflows:     GitPullRequest,
  resources:     CalendarRange,
  scorecards:    Award,
  nps:           BarChart2,
  marketplace:   ShoppingBag,
  knowledge:     BookOpen,
  expenses:      DollarSign,
  profitability: TrendingUp,
  time_tracking: Clock,
  reports:       BarChart,
  support_hub:     Headphones,
  agent_ops:       Settings2,
  multi_workspace: Layers,
  white_label:     Palette,
  api_access:      Key,
  governance:      Shield,
};

export const TIER_BADGE_COLORS: Record<WorkspaceTier, { backgroundColor: string; color: string }> = {
  starter: { backgroundColor: 'rgba(127,163,138,0.15)', color: '#7FA38A' },
  growth:  { backgroundColor: 'rgba(184,155,106,0.15)', color: '#B89B6A' },
  scale:   { backgroundColor: 'rgba(184,189,199,0.15)', color: '#B8BDC7' },
};

interface Props {
  featureKey: FeatureKey | null;
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ featureKey, open, onClose }: Props) {
  const { t } = useLang();
  const { tier } = useTier();
  const { workspace, setWorkspaceProfile } = useWorkspace();
  const [upgrading, setUpgrading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!featureKey) return null;

  const u = t.upgrade;
  const targetTier = FEATURE_MIN_TIER[featureKey];
  const Icon = FEATURE_ICONS[featureKey];
  const featureName = (u.plan.featureLabels as Record<string, string>)[featureKey] ?? featureKey;
  const hint = (t.tier.hints as Record<string, string>)[featureKey] ?? '';
  const targetColors = TIER_BADGE_COLORS[targetTier];
  const currentColors = TIER_BADGE_COLORS[tier];

  async function handleUpgrade() {
    if (!workspace?.id || upgrading) return;
    setUpgrading(true);
    try {
      const { data: currentWs } = await supabase
        .from('workspaces')
        .select('settings')
        .eq('id', workspace.id)
        .maybeSingle();

      const currentSettings = currentWs?.settings || {};

      await supabase
        .from('workspaces')
        .update({
          settings: {
            ...currentSettings,
            workspace_tier: targetTier,
          },
        })
        .eq('id', workspace.id);
      setWorkspaceProfile({ tier: targetTier });
      if (typeof window !== 'undefined') {
        localStorage.setItem('minerva_workspace_tier', targetTier);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !upgrading) onClose(); }}>
      <DialogContent
        className="max-w-md"
        style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: targetColors.backgroundColor }}
            >
              <Icon size={20} style={{ color: targetColors.color }} />
            </div>
            <DialogTitle className="text-ivory text-lg font-semibold">
              {u.modal.title} {featureName}
            </DialogTitle>
          </div>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(127,163,138,0.15)' }}
            >
              <Check size={22} style={{ color: '#7FA38A' }} />
            </div>
            <p className="text-sm text-ivory text-center">{u.modal.success}</p>
          </div>
        ) : (
          <div className="space-y-5 pt-1">
            {/* Tier transition */}
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                style={currentColors}
              >
                {tier}
              </span>
              <ArrowRight size={13} className="text-fog" />
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                style={targetColors}
              >
                {targetTier}
              </span>
            </div>

            {/* Hint */}
            <p className="text-sm text-silver leading-relaxed">{hint}</p>

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full h-10 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
              >
                {upgrading ? '...' : u.modal.cta.replace('{tier}', targetTier)}
              </button>
              <button
                onClick={onClose}
                disabled={upgrading}
                className="w-full h-10 rounded-xl text-sm font-medium text-fog hover:text-silver transition-colors"
              >
                {u.modal.cancel}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
