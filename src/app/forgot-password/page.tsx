'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Circle, ArrowLeft, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/i18n';

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const fp = t.forgotPassword;
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError(fp.errorEmail); return; }
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (err) throw err;
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : fp.errorFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center p-4 font-sans"
      style={{ backgroundColor: '#0A0D14' }}
    >
      <motion.div
        className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <Circle className="fill-white text-white h-4 w-4" />
          <span className="text-base font-semibold tracking-tight text-white">Minerva OS</span>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div
              className="rounded-2xl p-5"
              style={{
                backgroundColor: 'rgba(127,163,138,0.08)',
                border: '1px solid rgba(127,163,138,0.25)',
              }}
            >
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 flex-shrink-0 text-[#7FA38A]" size={18} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#7FA38A]">{fp.successTitle}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#8A9099' }}>
                    {fp.successBody}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-center text-sm" style={{ color: '#8A9099' }}>
              {fp.noEmail}{' '}
              <button
                type="button"
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="text-white underline underline-offset-2 hover:text-white/80 transition-colors"
              >
                {fp.tryAgain}
              </button>
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-medium tracking-tight text-white">{fp.heading}</h1>
              <p className="text-sm" style={{ color: '#8A9099' }}>{fp.subheading}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white">{fp.emailLabel}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={fp.emailPlaceholder}
                  className="w-full h-11 px-4 text-sm rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  style={{
                    backgroundColor: '#111522',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                />
              </div>

              {error && <p className="text-sm px-1" style={{ color: '#A86A6A' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
              >
                {loading ? fp.sending : fp.submit}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-white"
            style={{ color: '#8A9099' }}
          >
            <ArrowLeft size={14} />
            {fp.backToLogin}
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
