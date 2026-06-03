'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          style={{ display: 'flex', alignItems: 'center', flex: i < TOTAL_STEPS - 1 ? 1 : undefined }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: i < current ? '#7FA38A' : i === current ? '#F5F1E8' : 'rgba(255,255,255,0.08)',
              color: i < current ? '#0A0D14' : i === current ? '#0A0D14' : '#8A9099',
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
              transition: 'all 0.3s ease',
            }}
          >
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          {i < TOTAL_STEPS - 1 && (
            <div
              style={{
                flex: 1,
                height: 1,
                backgroundColor: i < current ? '#7FA38A' : 'rgba(255,255,255,0.08)',
                margin: '0 8px',
                transition: 'background-color 0.3s ease',
              }}
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
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: 12,
        border: selected ? '1px solid rgba(245,241,232,0.35)' : '1px solid rgba(255,255,255,0.08)',
        backgroundColor: selected ? 'rgba(245,241,232,0.06)' : '#111522',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div>
        <p style={{ color: '#F5F1E8', fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{label}</p>
        <p style={{ color: '#8A9099', fontSize: 12 }}>{desc}</p>
      </div>
      {selected && (
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#7FA38A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
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

  useEffect(() => {
    if (!user) return;
    supabase
      .from('onboarding_responses')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.completed_at) {
          router.replace('/app/onboarding');
          return;
        }
        if (data) {
          if (data.acquisition_source) setSource(data.acquisition_source);
          if (data.role_selection) setRole(data.role_selection);
          if (data.team_size) setTeamSize(data.team_size);
          if (data.priority_features) setFeatures(data.priority_features);
          if (data.main_goal) setGoal(data.main_goal);
          if (data.current_step) setStep(data.current_step);
        }
        setLoading(false);
      });
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

  function goNext() {
    setDirection(1);
    setStep(s => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep(s => s - 1);
  }

  async function handleSkip() {
    await saveProgress({}, step);
    router.push('/app/onboarding');
  }

  async function handleStep1Next() {
    await saveProgress({ acquisition_source: source }, 1);
    goNext();
  }

  async function handleStep2Next() {
    await saveProgress({ role_selection: role }, 2);
    if (role && ROLE_MAP[role] && user) {
      supabase
        .from('user_profiles')
        .update({ role: ROLE_MAP[role] })
        .eq('user_id', user.id)
        .then(() => {});
    }
    goNext();
  }

  async function handleStep3Next() {
    await saveProgress({ team_size: teamSize }, 3);
    goNext();
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    await supabase.from('onboarding_responses').upsert(
      {
        user_id: user.id,
        priority_features: features,
        main_goal: goal,
        current_step: 4,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    setSaving(false);
    router.push('/app/onboarding');
  }

  function toggleFeature(val: string) {
    setFeatures(prev =>
      prev.includes(val) ? prev.filter(f => f !== val) : [...prev, val]
    );
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0A0D14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#F5F1E8', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const stepLabels = d.steps;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0D14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FlickeringGrid
        className="absolute inset-0 z-0"
        color="#ffffff"
        maxOpacity={0.12}
        squareSize={4}
        gridGap={7}
        flickerChance={0.06}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, #0A0D14 100%)',
        }}
      />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 2 }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#F5F1E8', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            Minerva OS
          </p>
          <p style={{ color: '#8A9099', fontSize: 13 }}>
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
              <StepWrapper
                heading={d.step1.heading}
                subheading={d.step1.subheading}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {d.step1.options.map(opt => (
                    <OptionCard
                      key={opt.value}
                      label={opt.label}
                      desc={opt.desc}
                      selected={source === opt.value}
                      onClick={() => setSource(opt.value)}
                    />
                  ))}
                </div>
                <NavRow
                  onNext={handleStep1Next}
                  canNext={!!source}
                  saving={saving}
                  nextLabel={d.continue}
                />
              </StepWrapper>
            )}

            {step === 1 && (
              <StepWrapper
                heading={d.step2.heading}
                subheading={d.step2.subheading}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {d.step2.options.map(opt => (
                    <OptionCard
                      key={opt.value}
                      label={opt.label}
                      desc={opt.desc}
                      selected={role === opt.value}
                      onClick={() => setRole(opt.value)}
                    />
                  ))}
                </div>
                <NavRow
                  onBack={goBack}
                  onNext={handleStep2Next}
                  canNext={!!role}
                  saving={saving}
                  nextLabel={d.continue}
                />
              </StepWrapper>
            )}

            {step === 2 && (
              <StepWrapper
                heading={d.step3.heading}
                subheading={d.step3.subheading}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {d.step3.options.map(opt => (
                    <OptionCard
                      key={opt.value}
                      label={opt.label}
                      desc={opt.desc}
                      selected={teamSize === opt.value}
                      onClick={() => setTeamSize(opt.value)}
                    />
                  ))}
                </div>
                <NavRow
                  onBack={goBack}
                  onNext={handleStep3Next}
                  canNext={!!teamSize}
                  saving={saving}
                  nextLabel={d.continue}
                />
              </StepWrapper>
            )}

            {step === 3 && (
              <StepWrapper
                heading={d.step4.heading}
                subheading={d.step4.subheading}
              >
                <p style={{ color: '#B8BDC7', fontSize: 12, marginBottom: 10 }}>{d.step4.featuresLabel}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {d.step4.options.map(opt => (
                    <OptionCard
                      key={opt.value}
                      label={opt.label}
                      desc={opt.desc}
                      selected={features.includes(opt.value)}
                      onClick={() => toggleFeature(opt.value)}
                    />
                  ))}
                </div>
                <label style={{ color: '#B8BDC7', fontSize: 13, display: 'block', marginBottom: 6 }}>
                  {d.step4.goalLabel}
                </label>
                <textarea
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder={d.step4.goalPlaceholder}
                  rows={3}
                  style={{
                    width: '100%',
                    backgroundColor: '#111522',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#F5F1E8',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    marginBottom: 20,
                  }}
                />
                <NavRow
                  onBack={goBack}
                  onNext={handleFinish}
                  canNext={true}
                  saving={saving}
                  nextLabel={d.finish}
                  isFinish
                />
              </StepWrapper>
            )}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handleSkip}
          style={{
            background: 'none',
            border: 'none',
            color: '#8A9099',
            fontSize: 12,
            cursor: 'pointer',
            marginTop: 24,
            display: 'block',
          }}
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
      <h2 style={{ color: '#F5F1E8', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{heading}</h2>
      <p style={{ color: '#8A9099', fontSize: 14, marginBottom: 28 }}>{subheading}</p>
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
  const primaryBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F1E8',
    color: '#0A0D14',
    border: 'none',
    borderRadius: 12,
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: canNext && !saving ? 'pointer' : 'not-allowed',
    opacity: canNext && !saving ? 1 : 0.45,
    transition: 'opacity 0.2s ease',
  };

  const ghostBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    color: '#B8BDC7',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: '12px 24px',
    fontSize: 14,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
      {onBack && (
        <button onClick={onBack} style={ghostBtn}>
          <ArrowLeft size={16} /> Back
        </button>
      )}
      <button onClick={onNext} disabled={!canNext || saving} style={primaryBtn}>
        {saving ? '...' : nextLabel}
        {!isFinish && <ArrowRight size={16} />}
        {isFinish && <Check size={16} />}
      </button>
    </div>
  );
}
