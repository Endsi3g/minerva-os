'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chrome, Github, Eye, EyeOff, Circle } from 'lucide-react';
import { useLang } from './i18n';
import { useAuth } from './contexts/AuthContext';
import { Onboarding, useOnboarding } from '@/components/ui/onboarding';
import { cn } from '@/lib/utils';

const BG_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLang();
  const { signup } = useAuth();
  const router = useRouter();
  const s = t.signup;

  // Onboarding Phase state
  const [currentStep, setCurrentStep] = useState(1);
  const [studioName, setStudioName] = useState('');
  const [serviceFocus, setServiceFocus] = useState('Design');
  const [retainerTarget, setRetainerTarget] = useState('10000');
  const [timezone, setTimezone] = useState('America/New_York');
  const [teamSize, setTeamSize] = useState('just-me');

  async function handleSubmit() {
    if (!firstName || !lastName || !email || !password) {
      setError(s.errorFillAll);
      return;
    }
    if (password.length < 8) {
      setError(s.errorPasswordLength);
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await signup(firstName, lastName, email, password);
      // Advance to onboarding step 2
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : s.errorFailed);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full bg-black selection:bg-white/30 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4 font-sans">
      {/* ── Left Column — Hero & Background Video ────────────────────────────── */}
      <div className="relative hidden w-[52%] flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full lg:flex">
        {/* Background Video with Hue rotation to turn the original blue video to green */}
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          style={{ filter: 'hue-rotate(130deg) saturate(1.3) contrast(1.05)' }}
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={BG_VIDEO} type="video/mp4" />
        </video>

        {/* Hero Content Overlays Video */}
        <motion.div
          className="relative z-10 w-full max-w-xs space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Brand/Logo */}
          <motion.div variants={itemVariants} className="flex items-center gap-2.5">
            <Circle className="fill-white text-white h-5 w-5" />
            <span className="text-xl font-semibold tracking-tight text-white">
              Aurora
            </span>
          </motion.div>

          {/* Heading Block */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h1 className="text-4xl font-medium tracking-tight whitespace-nowrap text-white">
              {s.leftHeading}
            </h1>
            <p className="text-sm leading-relaxed text-white/60">
              {s.leftDesc}
            </p>
          </motion.div>

          {/* Steps list */}
          <motion.div variants={itemVariants} className="space-y-2.5 w-full">
            {s.steps.map((step, i) => (
              <StepItem
                key={step}
                number={i + 1}
                text={step}
                active={currentStep === i + 1}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right Column — Sign Up Form / Onboarding Wizard ────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        {currentStep === 1 ? (
          <motion.div
            className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-3xl font-medium tracking-tight text-white">
                {s.heading}
              </h2>
              <p className="text-sm text-white/40">
                {s.subheading}
              </p>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <SocialButton icon={<Chrome size={17} />} label={s.google} />
              <SocialButton icon={<Github size={17} />} label={s.github} />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-black px-4 text-xs font-medium text-white/40 uppercase tracking-widest">
                {s.or}
              </span>
            </div>

            {/* Registration Form fields */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <InputGroup
                  label={s.firstName}
                  placeholder={s.firstNamePlaceholder}
                  type="text"
                  value={firstName}
                  onChange={setFirstName}
                />
                <InputGroup
                  label={s.lastName}
                  placeholder={s.lastNamePlaceholder}
                  type="text"
                  value={lastName}
                  onChange={setLastName}
                />
              </div>

              <InputGroup
                label={s.email}
                placeholder={s.emailPlaceholder}
                type="email"
                value={email}
                onChange={setEmail}
              />

              {/* Password field with Eye Toggle */}
              <InputGroup
                label={s.password}
                placeholder={s.passwordPlaceholder}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
              >
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </InputGroup>
              <p className="text-xs text-white/30 pl-1 -mt-2">
                {s.passwordHint}
              </p>

              {error && (
                <p className="text-sm text-[#A86A6A] px-1">{error}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-white text-black font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] mt-4 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : s.submit}
              </button>

              <p className="text-center text-sm text-white/50">
                {s.footer}{' '}
                <Link
                  href="/login"
                  className="text-white hover:text-white/80 transition-colors underline underline-offset-2"
                >
                  {s.footerLink}
                </Link>
              </p>
            </form>
          </motion.div>
        ) : (
          <motion.div
            className="w-full max-w-xl"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Onboarding
              value={currentStep}
              onValueChange={setCurrentStep}
              totalSteps={3}
              onComplete={() => router.push('/app/dashboard')}
              className="w-full bg-[#111522] border border-white/5 rounded-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium uppercase tracking-widest text-silver/50">
                  Phase {currentStep} of 3
                </span>
                <Onboarding.StepIndicator className="gap-1.5" />
              </div>

              {/* Step 2: Configure Studio */}
              <Onboarding.Step step={2} className="space-y-6">
                <Onboarding.Header
                  title="Configure your studio"
                  description="Set up your agency name and configuration details."
                />
                <div className="space-y-4">
                  <InputGroup
                    label="Studio Name"
                    placeholder="e.g. Creative Flow Studio"
                    type="text"
                    value={studioName}
                    onChange={setStudioName}
                  />
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-white">
                      Primary Service Focus
                    </label>
                    <select
                      value={serviceFocus}
                      onChange={(e) => setServiceFocus(e.target.value)}
                      className="w-full bg-[#1A1A1A] border-none rounded-xl h-11 px-4 text-white focus:ring-2 focus:ring-white/20 focus:outline-none transition-all text-sm"
                    >
                      <option value="Design">Design & Branding</option>
                      <option value="Development">Development & Product</option>
                      <option value="Marketing">Marketing & Growth</option>
                      <option value="FullService">Full Service Agency</option>
                    </select>
                  </div>
                  
                  <InputGroup
                    label="Monthly Retainer Target (USD)"
                    placeholder="e.g. 10000"
                    type="number"
                    value={retainerTarget}
                    onChange={setRetainerTarget}
                  />
                </div>
              </Onboarding.Step>

              {/* Step 3: Finalize Profile */}
              <Onboarding.Step step={3} className="space-y-6">
                <Onboarding.Header
                  title="Finalize your profile"
                  description="Almost done! Set your timezone and initial team preferences."
                />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-white">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-[#1A1A1A] border-none rounded-xl h-11 px-4 text-white focus:ring-2 focus:ring-white/20 focus:outline-none transition-all text-sm"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/Paris">Central European Time (CET)</option>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-white">
                      Initial Team Size
                    </label>
                    <select
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="w-full bg-[#1A1A1A] border-none rounded-xl h-11 px-4 text-white focus:ring-2 focus:ring-white/20 focus:outline-none transition-all text-sm"
                    >
                      <option value="just-me">Just me (Solo)</option>
                      <option value="2-5">2-5 members</option>
                      <option value="6-20">6-20 members</option>
                      <option value="20+">20+ members</option>
                    </select>
                  </div>
                </div>
              </Onboarding.Step>

              <OnboardingNavigation />
            </Onboarding>
          </motion.div>
        )}
      </div>
    </main>
  );
}

/* ── Custom Navigation Component using customized buttons ───────────────────── */
function OnboardingNavigation() {
  const { canGoBack, canGoNext, handleBack, handleNext, handleComplete, currentStep, totalSteps } = useOnboarding();
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex gap-3 mt-6">
      <button
        type="button"
        onClick={handleBack}
        disabled={!canGoBack}
        className="flex-1 h-11 text-sm font-semibold rounded-xl bg-black border border-white/10 text-white hover:bg-white/5 disabled:opacity-50 cursor-pointer transition-colors duration-200"
      >
        Back
      </button>
      {isLastStep ? (
        <button
          type="button"
          onClick={handleComplete}
          className="flex-1 h-11 text-sm font-semibold rounded-xl bg-white text-black hover:bg-white/90 active:scale-[0.98] cursor-pointer transition-all duration-200"
        >
          Start Creating
        </button>
      ) : (
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          className="flex-1 h-11 text-sm font-semibold rounded-xl bg-white text-black hover:bg-white/90 active:scale-[0.98] cursor-pointer transition-all duration-200"
        >
          Next Step
        </button>
      )}
    </div>
  );
}

/* ── Custom Reusable Components ────────────────────────────────────────────── */

function StepItem({ number, text, active = false }: { number: number; text: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 w-full",
        active 
          ? "bg-white text-black border border-white" 
          : "bg-[#1A1A1A] text-white border-none"
      )}
    >
      <span
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
          active 
            ? "bg-black text-white" 
            : "bg-white/10 text-white/40"
        )}
      >
        {number}
      </span>
      <span className="text-sm font-medium">
        {text}
      </span>
    </div>
  );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2.5 rounded-xl h-11 text-sm font-medium bg-black border border-white/10 hover:bg-white/5 transition-colors cursor-pointer text-white w-full"
    >
      {icon}
      {label}
    </button>
  );
}

interface InputGroupProps {
  label: string;
  placeholder: string;
  type: string;
  value: string | number;
  onChange: (val: string) => void;
  children?: React.ReactNode;
}

function InputGroup({
  label,
  placeholder,
  type,
  value,
  onChange,
  children,
}: InputGroupProps) {
  return (
    <div className="space-y-1.5 text-left w-full">
      <label className="block text-sm font-medium text-white">{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#1A1A1A] border-none rounded-xl h-11 px-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/20 focus:outline-none transition-all text-sm"
        />
        {children}
      </div>
    </div>
  );
}
