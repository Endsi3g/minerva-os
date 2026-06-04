'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Palette, Target, FileText, Code2, Layers, Users,
  CheckCircle2, ArrowLeft, ArrowRight, Rocket,
  Check, Sparkles,
} from 'lucide-react';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { deriveTier } from '@/lib/tier';
import { applySetupKit } from '@/lib/setup-kits';
import type { AgencyType } from '@/lib/types';
import { toast } from 'sonner';

const AGENCY_ICONS: Record<string, React.ElementType> = {
  branding: Palette,
  paid_media: Target,
  content: FileText,
  dev_shop: Code2,
  full_service: Layers,
  fractional_team: Users,
};

interface WizardState {
  referralSource: string | null;
  agencyName: string;
  logoFile: File | null;
  agencyType: AgencyType | null;
  teamSize: string | null;
  goals: string[];
  selectedPlan: string | null;
  billingCycle: 'monthly' | 'annual';
}

const TOTAL_STEPS = 8;

export function AgencySetupWizard() {
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuth();
  const { setWorkspaceProfile } = useWorkspace();
  const ob = t.onboarding;

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<WizardState>({
    referralSource: null,
    agencyName: '',
    logoFile: null,
    agencyType: null,
    teamSize: null,
    goals: [],
    selectedPlan: null,
    billingCycle: 'monthly',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function patch(updates: Partial<WizardState>) {
    setState(prev => ({ ...prev, ...updates }));
  }

  function canAdvance(): boolean {
    if (step === 1) return state.referralSource !== null;
    if (step === 2) return state.agencyName.trim().length > 0;
    if (step === 3) return state.agencyType !== null;
    if (step === 4) return state.teamSize !== null;
    if (step === 5) return state.goals.length > 0;
    return true;
  }

  function toggleGoal(value: string) {
    setState(prev => {
      const has = prev.goals.includes(value);
      if (has) return { ...prev, goals: prev.goals.filter(g => g !== value) };
      if (prev.goals.length >= 3) return prev;
      return { ...prev, goals: [...prev.goals, value] };
    });
  }

  async function handleSkip() {
    const toastId = toast.loading('Skipping setup...');
    try {
      if (!user) return;

      // 1. Fetch or create a default workspace
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .maybeSingle();

      let workspaceId = ws?.id;

      if (!workspaceId) {
        const slug = `agency-${Math.random().toString(36).substring(2, 6)}`;
        const { data: newWs, error: wsError } = await supabase
          .from('workspaces')
          .insert({
            name: 'My Agency',
            slug,
            owner_user_id: user.id,
            workspace_tier: 'scale',
          })
          .select('id')
          .single();

        if (wsError) throw wsError;
        workspaceId = newWs.id;
      }

      // 2. Link user profile to workspace and mark onboarding completed
      await supabase.from('user_profiles').update({
        onboarding_completed: true,
        workspace_id: workspaceId,
      }).eq('user_id', user.id);

      // 3. Update local context state
      setWorkspaceProfile({
        onboardingComplete: true,
        id: workspaceId,
        tier: 'scale',
      });

      toast.success('Setup skipped', { id: toastId });
      router.push('/app/dashboard');
    } catch (err) {
      console.error('Failed to skip setup:', err);
      toast.error('Failed to skip setup.', { id: toastId });
    }
  }

  async function handleSubmit() {
    if (!user) return;
    setIsSubmitting(true);
    const toastId = toast.loading(ob.toastSaving || 'Configuring workspace...');

    try {
      const tier = deriveTier(state.teamSize ?? '1-5');

      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .maybeSingle();

      let workspaceId = ws?.id;

      if (workspaceId) {
        await supabase.from('workspaces').update({
          workspace_tier: tier,
          agency_type: state.agencyType,
          team_size: state.teamSize,
          priority_goals: state.goals,
          name: state.agencyName || undefined,
        }).eq('id', workspaceId);
      } else {
        const name = state.agencyName || 'My Agency';
        const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
        const { data: newWs, error: insertError } = await supabase
          .from('workspaces')
          .insert({
            name,
            slug,
            owner_user_id: user.id,
            workspace_tier: tier,
            agency_type: state.agencyType,
            team_size: state.teamSize,
            priority_goals: state.goals,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        workspaceId = newWs.id;
      }

      await supabase.from('user_profiles').update({
        onboarding_completed: true,
        workspace_id: workspaceId,
      }).eq('user_id', user.id);

      if (state.agencyType) {
        await applySetupKit(workspaceId, state.agencyType, tier);
      }

      setWorkspaceProfile({
        tier,
        agencyType: state.agencyType,
        onboardingComplete: true,
        teamSize: state.teamSize,
        priorityGoals: state.goals,
        setupKitApplied: true,
        name: state.agencyName,
        id: workspaceId,
      });

      toast.success(ob.toastSuccess || 'Workspace configured!', { id: toastId });
      router.push('/app/dashboard');
    } catch (err) {
      console.error('Onboarding submit error', err);
      toast.error('Failed to configure workspace.', { id: toastId });
      setIsSubmitting(false);
    }
  }

  const derivedTier = state.teamSize ? deriveTier(state.teamSize) : null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ backgroundColor: '#090909' }}
    >
      {/* Progress bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px]" style={{ color: '#999999' }}>
            {ob.stepLabel.replace('{{current}}', String(step)).replace('{{total}}', String(TOTAL_STEPS))}
          </span>
          <button
            onClick={handleSkip}
            className="text-[11px] hover:text-white/70 transition-colors"
            style={{ color: '#999999' }}
          >
            {ob.skip}
          </button>
        </div>
        <div className="h-[2px] rounded-full" style={{ backgroundColor: '#262626' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#ffffff' }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
        <div className="flex mt-2 gap-1">
          {ob.steps.map((label, i) => (
            <span
              key={i}
              className="text-[10px] flex-1 text-center truncate transition-colors"
              style={{ color: i + 1 <= step ? '#ffffff' : '#4A5060' }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 1 && <StepDiscovery ob={ob} state={state} patch={patch} />}
            {step === 2 && <StepAgencyName ob={ob} state={state} patch={patch} fileInputRef={fileInputRef} />}
            {step === 3 && <StepAgencyType ob={ob} state={state} patch={patch} />}
            {step === 4 && <StepTeamSize ob={ob} state={state} patch={patch} derivedTier={derivedTier} />}
            {step === 5 && <StepGoals ob={ob} state={state} toggleGoal={toggleGoal} />}
            {step === 6 && <StepKitPreview ob={ob} state={state} isSubmitting={isSubmitting} />}
            {step === 7 && <StepChoosePlan ob={ob} state={state} patch={patch} />}
            {step === 8 && <StepGetStarted ob={ob} isSubmitting={isSubmitting} handleSubmit={handleSubmit} />}
          </motion.div>
        </AnimatePresence>
      </div>


      {/* Navigation */}
      <div className="w-full max-w-lg mt-8 flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          className={`flex items-center gap-2 text-sm transition-colors ${
            step === 1 ? 'opacity-0 pointer-events-none' : 'hover:text-white/70'
          }`}
          style={{ color: '#999999' }}
        >
          <ArrowLeft size={14} />
          {ob.back}
        </button>

        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: canAdvance() ? '#ffffff' : 'rgba(255,255,255,0.10)',
              color: canAdvance() ? '#000000' : '#4A5060',
              cursor: canAdvance() ? 'pointer' : 'not-allowed',
            }}
          >
            {ob.continue}
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: isSubmitting ? 'rgba(255,255,255,0.3)' : '#ffffff',
              color: '#000000',
            }}
          >
            {isSubmitting ? ob.step6.launching : ob.step8.launchCta}
            <Rocket size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Discovery — How did you find us? ──────────────────────────────────

function StepDiscovery({
  ob, state, patch,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {ob.step1.heading}
        </h1>
        <p className="text-sm" style={{ color: '#999999' }}>{ob.step1.subheading}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ob.step1.options.map(opt => {
          const isSelected = state.referralSource === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => patch({ referralSource: opt.value })}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                backgroundColor: isSelected ? '#1c1c1c' : '#141414',
                border: isSelected
                  ? '1px solid rgba(255,255,255,0.25)'
                  : '1px solid #262626',
              }}
            >
              <p className="text-sm font-medium" style={{ color: isSelected ? '#ffffff' : '#e7eaf0' }}>
                {opt.label}
              </p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#999999' }}>{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Agency name + logo ────────────────────────────────────────────────

function StepAgencyName({
  ob, state, patch, fileInputRef,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {ob.step2.heading}
        </h1>
        <p className="text-sm" style={{ color: '#999999' }}>{ob.step2.subheading}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#e7eaf0' }}>{ob.step2.agencyNameLabel}</label>
          <input
            type="text"
            value={state.agencyName}
            onChange={e => patch({ agencyName: e.target.value })}
            placeholder={ob.step2.agencyNamePlaceholder}
            autoFocus
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            style={{
              backgroundColor: '#141414',
              color: '#ffffff',
              border: '1px solid #262626',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onBlur={e => { e.target.style.borderColor = '#262626'; }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#e7eaf0' }}>{ob.step2.logoLabel}</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl px-4 py-3 text-sm transition-colors text-left"
            style={{
              backgroundColor: '#141414',
              color: '#999999',
              border: '1px dashed #262626',
            }}
          >
            {state.logoFile ? state.logoFile.name : ob.step2.logoHint}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={e => patch({ logoFile: e.target.files?.[0] ?? null })}
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Agency type ───────────────────────────────────────────────────────

function StepAgencyType({
  ob, state, patch,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
}) {
  const types = Object.entries(ob.step3.types);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {ob.step3.heading}
        </h1>
        <p className="text-sm" style={{ color: '#999999' }}>{ob.step3.subheading}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {types.map(([key, type]) => {
          const Icon = AGENCY_ICONS[key] ?? Layers;
          const isSelected = state.agencyType === key;
          return (
            <button
              key={key}
              onClick={() => patch({ agencyType: key as AgencyType })}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                backgroundColor: isSelected ? '#1c1c1c' : '#141414',
                border: isSelected
                  ? '1px solid rgba(255,255,255,0.25)'
                  : '1px solid #262626',
              }}
            >
              <Icon size={18} className="mb-2" style={{ color: isSelected ? '#ffffff' : '#999999' }} />
              <p className="text-sm font-medium" style={{ color: isSelected ? '#ffffff' : '#e7eaf0' }}>
                {type.label}
              </p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#999999' }}>{type.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: Team size ─────────────────────────────────────────────────────────

const TIER_BADGE_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  starter: { backgroundColor: 'rgba(127,163,138,0.15)', color: '#7FA38A' },
  growth:  { backgroundColor: 'rgba(184,155,106,0.15)', color: '#B89B6A' },
  scale:   { backgroundColor: 'rgba(184,189,199,0.15)', color: '#B8BDC7' },
};

function StepTeamSize({
  ob, state, patch, derivedTier,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
  derivedTier: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {ob.step4.heading}
        </h1>
        <p className="text-sm" style={{ color: '#999999' }}>{ob.step4.subheading}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ob.step4.options.map(opt => {
          const isSelected = state.teamSize === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => patch({ teamSize: opt.value })}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                backgroundColor: isSelected ? '#1c1c1c' : '#141414',
                border: isSelected
                  ? '1px solid rgba(255,255,255,0.25)'
                  : '1px solid #262626',
              }}
            >
              <p className="text-lg font-bold" style={{ color: isSelected ? '#ffffff' : '#e7eaf0' }}>
                {opt.label}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: '#999999' }}>{opt.desc}</p>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {derivedTier && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#141414', border: '1px solid #262626' }}
          >
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
              style={TIER_BADGE_COLORS[derivedTier]}
            >
              {derivedTier}
            </span>
            <span className="text-sm" style={{ color: '#e7eaf0' }}>
              {ob.step4.tierPreview[derivedTier as keyof typeof ob.step4.tierPreview]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Step 5: Goals ─────────────────────────────────────────────────────────────

function StepGoals({
  ob, state, toggleGoal,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  state: WizardState;
  toggleGoal: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {ob.step5.heading}
        </h1>
        <p className="text-sm" style={{ color: '#999999' }}>
          {ob.step5.subheading}
          <span className="ml-1" style={{ color: '#666' }}>({ob.step5.maxSelection})</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ob.step5.goals.map(goal => {
          const isSelected = state.goals.includes(goal.value);
          const isDisabled = !isSelected && state.goals.length >= 3;
          return (
            <button
              key={goal.value}
              onClick={() => !isDisabled && toggleGoal(goal.value)}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                backgroundColor: isSelected ? '#1c1c1c' : '#141414',
                border: isSelected
                  ? '1px solid rgba(255,255,255,0.25)'
                  : '1px solid #262626',
                opacity: isDisabled ? 0.4 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium" style={{ color: isSelected ? '#ffffff' : '#e7eaf0' }}>
                  {goal.label}
                </p>
                {isSelected && <CheckCircle2 size={14} style={{ color: '#22c55e', flexShrink: 0 }} />}
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: '#999999' }}>{goal.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 6: Kit preview ───────────────────────────────────────────────────────

function StepKitPreview({
  ob, state, isSubmitting,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  state: WizardState;
  isSubmitting: boolean;
}) {
  const agencyLabel = state.agencyType
    ? ob.step3.types[state.agencyType]?.label ?? state.agencyType
    : '';

  const heading = ob.step6.heading.replace('{{agencyType}}', agencyLabel);
  const projectsLine = ob.step6.previewItems.projects.replace('{{count}}', '3');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {heading}
        </h1>
        <p className="text-sm" style={{ color: '#999999' }}>{ob.step6.subheading}</p>
      </div>

      <div
        className="rounded-xl p-5 space-y-3"
        style={{ backgroundColor: '#141414', border: '1px solid #262626' }}
      >
        {[
          projectsLine,
          ob.step6.previewItems.services,
          ob.step6.previewItems.workflows,
          ob.step6.previewItems.dashboard,
        ].map((line, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: '#22c55e' }}
            />
            <span className="text-sm" style={{ color: '#e7eaf0' }}>{line}</span>
          </div>
        ))}
      </div>

      {isSubmitting && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-center"
          style={{ color: '#999999' }}
        >
          {ob.step6.launching}
        </motion.p>
      )}
    </div>
  );
}

// ── Step 7: Choose your plan ──────────────────────────────────────────────────

function StepChoosePlan({
  ob, state, patch,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
}) {
  const s7 = ob.step7;
  const isAnnual = state.billingCycle === 'annual';
  const plans = [
    { key: 'starter', ...s7.plans.starter, featured: false },
    { key: 'growth', ...s7.plans.growth, featured: true },
    { key: 'scale', ...s7.plans.scale, featured: false },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {s7.heading}
        </h1>
        <p className="text-sm" style={{ color: '#999999' }}>{s7.subheading}</p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-1 p-1 rounded-full mx-auto w-fit" style={{ backgroundColor: '#141414' }}>
        <button
          onClick={() => patch({ billingCycle: 'monthly' })}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
          style={{
            backgroundColor: !isAnnual ? '#1c1c1c' : 'transparent',
            color: !isAnnual ? '#ffffff' : '#999999',
          }}
        >
          {s7.monthly}
        </button>
        <button
          onClick={() => patch({ billingCycle: 'annual' })}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
          style={{
            backgroundColor: isAnnual ? '#1c1c1c' : 'transparent',
            color: isAnnual ? '#ffffff' : '#999999',
          }}
        >
          {s7.annual}
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
            {s7.annualSave}
          </span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-3">
        {plans.map(plan => {
          const isSelected = state.selectedPlan === plan.key;
          const price = isAnnual ? Math.round(plan.annualPrice / 12) : plan.price;

          return (
            <button
              key={plan.key}
              onClick={() => patch({ selectedPlan: plan.key })}
              className="text-left rounded-xl p-4 transition-all relative flex flex-col"
              style={{
                backgroundColor: plan.featured ? '#1c1c1c' : '#141414',
                border: isSelected
                  ? '1px solid rgba(255,255,255,0.3)'
                  : plan.featured
                    ? '1px solid rgba(255,255,255,0.12)'
                    : '1px solid #262626',
              }}
            >
              {plan.featured && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(184,155,106,0.15)', color: '#B89B6A' }}
                >
                  {s7.popular}
                </span>
              )}
              <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>{plan.name}</p>
              <div className="flex items-baseline gap-0.5 mt-2">
                <span className="text-2xl font-bold" style={{ color: '#ffffff' }}>${price}</span>
                <span className="text-xs" style={{ color: '#999999' }}>{s7.perMonth}</span>
              </div>
              <p className="text-[11px] mt-1 mb-3" style={{ color: '#999999' }}>{plan.desc}</p>

              <div className="space-y-1.5 flex-1">
                {plan.features.map((f, fi) => (
                  <div key={fi} className="flex items-start gap-1.5">
                    <Check size={11} className="mt-0.5 shrink-0" style={{ color: '#22c55e' }} />
                    <span className="text-[11px] leading-snug" style={{ color: '#e7eaf0' }}>{f}</span>
                  </div>
                ))}
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3"
                >
                  <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 8: Get Started ───────────────────────────────────────────────────────

function StepGetStarted({
  ob, isSubmitting, handleSubmit,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
}) {
  const router = useRouter();
  const s8 = ob.step8;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#1c1c1c', border: '1px solid #262626' }}
          >
            <Sparkles size={24} style={{ color: '#ffffff' }} />
          </motion.div>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {s8.heading}
        </h1>
        <p className="text-sm" style={{ color: '#999999' }}>{s8.subheading}</p>
      </div>

      <div className="space-y-3">
        {s8.actions.map((action, i) => (
          <motion.button
            key={action.value}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 * i, ease: [0.23, 1, 0.32, 1] }}
            onClick={async () => {
              await handleSubmit();
              router.push(action.href);
            }}
            disabled={isSubmitting}
            className="w-full text-left rounded-xl p-5 transition-all group"
            style={{
              backgroundColor: '#141414',
              border: '1px solid #262626',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#ffffff' }}>{action.label}</p>
                <p className="text-[12px] mt-0.5" style={{ color: '#999999' }}>{action.desc}</p>
              </div>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" style={{ color: '#999999' }} />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
