'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Circle } from 'lucide-react';
function Google({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
function Github({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"/>
    </svg>
  );
}
import { toast } from 'sonner';
import { useLang } from './i18n';
import { useAuth } from './contexts/AuthContext';
import { cn } from '@/lib/utils';

const BG_VIDEO = process.env.NEXT_PUBLIC_BG_VIDEO_URL || '/Plan_fixe_cinématique_Anime_c.mp4';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
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
    const toastId = toast.loading(s.toastLoading || 'Creating account...');
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding/discover`;
      await signup(firstName, lastName, email, password, redirectTo);
      sessionStorage.setItem('minerva_signup_email', email);
      toast.success(s.toastSuccess, { id: toastId, description: s.toastSuccessDesc });
      router.push('/verify-email');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : s.errorFailed;
      setError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full bg-black selection:bg-white/30 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4 font-sans">
      {/* ── Left Column — Hero & Background Video ────────────────────────────── */}
      <div className="relative hidden w-[52%] flex-col items-center justify-center px-12 rounded-3xl overflow-hidden shadow-2xl h-full lg:flex">
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={BG_VIDEO} type="video/mp4" />
        </video>
        
        {/* Glassmorphic overlay panel */}
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-0" />

        <motion.div
          className="relative z-10 w-full max-w-xs space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-2.5">
            <Circle className="fill-white text-white h-5 w-5" />
            <span className="text-xl font-semibold tracking-tight text-white">
              Minerva OS
            </span>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <h1 className="text-4xl font-medium tracking-tight whitespace-nowrap text-white">
              {s.leftHeading}
            </h1>
            <p className="text-sm leading-relaxed text-white/60">
              {s.leftDesc}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2.5 w-full">
            {s.steps.map((step, i) => (
              <StepItem key={step} number={i + 1} text={step} active={i === 0} />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right Column — Sign Up Form ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        <motion.div
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-medium tracking-tight text-white">
              {s.heading}
            </h2>
            <p className="text-sm text-white/40">
              {s.subheading}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SocialButton icon={<Google className="h-[17px] w-[17px]" />} label={s.google} />
            <SocialButton icon={<Github className="h-[17px] w-[17px]" />} label={s.github} />
          </div>

          <div className="relative flex items-center justify-center w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-black px-4 text-xs font-medium text-white/40 uppercase tracking-widest">
              {s.or}
            </span>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
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
            <p className="text-xs text-white/30 pl-1 -mt-2">{s.passwordHint}</p>

            {error && <p className="text-sm text-destructive px-1">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-white text-black font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] mt-4 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? s.creating : s.submit}
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
      </div>
    </main>
  );
}

/* ── Reusable Components ────────────────────────────────────────────────────── */

function StepItem({ number, text, active = false }: { number: number; text: string; active?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 w-full',
        active
          ? 'bg-foreground text-background font-medium shadow-[0_4px_20px_rgba(245,241,232,0.15)]'
          : 'bg-surface/40 backdrop-blur-md text-muted-foreground border border-white/5',
      )}
    >
      <span
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
          active ? 'bg-background text-foreground' : 'bg-white/5 text-muted-foreground',
        )}
      >
        {number}
      </span>
      <span className="text-sm font-medium">{text}</span>
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

function InputGroup({ label, placeholder, type, value, onChange, children }: InputGroupProps) {
  return (
    <div className="space-y-1.5 text-left w-full">
      <label className="block text-sm font-medium text-white">{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-surface border-none rounded-xl h-11 px-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/20 focus:outline-none transition-all text-sm"
        />
        {children}
      </div>
    </div>
  );
}
