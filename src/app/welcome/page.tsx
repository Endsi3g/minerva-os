'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { FlickeringGrid } from '@/components/ui/flickering-grid';

const DURATION_MS = 6000;

const FEATURES = [
  'CRM · Pipeline · Proposals',
  'Projects · Tasks · Approvals',
  'Billing · Retainers · Invoices',
  'Client Portal · AI Agents',
];

export default function WelcomePage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [featureIndex, setFeatureIndex] = useState(0);

  const skip = useCallback(() => router.push('/signup'), [router]);

  // Progress bar + auto-redirect
  useEffect(() => {
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
  }, [router]);

  // Cycle through feature labels
  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex(i => (i + 1) % FEATURES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  // Keyboard skip (Space / Enter / Escape)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'Escape'].includes(e.code)) skip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [skip]);

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
        transition={{ duration: 1.0, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* 8-petal mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
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
            Minerva OS
          </span>
          <span
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: '#8A9099', letterSpacing: '0.18em' }}
          >
            Uprising Studio
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
          The operating system for elite agencies.
          <br />
          <span style={{ color: '#8A9099' }}>
            One workspace for every client, project, and invoice.
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
              {FEATURES[featureIndex]}
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
        onClick={(e) => { e.stopPropagation(); skip(); }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        whileHover={{ color: '#F5F1E8', borderColor: 'rgba(255,255,255,0.25)' }}
        aria-label="Skip intro"
      >
        Skip
      </motion.button>

      {/* Bottom hint */}
      <motion.p
        className="absolute bottom-5 z-20 text-xs"
        style={{ color: 'rgba(138,144,153,0.5)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        Press any key or click to continue
      </motion.p>
    </div>
  );
}
