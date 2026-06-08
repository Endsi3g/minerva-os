'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Eye, EyeOff, Circle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/i18n';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLang();
  const rp = t.resetPassword;
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
    const toastId = toast.loading(rp.toastLoading || 'Updating password...');
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      toast.success(rp.toastSuccess, { id: toastId, description: rp.toastSuccessDesc });
      router.push('/login');
    } catch (err) {
      const msg = err instanceof Error ? err.message : rp.errorExpired;
      const finalMsg = msg.includes('session') || msg.includes('token') || msg.includes('expired')
        ? rp.errorExpired
        : msg;
      setError(finalMsg);
      toast.error(finalMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full h-11 px-4 pr-10 text-sm rounded-xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all bg-card border border-border";

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

        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight text-foreground">{rp.heading}</h1>
            <p className="text-sm text-muted-foreground">{rp.subheading}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">{rp.newPassword}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">{rp.confirmPassword}</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <p className="text-xs pl-1 -mt-1 text-muted-foreground">{rp.hint}</p>

            {error && (
              <div className="rounded-xl p-3 bg-red-500/8 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mt-2 bg-foreground text-background"
            >
              {loading ? rp.updating : rp.submit}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} />
            {rp.backToLogin}
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
