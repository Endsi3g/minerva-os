'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Circle, ArrowLeft, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/i18n';
import { toast } from 'sonner';

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
    const toastId = toast.loading(fp.toastLoading || 'Sending reset link...');
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (err) throw err;
      toast.success(fp.successTitle, { id: toastId });
      setSubmitted(true);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : fp.errorFailed;
      setError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center p-4 font-sans bg-background"
    >
      <motion.div
        className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <Circle className="fill-foreground text-foreground h-4 w-4" />
          <span className="text-base font-semibold tracking-tight text-foreground">Minerva OS</span>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="rounded-2xl p-5 bg-emerald-600/8 border border-emerald-600/25">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 flex-shrink-0 text-emerald-600" size={18} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-emerald-600">{fp.successTitle}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {fp.successBody}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {fp.noEmail}{' '}
              <button
                type="button"
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="text-foreground underline underline-offset-2 hover:opacity-75 transition-opacity"
              >
                {fp.tryAgain}
              </button>
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-medium tracking-tight text-foreground">{fp.heading}</h1>
              <p className="text-sm text-muted-foreground">{fp.subheading}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">{fp.emailLabel}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={fp.emailPlaceholder}
                  className="w-full h-11 px-4 text-sm rounded-xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all bg-card border border-border"
                />
              </div>

              {error && <p className="text-sm px-1 text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 bg-foreground text-background"
              >
                {loading ? fp.sending : fp.submit}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} />
            {fp.backToLogin}
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
