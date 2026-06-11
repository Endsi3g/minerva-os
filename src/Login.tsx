'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from './i18n';
import { useAuth } from './contexts/AuthContext';


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

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLang();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const l = t.login;

  async function handleSubmit() {
    if (!email || !password) {
      setError(l.errorRequired);
      return;
    }
    setError('');
    setIsLoading(true);
    const toastId = toast.loading(l.toastLoading || 'Signing in...');
    try {
      await login(email, password);
      toast.success('Welcome back', { id: toastId, description: 'Signed in to Minerva OS.', duration: 3000 });
      const next = searchParams?.get('next') ?? '/app/dashboard';
      router.push(next);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : l.errorFailed;
      setError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full bg-background selection:bg-foreground/20 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4 font-sans">

      {/* ── Left Column — Brand panel ──────────────────────────────────────── */}
      <div className="relative hidden w-[52%] flex-col items-center justify-center px-12 rounded-3xl h-full lg:flex bg-sidebar border border-border">
        <motion.div
          className="w-full max-w-xs space-y-10"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="Minerva">
              <rect width="28" height="28" rx="8" fill="var(--primary)" />
              <path d="M6 20V8l8 8 8-8v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-base font-semibold text-foreground">Minerva OS</span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-tight">
              {l.leftHeading}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {l.leftDesc}
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div variants={itemVariants} className="space-y-2 w-full">
            {l.features.map((feature) => (
              <FeatureItem key={feature} text={feature} />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right Column — Login Form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden bg-background">
        <motion.div
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-medium tracking-tight text-foreground">
              {l.heading}
            </h2>
            <p className="text-sm text-muted-foreground">
              {l.subheading}
            </p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="space-y-4"
          >
            <InputGroup
              label={l.email}
              placeholder={l.emailPlaceholder}
              type="email"
              value={email}
              onChange={setEmail}
            />

            <div className="space-y-1.5 text-left w-full">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">{l.password}</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.forgot}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={l.passwordPlaceholder}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full bg-card border border-border rounded-xl h-11 px-4 pr-11 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/20 focus:outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 px-1">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 active:scale-[0.98] mt-4 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading
                ? <Loader2 size={18} className="animate-spin" />
                : l.submit
              }
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {l.footer}{' '}
              <Link
                href="/signup"
                className="text-foreground hover:text-foreground/80 transition-colors underline underline-offset-2"
              >
                {l.footerLink}
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </main>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-surface/60">
      <CheckCircle size={14} className="text-primary flex-shrink-0" />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

interface InputGroupProps {
  label: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
}

function InputGroup({ label, placeholder, type, value, onChange }: InputGroupProps) {
  return (
    <div className="space-y-1.5 text-left w-full">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-card border border-border rounded-xl h-11 px-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/20 focus:outline-none transition-all text-sm"
      />
    </div>
  );
}
