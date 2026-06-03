'use client';
import { useState } from 'react';
import { useLang } from '@/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';
import { motion } from 'motion/react';

interface PortalEmailGateProps {
  token: string;
  onVerified: () => void;
}

export default function PortalEmailGate({ token, onVerified }: PortalEmailGateProps) {
  const { t, lang, setLang } = useLang();
  const eg = t.app.clients.portal.emailGate;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/portal/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onVerified();
      } else {
        setError(data.error === 'invalid_email' ? eg.error : 'Failed to verify email. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-between p-6 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Header / Language Switcher */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md flex items-center justify-center bg-ivory">
            <span className="text-[10px] font-bold text-obsidian">M</span>
          </div>
          <span className="text-sm font-semibold tracking-wide text-ivory">Minerva</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
          className="text-xs text-fog hover:text-ivory border border-white/5"
        >
          {lang === 'en' ? 'FR' : 'EN'}
        </Button>
      </header>

      {/* Main Form Card */}
      <main className="flex-1 flex items-center justify-center z-10 my-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-xl space-y-6"
        >
          <div className="space-y-2 text-center">
            <h1
              className="text-3xl font-normal text-ivory"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}
            >
              {eg.title}
            </h1>
            <p className="text-xs text-fog leading-relaxed px-2">
              {eg.desc}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-fog h-4 w-4" />
              <Input
                type="email"
                placeholder={eg.placeholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="pl-10 text-xs text-ivory bg-midnight border-white/5 focus-visible:ring-sage/20 placeholder:text-fog/50 h-10 rounded-xl"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-ember leading-relaxed text-center px-1 font-medium"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-ivory text-obsidian hover:bg-white rounded-full text-xs font-semibold py-5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {eg.verify}
            </Button>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-fog z-10 opacity-65">
        Powered by Minerva OS · Uprising Studio
      </footer>

      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-sage-500/5 blur-[150px] pointer-events-none rounded-full" />
    </div>
  );
}
