'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const { t } = useLang();
  const v = t.verifyEmail;

  async function handleResend() {
    setIsResending(true);
    try {
      const email = sessionStorage.getItem('minerva_signup_email');
      if (!email) {
        toast.error(v.resendError);
        return;
      }
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      toast.success(v.resendSuccess);
    } catch {
      toast.error(v.resendError);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center p-4"
      style={{ backgroundColor: '#0A0D14' }}
    >
      <motion.div
        className="w-full max-w-md text-center space-y-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          <Mail size={28} style={{ color: '#F5F1E8' }} />
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-3xl font-medium tracking-tight" style={{ color: '#F5F1E8' }}>
            {v.heading}
          </h1>
          <p className="text-sm leading-relaxed mx-auto max-w-xs" style={{ color: '#8A9099' }}>
            {v.subheading}
          </p>
        </div>

        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm" style={{ color: '#B8BDC7' }}>{v.didNotReceive}</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ color: '#F5F1E8' }}
          >
            <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
            {isResending ? '...' : v.resend}
          </button>
        </div>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 text-sm transition-colors"
          style={{ color: '#8A9099' }}
        >
          <ArrowLeft size={14} />
          {v.backToSignup}
        </Link>
      </motion.div>
    </main>
  );
}
