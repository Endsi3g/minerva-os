'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useLang } from './i18n';
import { useAuth } from './contexts/AuthContext';

const BG_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4';
const POSTER = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60';
const ACCENT = '#ef4d23';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
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
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      const next = searchParams?.get('next') ?? '/app/dashboard';
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen w-full selection:bg-white/20 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4"
      style={{ backgroundColor: '#0A0D14' }}
    >
      {/* ── Left column — hero video ────────────────────────────────────────── */}
      <div className="relative hidden w-[52%] flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full lg:flex">
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ filter: 'hue-rotate(-260deg) saturate(1.5) contrast(1.1)' }}
          src={BG_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          poster={POSTER}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20" />

        <motion.div
          className="relative z-10 w-full max-w-xs space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Brand */}
          <motion.div variants={itemVariants} className="flex items-center gap-2.5">
            {/* Minerva 8-petal logo */}
            <svg width="22" height="22" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="3.5" fill={ACCENT} />
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * Math.PI * 2) / 8;
                const x = 16 + 10 * Math.cos(angle);
                const y = 16 + 10 * Math.sin(angle);
                return <circle key={i} cx={x} cy={y} r="3.5" fill={ACCENT} />;
              })}
            </svg>
            <span className="text-xl font-semibold tracking-tight" style={{ color: '#F5F1E8', fontFamily: 'Inter, sans-serif' }}>
              Minerva OS
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h1 className="text-4xl font-medium tracking-tight" style={{ color: '#F5F1E8' }}>
              {l.leftHeading}
            </h1>
            <p className="text-sm leading-relaxed px-0" style={{ color: 'rgba(184,189,199,0.75)' }}>
              {l.leftDesc}
            </p>
          </motion.div>

          {/* Features */}
          <motion.div variants={itemVariants} className="space-y-2.5">
            {l.features.map((f) => (
              <FeatureItem key={f} text={f} />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right column — login form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        <motion.div
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-medium tracking-tight" style={{ color: '#F5F1E8' }}>
              {l.heading}
            </h2>
            <p className="text-sm" style={{ color: 'rgba(184,189,199,0.55)' }}>
              {l.subheading}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#F5F1E8' }}>
                {l.email}
              </label>
              <input
                type="email"
                placeholder={l.emailPlaceholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl h-11 px-4 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/15 transition-all"
                style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium" style={{ color: '#F5F1E8' }}>
                  {l.password}
                </label>
                <a href="#" className="text-xs transition-colors" style={{ color: 'rgba(184,189,199,0.5)' }}>
                  {l.forgot}
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={l.passwordPlaceholder}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full rounded-xl h-11 px-4 pr-11 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/15 transition-all"
                  style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(184,189,199,0.35)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit}
              className="w-full h-14 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98] mt-2 disabled:opacity-50"
              style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {l.submit}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {error && (
              <p className="text-center text-xs text-ember mt-2" style={{ color: '#ef4d23' }}>{error}</p>
            )}

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.09)' }} />
              <span
                className="px-4 text-xs font-medium uppercase tracking-widest"
                style={{ backgroundColor: '#0A0D14', color: 'rgba(184,189,199,0.4)' }}
              >
                {l.or}
              </span>
              <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.09)' }} />
            </div>

            {/* Magic link */}
            <button
              type="button"
              className="w-full h-11 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/5 active:scale-[0.98]"
              style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.09)', color: '#B8BDC7' }}
            >
              {l.magicLink}
            </button>

            {/* Footer */}
            <p className="text-center text-sm" style={{ color: 'rgba(184,189,199,0.5)' }}>
              {l.footer}{' '}
              <Link href="/signup" className="transition-colors underline underline-offset-2" style={{ color: '#F5F1E8' }}>
                {l.footerLink}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}
    >
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}>
        <ArrowRight size={12} strokeWidth={3} />
      </span>
      <span className="text-sm font-medium" style={{ color: '#F5F1E8' }}>{text}</span>
    </div>
  );
}
