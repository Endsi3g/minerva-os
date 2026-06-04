'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Palette, Target, FileText, Code2, Layers, Users,
  CheckCircle2, ArrowLeft, ArrowRight, Rocket,
} from 'lucide-react';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { deriveTier } from '@/lib/tier';
import { applySetupKit } from '@/lib/setup-kits';
import type { AgencyType } from '@/lib/types';

const AGENCY_ICONS: Record<string, React.ElementType> = {
  branding: Palette,
  paid_media: Target,
  content: FileText,
  dev_shop: Code2,
  full_service: Layers,
  fractional_team: Users,
};

interface WizardState {
  agencyName: string;
  logoFile: File | null;
  agencyType: AgencyType | null;
  teamSize: string | null;
  goals: string[];
}

const TOTAL_STEPS = 5;

export function AgencySetupWizard() {
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuth();
  const { setWorkspaceProfile } = useWorkspace();
  const ob = t.onboarding;

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<WizardState>({
    agencyName: '',
    logoFile: null,
    agencyType: null,
    teamSize: null,
    goals: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function patch(updates: Partial<WizardState>) {
    setState(prev => ({ ...prev, ...updates }));
  }

  function canAdvance(): boolean {
    if (step === 1) return state.agencyName.trim().length > 0;
    if (step === 2) return state.agencyType !== null;
    if (step === 3) return state.teamSize !== null;
    if (step === 4) return state.goals.length > 0;
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

  async function handleSubmit() {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const tier = deriveTier(state.teamSize ?? '1-5');

      // Fetch workspace id
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .maybeSingle();

      const workspaceId = ws?.id ?? 'mock-workspace-123';

      // Update workspace with tier + agency type
      await supabase.from('workspaces').update({
        workspace_tier: tier,
        agency_type: state.agencyType,
        team_size: state.teamSize,
        priority_goals: state.goals,
        name: state.agencyName || undefined,
      }).eq('id', workspaceId);

      // Mark onboarding complete on user profile
      await supabase.from('user_profiles').update({
        onboarding_complete: true,
      }).eq('user_id', user.id);

      // Apply setup kit
      if (state.agencyType) {
        await applySetupKit(workspaceId, state.agencyType, tier);
      }

      // Optimistic context update so sidebar re-renders immediately
      setWorkspaceProfile({
        tier,
        agencyType: state.agencyType,
        onboardingComplete: true,
        teamSize: state.teamSize,
        priorityGoals: state.goals,
        setupKitApplied: true,
        name: state.agencyName,
      });

      router.push('/app/dashboard');
    } catch (err) {
      console.error('Onboarding submit error', err);
      setIsSubmitting(false);
    }
  }

  const derivedTier = state.teamSize ? deriveTier(state.teamSize) : null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ backgroundColor: '#0A0D14' }}
    >
      {/* Progress bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-fog">
            {ob.stepLabel.replace('{{current}}', String(step)).replace('{{total}}', String(TOTAL_STEPS))}
          </span>
          <button
            onClick={() => router.push('/app/dashboard')}
            className="text-[11px] text-fog hover:text-silver transition-colors"
          >
            {ob.skip}
          </button>
        </div>
        <div className="h-[2px] rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#7FA38A' }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
        <div className="flex mt-2 gap-1">
          {ob.steps.map((label, i) => (
            <span
              key={i}
              className="text-[10px] flex-1 text-center truncate transition-colors"
              style={{ color: i + 1 <= step ? '#B8BDC7' : '#4A5060' }}
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            {step === 1 && <Step1 ob={ob} state={state} patch={patch} fileInputRef={fileInputRef} />}
            {step === 2 && <Step2 ob={ob} state={state} patch={patch} />}
            {step === 3 && <Step3 ob={ob} state={state} patch={patch} derivedTier={derivedTier} />}
            {step === 4 && <Step4 ob={ob} state={state} toggleGoal={toggleGoal} />}
            {step === 5 && <Step5 ob={ob} state={state} isSubmitting={isSubmitting} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="w-full max-w-lg mt-8 flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          className={`flex items-center gap-2 text-sm transition-colors ${
            step === 1 ? 'opacity-0 pointer-events-none' : 'text-fog hover:text-silver'
          }`}
        >
          <ArrowLeft size={14} />
          {ob.back}
        </button>

        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: canAdvance() ? '#F5F1E8' : 'rgba(245,241,232,0.15)',
              color: canAdvance() ? '#0A0D14' : '#4A5060',
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: isSubmitting ? 'rgba(127,163,138,0.3)' : '#7FA38A',
              color: '#0A0D14',
            }}
          >
            {isSubmitting ? ob.step5.launching : ob.step5.cta}
            <Rocket size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Agency name + logo ────────────────────────────────────────────────

function Step1({
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
        <h1 className="text-2xl font-bold text-ivory mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          {ob.step1.heading}
        </h1>
        <p className="text-sm text-silver">{ob.step1.subheading}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-silver mb-1.5">{ob.step1.agencyNameLabel}</label>
          <input
            type="text"
            value={state.agencyName}
            onChange={e => patch({ agencyName: e.target.value })}
            placeholder={ob.step1.agencyNamePlaceholder}
            autoFocus
            className="w-full rounded-xl px-4 py-3 text-sm text-ivory placeholder-fog outline-none transition-colors"
            style={{
              backgroundColor: '#111522',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-silver mb-1.5">{ob.step1.logoLabel}</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl px-4 py-3 text-sm text-fog transition-colors text-left"
            style={{
              backgroundColor: '#111522',
              border: '1px dashed rgba(255,255,255,0.08)',
            }}
          >
            {state.logoFile ? state.logoFile.name : ob.step1.logoHint}
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

// ── Step 2: Agency type ───────────────────────────────────────────────────────

function Step2({
  ob, state, patch,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
}) {
  const types = Object.entries(ob.step2.types);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ivory mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          {ob.step2.heading}
        </h1>
        <p className="text-sm text-silver">{ob.step2.subheading}</p>
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
                backgroundColor: isSelected ? 'rgba(245,241,232,0.06)' : '#111522',
                border: isSelected
                  ? '1px solid rgba(245,241,232,0.25)'
                  : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Icon size={18} className="mb-2" style={{ color: isSelected ? '#F5F1E8' : '#8A9099' }} />
              <p className="text-sm font-medium" style={{ color: isSelected ? '#F5F1E8' : '#B8BDC7' }}>
                {type.label}
              </p>
              <p className="text-[11px] text-fog mt-0.5 leading-snug">{type.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 3: Team size ─────────────────────────────────────────────────────────

const TIER_BADGE_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  starter: { backgroundColor: 'rgba(127,163,138,0.15)', color: '#7FA38A' },
  growth:  { backgroundColor: 'rgba(184,155,106,0.15)', color: '#B89B6A' },
  scale:   { backgroundColor: 'rgba(184,189,199,0.15)', color: '#B8BDC7' },
};

function Step3({
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
        <h1 className="text-2xl font-bold text-ivory mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          {ob.step3.heading}
        </h1>
        <p className="text-sm text-silver">{ob.step3.subheading}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ob.step3.options.map(opt => {
          const isSelected = state.teamSize === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => patch({ teamSize: opt.value })}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                backgroundColor: isSelected ? 'rgba(245,241,232,0.06)' : '#111522',
                border: isSelected
                  ? '1px solid rgba(245,241,232,0.25)'
                  : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-lg font-bold" style={{ color: isSelected ? '#F5F1E8' : '#B8BDC7' }}>
                {opt.label}
              </p>
              <p className="text-[11px] text-fog mt-0.5">{opt.desc}</p>
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
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
              style={TIER_BADGE_COLORS[derivedTier]}
            >
              {derivedTier}
            </span>
            <span className="text-sm text-silver">
              {ob.step3.tierPreview[derivedTier as keyof typeof ob.step3.tierPreview]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Step 4: Goals ─────────────────────────────────────────────────────────────

function Step4({
  ob, state, toggleGoal,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  state: WizardState;
  toggleGoal: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ivory mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          {ob.step4.heading}
        </h1>
        <p className="text-sm text-silver">
          {ob.step4.subheading}
          <span className="ml-1 text-fog">({ob.step4.maxSelection})</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ob.step4.goals.map(goal => {
          const isSelected = state.goals.includes(goal.value);
          const isDisabled = !isSelected && state.goals.length >= 3;
          return (
            <button
              key={goal.value}
              onClick={() => !isDisabled && toggleGoal(goal.value)}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                backgroundColor: isSelected ? 'rgba(245,241,232,0.06)' : '#111522',
                border: isSelected
                  ? '1px solid rgba(245,241,232,0.25)'
                  : '1px solid rgba(255,255,255,0.07)',
                opacity: isDisabled ? 0.4 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium" style={{ color: isSelected ? '#F5F1E8' : '#B8BDC7' }}>
                  {goal.label}
                </p>
                {isSelected && <CheckCircle2 size={14} style={{ color: '#7FA38A', flexShrink: 0 }} />}
              </div>
              <p className="text-[11px] text-fog mt-0.5">{goal.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 5: Kit preview ───────────────────────────────────────────────────────

function Step5({
  ob, state, isSubmitting,
}: {
  ob: ReturnType<typeof useLang>['t']['onboarding'];
  state: WizardState;
  isSubmitting: boolean;
}) {
  const agencyLabel = state.agencyType
    ? ob.step2.types[state.agencyType]?.label ?? state.agencyType
    : '';

  const heading = ob.step5.heading.replace('{{agencyType}}', agencyLabel);
  const projectsLine = ob.step5.previewItems.projects.replace('{{count}}', '3');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ivory mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          {heading}
        </h1>
        <p className="text-sm text-silver">{ob.step5.subheading}</p>
      </div>

      <div
        className="rounded-xl p-5 space-y-3"
        style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {[
          projectsLine,
          ob.step5.previewItems.services,
          ob.step5.previewItems.workflows,
          ob.step5.previewItems.dashboard,
        ].map((line, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: '#7FA38A' }}
            />
            <span className="text-sm text-silver">{line}</span>
          </div>
        ))}
      </div>

      {isSubmitting && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-fog text-center"
        >
          {ob.step5.launching}
        </motion.p>
      )}
    </div>
  );
}
