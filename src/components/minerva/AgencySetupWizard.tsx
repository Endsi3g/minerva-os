'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import useMeasure from 'react-use-measure';

const ONBOARDING_BG_VIDEO = process.env.NEXT_PUBLIC_BG_VIDEO_URL ?? '';
import {
  Palette, Target, FileText, Code2, Layers, Users,
  CheckCircle2, ArrowLeft, ArrowRight, Rocket,
  Check, Sparkles,
} from 'lucide-react';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

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
  const [measureRef, { height }] = useMeasure();

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

      const res = await fetch('/api/workspace/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true, tier: 'scale' }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

      setWorkspaceProfile({
        onboardingComplete: true,
        id: json.workspaceId,
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

      const res = await fetch('/api/workspace/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: state.agencyName || undefined,
          agencyType: state.agencyType,
          teamSize: state.teamSize,
          goals: state.goals,
          tier,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

      const workspaceId: string = json.workspaceId;

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
      console.error('Onboarding submit error', err instanceof Error ? err.message : err);
      toast.error('Failed to configure workspace.', { id: toastId });
      setIsSubmitting(false);
    }
  }

  const derivedTier = state.teamSize ? deriveTier(state.teamSize) : null;

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Background video */}
      {ONBOARDING_BG_VIDEO && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src={ONBOARDING_BG_VIDEO} type="video/mp4" />
        </video>
      )}

      {/* Gradient overlay — darkens video while preserving atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: ONBOARDING_BG_VIDEO
            ? 'linear-gradient(to bottom, rgba(9,9,9,0.78) 0%, rgba(9,9,9,0.65) 50%, rgba(9,9,9,0.88) 100%)'
            : 'none',
        }}
      />

      {/* Vignette edges */}
      {ONBOARDING_BG_VIDEO && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            boxShadow: 'inset 0 0 120px rgba(0,0,0,0.6)',
          }}
        />
      )}

      {/* Content wrapper — above overlays */}
      <div className="relative w-full flex flex-col items-center" style={{ zIndex: 3 }}>

      {/* Progress bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {ob.stepLabel.replace('{{current}}', String(step)).replace('{{total}}', String(TOTAL_STEPS))}
          </span>
          <button
            onClick={handleSkip}
            className="text-[11px] hover:text-white/70 transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {ob.skip}
          </button>
        </div>
        <div className="h-[2px] rounded-full" style={{ backgroundColor: 'var(--border)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--foreground)' }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
        <div className="flex mt-2 gap-1">
          {ob.steps.map((label, i) => (
            <span
              key={i}
              className="text-[10px] flex-1 text-center truncate transition-colors"
              style={{ color: i + 1 <= step ? 'var(--foreground)' : 'var(--muted-foreground)' }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <motion.div
        animate={{ height: height > 0 ? height : 'auto' }}
        className="w-full max-w-lg overflow-hidden relative rounded-2xl"
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={ONBOARDING_BG_VIDEO ? {
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(9,9,9,0.55)',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '28px',
        } : undefined}
      >
        <div ref={measureRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
      </motion.div>


      {/* Navigation */}
      <div className="w-full max-w-lg mt-8 flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          className={`flex items-center gap-2 text-sm transition-colors ${
            step === 1 ? 'opacity-0 pointer-events-none' : 'hover:text-white/70'
          }`}
          style={{ color: 'var(--muted-foreground)' }}
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
              backgroundColor: canAdvance() ? 'var(--foreground)' : 'rgba(255,255,255,0.10)',
              color: canAdvance() ? 'var(--background)' : 'var(--muted-foreground)',
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
              backgroundColor: isSubmitting ? 'rgba(255,255,255,0.3)' : 'var(--foreground)',
              color: 'var(--background)',
            }}
          >
            {isSubmitting ? ob.step6.launching : ob.step8.launchCta}
            <Rocket size={14} />
          </button>
        )}
      </div>

      </div>{/* end content wrapper */}
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
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {ob.step1.heading}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{ob.step1.subheading}</p>
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
                backgroundColor: isSelected ? 'var(--secondary)' : 'var(--surface)',
                border: isSelected
                  ? '1px solid rgba(255,255,255,0.25)'
                  : '1px solid var(--border)',
              }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {opt.label}
              </p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--muted-foreground)' }}>{opt.desc}</p>
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
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {ob.step2.heading}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{ob.step2.subheading}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>{ob.step2.agencyNameLabel}</label>
          <input
            type="text"
            value={state.agencyName}
            onChange={e => patch({ agencyName: e.target.value })}
            placeholder={ob.step2.agencyNamePlaceholder}
            autoFocus
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>{ob.step2.logoLabel}</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl px-4 py-3 text-sm transition-colors text-left"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--muted-foreground)',
              border: '1px dashed var(--border)',
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
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {ob.step3.heading}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{ob.step3.subheading}</p>
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
                backgroundColor: isSelected ? 'var(--secondary)' : 'var(--surface)',
                border: isSelected
                  ? '1px solid rgba(255,255,255,0.25)'
                  : '1px solid var(--border)',
              }}
            >
              <Icon size={18} className="mb-2" style={{ color: 'var(--foreground)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {type.label}
              </p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--muted-foreground)' }}>{type.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: Team size ─────────────────────────────────────────────────────────

const TIER_BADGE_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  starter: { backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' },
  growth:  { backgroundColor: 'color-mix(in srgb, var(--warning) 15%, transparent)', color: 'var(--warning)' },
  scale:   { backgroundColor: 'color-mix(in srgb, var(--muted-foreground) 15%, transparent)', color: 'var(--muted-foreground)' },
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
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {ob.step4.heading}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{ob.step4.subheading}</p>
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
                backgroundColor: isSelected ? 'var(--secondary)' : 'var(--surface)',
                border: isSelected
                  ? '1px solid rgba(255,255,255,0.25)'
                  : '1px solid var(--border)',
              }}
            >
              <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                {opt.label}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{opt.desc}</p>
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
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
              style={TIER_BADGE_COLORS[derivedTier]}
            >
              {derivedTier}
            </span>
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>
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
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {ob.step5.heading}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {ob.step5.subheading}
          <span className="ml-1 text-muted-foreground">({ob.step5.maxSelection})</span>
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
                backgroundColor: isSelected ? 'var(--secondary)' : 'var(--surface)',
                border: isSelected
                  ? '1px solid rgba(255,255,255,0.25)'
                  : '1px solid var(--border)',
                opacity: isDisabled ? 0.4 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {goal.label}
                </p>
                {isSelected && <CheckCircle2 size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{goal.desc}</p>
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
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {heading}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{ob.step6.subheading}</p>
      </div>

      <div
        className="rounded-xl p-5 space-y-3"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
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
              style={{ backgroundColor: 'var(--primary)' }}
            />
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>{line}</span>
          </div>
        ))}
      </div>

      {isSubmitting && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-center"
          style={{ color: 'var(--muted-foreground)' }}
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
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {s7.heading}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{s7.subheading}</p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-1 p-1 rounded-full mx-auto w-fit" style={{ backgroundColor: 'var(--surface)' }}>
        <button
          onClick={() => patch({ billingCycle: 'monthly' })}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
          style={{
            backgroundColor: !isAnnual ? 'var(--secondary)' : 'transparent',
            color: !isAnnual ? 'var(--foreground)' : 'var(--muted-foreground)',
          }}
        >
          {s7.monthly}
        </button>
        <button
          onClick={() => patch({ billingCycle: 'annual' })}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
          style={{
            backgroundColor: isAnnual ? 'var(--secondary)' : 'transparent',
            color: isAnnual ? 'var(--foreground)' : 'var(--muted-foreground)',
          }}
        >
          {s7.annual}
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' }}>
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
                backgroundColor: plan.featured ? 'var(--secondary)' : 'var(--surface)',
                border: isSelected
                  ? '1px solid rgba(255,255,255,0.3)'
                  : plan.featured
                    ? '1px solid rgba(255,255,255,0.12)'
                    : '1px solid var(--border)',
              }}
            >
              {plan.featured && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 15%, transparent)', color: 'var(--warning)' }}
                >
                  {s7.popular}
                </span>
              )}
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{plan.name}</p>
              <div className="flex items-baseline gap-0.5 mt-2">
                <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>${price}</span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s7.perMonth}</span>
              </div>
              <p className="text-[11px] mt-1 mb-3" style={{ color: 'var(--muted-foreground)' }}>{plan.desc}</p>

              <div className="space-y-1.5 flex-1">
                {plan.features.map((f, fi) => (
                  <div key={fi} className="flex items-start gap-1.5">
                    <Check size={11} className="mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
                    <span className="text-[11px] leading-snug" style={{ color: 'var(--foreground)' }}>{f}</span>
                  </div>
                ))}
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3"
                >
                  <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
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
            style={{ backgroundColor: 'var(--secondary)', border: '1px solid var(--border)' }}
          >
            <Sparkles size={24} style={{ color: 'var(--foreground)' }} />
          </motion.div>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em' }}>
          {s8.heading}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{s8.subheading}</p>
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
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{action.label}</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{action.desc}</p>
              </div>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" style={{ color: 'var(--muted-foreground)' }} />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
