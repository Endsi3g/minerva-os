'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/contexts/AuthContext';

const TOTAL_STEPS = 4;

const ROLE_MAP: Record<string, UserRole> = {
  owner: 'owner',
  project_manager: 'project_manager',
  designer: 'designer',
  developer: 'developer',
  finance: 'finance',
};

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn('flex items-center', i < TOTAL_STEPS - 1 && 'flex-1')}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold transition-all duration-300',
              i < current ? 'bg-[#7FA38A] text-[#0A0D14]' : i === current ? 'bg-[#F5F1E8] text-[#0A0D14]' : 'bg-white/8 text-fog'
            )}
          >
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          {i < TOTAL_STEPS - 1 && (
            <div
              className={cn(
                'flex-1 h-px mx-2 transition-colors duration-300',
                i < current ? 'bg-[#7FA38A]' : 'bg-white/8'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface OptionCardProps {
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({ label, desc, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3',
        selected
          ? 'border-[rgba(245,241,232,0.35)] bg-[rgba(245,241,232,0.06)]'
          : 'border-white/8 bg-midnight hover:border-white/16'
      )}
    >
      <div>
        <p className="text-ivory text-sm font-medium mb-0.5">{label}</p>
        <p className="text-fog text-xs">{desc}</p>
      </div>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-[#7FA38A] flex items-center justify-center shrink-0">
          <Check size={11} color="#0A0D14" />
        </div>
      )}
    </button>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function DiscoveryOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();
  const d = t.discovery;

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [source, setSource] = useState('');
  const [role, setRole] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [goal, setGoal] = useState('');

  const isSMB = ['solo', '2-5', '6-15'].includes(teamSize);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let active = true;
    async function checkOnboarding() {
      try {
        const { data, error } = await supabase
          .from('onboarding_responses')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!active) return;
        if (error) { console.error('Error fetching onboarding responses:', error); setLoading(false); return; }
        if (data?.completed_at) { router.replace('/onboarding'); return; }
        if (data) {
          if (data.acquisition_source) setSource(data.acquisition_source);
          if (data.role_selection) setRole(data.role_selection);
          if (data.team_size) setTeamSize(data.team_size);
          if (data.priority_features) setFeatures(data.priority_features);
          if (data.main_goal) setGoal(data.main_goal);
          if (data.current_step) setStep(data.current_step);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error in onboarding_responses query:', err);
        if (active) setLoading(false);
      }
    }
    checkOnboarding();
    return () => { active = false; };
  }, [user, router]);

  async function saveProgress(updates: Record<string, unknown>, nextStep: number) {
    if (!user) return;
    setSaving(true);
    await supabase.from('onboarding_responses').upsert(
      { user_id: user.id, ...updates, current_step: nextStep, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    setSaving(false);
  }

  function goNext() { setDirection(1); setStep(s => s + 1); }
  function goBack() { setDirection(-1); setStep(s => s - 1); }

  async function handleSkip() {
    await saveProgress({}, step);
    router.push('/onboarding');
  }

  async function handleStep1Next() { await saveProgress({ acquisition_source: source }, 1); goNext(); }
  async function handleStep2Next() {
    await saveProgress({ role_selection: role }, 2);
    if (role && ROLE_MAP[role] && user) {
      supabase.from('user_profiles').update({ role: ROLE_MAP[role] }).eq('user_id', user.id).then(() => {});
    }
    goNext();
  }
  async function handleStep3Next() { await saveProgress({ team_size: teamSize }, 3); goNext(); }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    await supabase.from('onboarding_responses').upsert(
      { user_id: user.id, priority_features: features, main_goal: goal, current_step: 4, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    setSaving(false);
    router.push('/onboarding');
  }

  function toggleFeature(val: string) {
    setFeatures(prev => prev.includes(val) ? prev.filter(f => f !== val) : [...prev, val]);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-ivory animate-spin" />
      </div>
    );
  }

  const stepLabels = d.steps;

  return (
    <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center p-6 relative overflow-hidden">
      <FlickeringGrid
        className="absolute inset-0 z-0"
        color="#ffffff"
        maxOpacity={0.12}
        squareSize={4}
        gridGap={7}
        flickerChance={0.06}
      />
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,transparent_20%,#0A0D14_100%)]" />

      <div className="w-full max-w-[520px] relative z-[2]">
        <div className="mb-4">
          <p className="text-ivory text-[13px] font-semibold tracking-[2px] uppercase mb-1">Minerva OS</p>
          <p className="text-fog text-[13px]">
            {d.stepLabel.replace('{{current}}', String(step + 1)).replace('{{total}}', String(TOTAL_STEPS))}
            {' · '}
            {stepLabels[step]}
          </p>
        </div>

        <ProgressBar current={step} />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            {step === 0 && (
              <StepWrapper heading={d.step1.heading} subheading={d.step1.subheading}>
                <div className="flex flex-col gap-2.5">
                  {d.step1.options.map(opt => (
                    <OptionCard key={opt.value} label={opt.label} desc={opt.desc} selected={source === opt.value} onClick={() => setSource(opt.value)} />
                  ))}
                </div>
                <NavRow onNext={handleStep1Next} canNext={!!source} saving={saving} nextLabel={d.continue} />
              </StepWrapper>
            )}

            {step === 1 && (
              <StepWrapper heading={d.step2.heading} subheading={d.step2.subheading}>
                <div className="flex flex-col gap-2.5">
                  {d.step2.options.map(opt => (
                    <OptionCard key={opt.value} label={opt.label} desc={opt.desc} selected={role === opt.value} onClick={() => setRole(opt.value)} />
                  ))}
                </div>
                <NavRow onBack={goBack} onNext={handleStep2Next} canNext={!!role} saving={saving} nextLabel={d.continue} />
              </StepWrapper>
            )}

            {step === 2 && (
              <StepWrapper heading={d.step3.heading} subheading={d.step3.subheading}>
                <div className="grid grid-cols-2 gap-2.5">
                  {d.step3.options.map(opt => (
                    <OptionCard key={opt.value} label={opt.label} desc={opt.desc} selected={teamSize === opt.value} onClick={() => setTeamSize(opt.value)} />
                  ))}
                </div>
                <NavRow onBack={goBack} onNext={handleStep3Next} canNext={!!teamSize} saving={saving} nextLabel={d.continue} />
              </StepWrapper>
            )}

            {step === 3 && (
              <StepWrapper
                heading={isSMB ? t.smb.discovery.step4.heading : d.step4.heading}
                subheading={isSMB ? t.smb.discovery.step4.subheading : d.step4.subheading}
              >
                <p className="text-silver text-xs mb-2.5">
                  {isSMB ? t.smb.discovery.step4.featuresLabel : d.step4.featuresLabel}
                </p>
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {(isSMB ? t.smb.discovery.step4.options : d.step4.options).map(opt => (
                    <OptionCard key={opt.value} label={opt.label} desc={opt.desc} selected={features.includes(opt.value)} onClick={() => toggleFeature(opt.value)} />
                  ))}
                </div>
                <label className="text-silver text-[13px] block mb-1.5">
                  {isSMB ? t.smb.discovery.step4.goalLabel : d.step4.goalLabel}
                </label>
                <textarea
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder={isSMB ? t.smb.discovery.step4.goalPlaceholder : d.step4.goalPlaceholder}
                  rows={3}
                  className="w-full bg-midnight border border-white/8 rounded-xl px-4 py-3 text-ivory text-sm outline-none resize-none box-border mb-5 focus:border-white/20"
                  title="Main goal"
                />
                <NavRow onBack={goBack} onNext={handleFinish} canNext={true} saving={saving} nextLabel={d.finish} isFinish />
              </StepWrapper>
            )}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handleSkip}
          className="bg-transparent border-none text-fog text-xs cursor-pointer mt-6 block hover:text-silver transition-colors"
        >
          {d.skip}
        </button>
      </div>
    </div>
  );
}

function StepWrapper({ heading, subheading, children }: { heading: string; subheading: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-ivory text-[22px] font-semibold mb-2">{heading}</h2>
      <p className="text-fog text-sm mb-7">{subheading}</p>
      {children}
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  canNext,
  saving,
  nextLabel,
  isFinish = false,
}: {
  onBack?: () => void;
  onNext: () => void;
  canNext: boolean;
  saving: boolean;
  nextLabel: string;
  isFinish?: boolean;
}) {
  return (
    <div className="flex gap-3 mt-6">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 bg-transparent text-silver border border-white/12 rounded-xl px-6 py-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canNext || saving}
        className={cn(
          'inline-flex items-center gap-2 bg-ivory text-obsidian border-none rounded-xl px-6 py-3 text-sm font-semibold transition-opacity',
          canNext && !saving ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-45'
        )}
      >
        {saving ? '...' : nextLabel}
        {!isFinish && <ArrowRight size={16} />}
        {isFinish && <Check size={16} />}
      </button>
    </div>
  );
}
