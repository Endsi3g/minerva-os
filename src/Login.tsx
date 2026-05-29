'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Circle, Loader2 } from 'lucide-react';
import { useLang } from './i18n';
import { useAuth } from './contexts/AuthContext';
import { cn } from '@/lib/utils';

const BG_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4';

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
    try {
      await login(email, password);
      const next = searchParams?.get('next') ?? '/app/dashboard';
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : l.errorFailed);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full bg-black selection:bg-white/30 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4 font-sans">

      {/* ── Left Column — Video ────────────────────────────────────────────── */}
      <div className="relative hidden w-[52%] flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full lg:flex">
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          style={{ filter: 'saturate(0.08) contrast(1.05) brightness(0.88)' }}
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={BG_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/20 z-0" />

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
              {l.leftHeading}
            </h1>
            <p className="text-sm leading-relaxed text-white/60">
              {l.leftDesc}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2.5 w-full">
            {l.features.map((feature) => (
              <FeatureItem key={feature} text={feature} />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right Column — Login Form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        <motion.div
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-medium tracking-tight text-white">
              {l.heading}
            </h2>
            <p className="text-sm text-white/40">
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
                <label className="block text-sm font-medium text-white">{l.password}</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
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
                  className="w-full bg-[#1A1A1A] border-none rounded-xl h-11 px-4 pr-11 text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/20 focus:outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-[#A86A6A] px-1">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-white text-black font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] mt-4 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading
                ? <Loader2 size={18} className="animate-spin" />
                : l.submit
              }
            </button>

            <p className="text-center text-sm text-white/50">
              {l.footer}{' '}
              <Link
                href="/signup"
                className="text-white hover:text-white/80 transition-colors underline underline-offset-2"
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
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 w-full',
        'bg-[#1A1A1A] text-white',
      )}
    >
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-white/10 text-white/40">
        ·
      </span>
      <span className="text-sm font-medium">{text}</span>
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
      <label className="block text-sm font-medium text-white">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#1A1A1A] border-none rounded-xl h-11 px-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/20 focus:outline-none transition-all text-sm"
      />
    </div>
  );
}
