'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { FlickeringGrid } from '@/components/ui/flickering-grid';

const DURATION_MS = 5000;

export default function WelcomePage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

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

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
      style={{ backgroundColor: '#0A0D14', fontFamily: 'Inter, sans-serif' }}
      onClick={() => router.push('/signup')}
    >
      {/* Flickering grid background */}
      <FlickeringGrid
        className="absolute inset-0 z-0"
        color="#ffffff"
        maxOpacity={0.18}
        squareSize={4}
        gridGap={7}
        flickerChance={0.08}
      />

      {/* Radial vignette so center is readable */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 30%, #0A0D14 100%)',
        }}
      />

      {/* Logo + wordmark */}
      <motion.div
        className="relative z-20 flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Minerva 8-petal mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
        >
          <svg width="52" height="52" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="3.5" fill="#F5F1E8" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
              const x = 16 + 10 * Math.cos(angle);
              const y = 16 + 10 * Math.sin(angle);
              return <circle key={i} cx={x} cy={y} r="3.5" fill="#F5F1E8" opacity={0.7 + i * 0.04} />;
            })}
          </svg>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.45 }}
        >
          <span
            className="text-2xl font-semibold tracking-tight"
            style={{ color: '#F5F1E8', letterSpacing: '-0.03em' }}
          >
            Minerva OS
          </span>
          <span
            className="text-sm"
            style={{ color: '#8A9099', letterSpacing: '0.08em' }}
          >
            UPRISING STUDIO
          </span>
        </motion.div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-10 z-20 w-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }}
        >
          <div
            className="h-full rounded-full transition-none"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: 'rgba(255,255,255,0.35)',
            }}
          />
        </div>
      </motion.div>

      {/* Skip hint */}
      <motion.p
        className="absolute bottom-5 z-20 text-xs"
        style={{ color: '#8A9099' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        Click anywhere to continue
      </motion.p>
    </div>
  );
}
