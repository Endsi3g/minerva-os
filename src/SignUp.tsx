'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Circle, Chrome, Github, Eye, EyeOff } from 'lucide-react';
import { useLang } from './i18n';
import { useAuth } from './contexts/AuthContext';

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
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
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await signup(firstName, lastName, email, password);
      router.push('/app/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account creation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      className="flex h-screen w-full selection:bg-white/20 p-2 transition-all duration-500 lg:p-4"
      style={{ backgroundColor: '#0A0D14' }}
    >
      {/* Left column */}
      <div className="relative hidden w-[52%] flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full lg:flex">
        <video className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline>
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>

        <motion.div
          className="relative z-10 w-full max-w-xs space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-2.5">
            <Circle size={18} style={{ fill: '#F5F1E8', color: '#F5F1E8' }} />
            <span className="text-xl font-semibold tracking-tight" style={{ color: '#F5F1E8' }}>
              {t.nav.brand}
            </span>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <h1 className="text-4xl font-medium tracking-tight whitespace-nowrap" style={{ color: '#F5F1E8' }}>
              {s.leftHeading}
            </h1>
            <p className="text-sm leading-relaxed px-4" style={{ color: 'rgba(184,189,199,0.75)' }}>
              {s.leftDesc}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2.5">
            {s.steps.map((step, i) => (
              <StepItem key={step} number={i + 1} text={step} active={i === 0} />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Right column */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        <motion.div
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-medium tracking-tight" style={{ color: '#F5F1E8' }}>
              {s.heading}
            </h2>
            <p className="text-sm" style={{ color: 'rgba(184,189,199,0.55)' }}>
              {s.subheading}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SocialButton icon={<Chrome size={17} />} label={s.google} />
            <SocialButton icon={<Github size={17} />} label={s.github} />
          </div>

          <Divider label={s.or} />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label={s.firstName} placeholder={s.firstNamePlaceholder} type="text" value={firstName} onChange={setFirstName} />
              <InputField label={s.lastName} placeholder={s.lastNamePlaceholder} type="text" value={lastName} onChange={setLastName} />
            </div>

            <InputField label={s.email} placeholder={s.emailPlaceholder} type="email" value={email} onChange={setEmail} />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#F5F1E8' }}>
                {s.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={s.passwordPlaceholder}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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
              <p className="text-xs pl-1" style={{ color: 'rgba(184,189,199,0.35)' }}>
                {s.passwordHint}
              </p>
            </div>

            {error && (
              <p className="text-sm px-1" style={{ color: '#A86A6A' }}>{error}</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-14 font-semibold rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.98] mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
            >
              {isLoading ? 'Creating account...' : s.submit}
            </button>

            <p className="text-center text-sm" style={{ color: 'rgba(184,189,199,0.5)' }}>
              {s.footer}{' '}
              <Link href="/login" className="transition-colors underline underline-offset-2" style={{ color: '#F5F1E8' }}>
                {s.footerLink}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

/* ── Components ───────────────────────────────────────────────────────────── */

function StepItem({ number, text, active = false }: { number: number; text: string; active?: boolean }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
      style={
        active
          ? { backgroundColor: '#F5F1E8', border: '1px solid #F5F1E8' }
          : { backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }
      }
    >
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
        style={
          active
            ? { backgroundColor: '#0A0D14', color: '#F5F1E8' }
            : { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(184,189,199,0.5)' }
        }
      >
        {number}
      </span>
      <span className="text-sm font-medium" style={{ color: active ? '#0A0D14' : '#F5F1E8' }}>
        {text}
      </span>
    </div>
  );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className="flex items-center justify-center gap-2.5 rounded-xl h-11 text-sm font-medium transition-all duration-200 hover:bg-white/5 active:scale-[0.98]"
      style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.09)', color: '#F5F1E8' }}
    >
      {icon}
      {label}
    </button>
  );
}

function InputField({ 
  label, 
  placeholder, 
  type, 
  value, 
  onChange 
}: { 
  label: string; 
  placeholder: string; 
  type: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: '#F5F1E8' }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl h-11 px-4 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/15 transition-all"
        style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }}
      />
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center">
      <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.09)' }} />
      <span
        className="px-4 text-xs font-medium uppercase tracking-widest"
        style={{ backgroundColor: '#0A0D14', color: 'rgba(184,189,199,0.45)' }}
      >
        {label}
      </span>
      <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.09)' }} />
    </div>
  );
}
