'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/i18n';

export default function ResetPasswordPage() {
  const { t } = useLang();
  const rp = t.resetPassword;
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(rp.errorMatch); return; }
    if (password.length < 8) { setError(rp.errorLength); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      toast.success(rp.toastSuccess, { description: rp.toastSuccessDesc, duration: 5000 });
      router.push('/login');
    } catch {
      setError(rp.errorFailed);
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
          {rp.backToLogin}
        </Link>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h1 className="text-2xl font-semibold mb-2" style={{ color: '#F5F1E8' }}>{rp.heading}</h1>
          <p className="text-sm mb-8" style={{ color: '#8A9099' }}>{rp.sub}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#B8BDC7' }}>{rp.newLabel}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder={rp.placeholder}
                  className="w-full rounded-xl h-11 px-4 pr-11 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/15 transition-all"
                  style={{ backgroundColor: '#1A1A1A', border: 'none', color: '#F5F1E8' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(184,189,199,0.35)' }}
                  aria-label={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#B8BDC7' }}>{rp.confirmLabel}</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder={rp.placeholder}
                  className="w-full rounded-xl h-11 px-4 pr-11 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/15 transition-all"
                  style={{ backgroundColor: '#1A1A1A', border: 'none', color: '#F5F1E8' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(184,189,199,0.35)' }}
                  aria-label={showConfirm ? 'Hide' : 'Show'}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm" style={{ color: '#A86A6A' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ backgroundColor: '#F5F1E8', color: '#0A0D14', cursor: loading || !password || !confirm ? 'not-allowed' : 'pointer' }}
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : rp.submit}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
