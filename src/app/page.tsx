'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';

const DURATION_MS = 6000;

export default function RootPage() {
  const router = useRouter();
  const { t } = useLang();
  const { user, isLoading: authLoading } = useAuth();
  const [progress, setProgress] = useState(0);
  const [featureIndex, setFeatureIndex] = useState(0);

  const w = t.welcome;

  const skip = useCallback(() => {
    router.push('/signup');
  }, [router]);

  // Auth redirect if logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/app/dashboard');
    }
  }, [user, authLoading, router]);

  // Progress bar + auto-redirect (only runs if not logged in and auth check is done)
  useEffect(() => {
    if (authLoading || user) return;

    const start = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / DURATION_MS, 1);
      setProgress(pct);
      if (pct < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        router.push('/signup');
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [user, authLoading, router]);

  // Cycle through feature labels
  useEffect(() => {
    if (authLoading || user) return;

    const interval = setInterval(() => {
      setFeatureIndex((i) => (i + 1) % w.features.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [authLoading, user, w.features.length]);

  // Keyboard skip (Space / Enter / Escape)
  useEffect(() => {
    if (authLoading || user) return;

    const handler = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'Escape'].includes(e.code)) skip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [skip, authLoading, user]);

  // Render a clean loading/empty screen while authentication check resolves
  if (authLoading || user) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: '#0A0D14' }}
      />
    );
  }

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ backgroundColor: '#0A0D14', fontFamily: 'Inter, sans-serif' }}
      onClick={skip}
    >
      {/* Flickering grid background */}
      <FlickeringGrid
        className="absolute inset-0 z-0"
        color="#ffffff"
        maxOpacity={0.14}
        squareSize={4}
        gridGap={7}
        flickerChance={0.07}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 65% 60% at 50% 50%, transparent 25%, #0A0D14 100%)',
        }}
      />

      {/* Center content */}
      <motion.div
        className="relative z-20 flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* 8-petal mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="3.5" fill="#F5F1E8" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
              const x = 16 + 10 * Math.cos(angle);
              const y = 16 + 10 * Math.sin(angle);
              return <circle key={i} cx={x} cy={y} r="3.5" fill="#F5F1E8" opacity={0.65 + i * 0.045} />;
            })}
          </svg>
        </motion.div>

        {/* Wordmark + studio */}
        <motion.div
          className="flex flex-col items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
        >
          <span
            className="text-3xl font-semibold tracking-tight"
            style={{ color: '#F5F1E8', letterSpacing: '-0.03em' }}
          >
            {w.title}
          </span>
          <span
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: '#8A9099', letterSpacing: '0.18em' }}
          >
            {w.studio}
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-center text-sm max-w-xs leading-relaxed"
          style={{ color: '#B8BDC7' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.75 }}
        >
          {w.tagline}
          <br />
          <span style={{ color: '#8A9099' }}>
            {w.taglineSub}
          </span>
        </motion.p>

        {/* Cycling feature label */}
        <motion.div
          className="h-6 flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={featureIndex}
              className="text-xs font-medium tracking-widest"
              style={{ color: '#8A9099', letterSpacing: '0.12em' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {w.features[featureIndex]}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-12 z-20 w-44"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-none"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: 'rgba(255,255,255,0.30)',
            }}
          />
        </div>
      </motion.div>

      {/* Skip button — bottom right */}
      <motion.button
        type="button"
        className="absolute bottom-10 right-10 z-30 text-xs px-4 py-1.5 rounded-full transition-colors"
        style={{
          color: '#8A9099',
          border: '1px solid rgba(255,255,255,0.10)',
          backgroundColor: 'transparent',
        }}
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        whileHover={{ color: '#F5F1E8', borderColor: 'rgba(255,255,255,0.25)' }}
        aria-label="Skip intro"
      >
        {w.skip}
      </motion.button>

      {/* Bottom hint */}
      <motion.p
        className="absolute bottom-5 z-20 text-xs"
        style={{ color: 'rgba(138,144,153,0.5)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        {w.hint}
      </motion.p>
    </div>
  );
}
