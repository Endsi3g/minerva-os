'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
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
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      });
      if (err) throw err;
      setSubmitted(true);
      toast.success(fp.successHeading, { description: fp.successSub, duration: 6000 });
    } catch {
      setError(fp.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#0A0D14', fontFamily: 'Inter, sans-serif' }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-10 group transition-colors"
          style={{ color: 'rgba(184,189,199,0.45)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#B8BDC7')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(184,189,199,0.45)')}
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          {fp.backToLogin}
        </Link>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {submitted ? (
            <motion.div
              className="flex flex-col items-center text-center gap-5 py-4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(127,163,138,0.12)', border: '1px solid rgba(127,163,138,0.25)' }}
              >
                <CheckCircle2 size={22} style={{ color: '#7FA38A' }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2" style={{ color: '#F5F1E8' }}>{fp.successHeading}</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#8A9099' }}>{fp.successSub}</p>
              </div>
              <Link
                href="/login"
                className="mt-2 text-sm font-medium transition-colors"
                style={{ color: '#B8BDC7' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F5F1E8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#B8BDC7')}
              >
                {fp.backToLogin}
              </Link>
            </motion.div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: '#F5F1E8' }}>{fp.heading}</h1>
              <p className="text-sm mb-8" style={{ color: '#8A9099' }}>{fp.sub}</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium" style={{ color: '#B8BDC7' }}>
                    {fp.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder={fp.emailPlaceholder}
                    className="w-full rounded-xl h-11 px-4 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/15 transition-all"
                    style={{ backgroundColor: '#1A1A1A', border: 'none', color: '#F5F1E8' }}
                  />
                </div>

                {error && <p className="text-sm" style={{ color: '#A86A6A' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#F5F1E8', color: '#0A0D14', cursor: loading || !email ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? <Loader2 size={17} className="animate-spin" /> : fp.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
