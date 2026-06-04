'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { Check } from 'lucide-react';

const TIER_SEGMENT_COLORS: Record<string, { badge: string; badgeBg: string; border: string }> = {
  starter: {
    badge: '#7FA38A',
    badgeBg: 'rgba(127,163,138,0.15)',
    border: 'rgba(255,255,255,0.07)',
  },
  growth: {
    badge: '#B89B6A',
    badgeBg: 'rgba(184,155,106,0.15)',
    border: 'rgba(184,155,106,0.25)',
  },
  scale: {
    badge: '#B8BDC7',
    badgeBg: 'rgba(184,189,199,0.15)',
    border: 'rgba(255,255,255,0.07)',
  },
};

export default function RootPage() {
  const router = useRouter();
  const { t } = useLang();
  const { user, isLoading: authLoading } = useAuth();

  const seg = t.landingSegments;
  const vex = t.landing.vex;

  // Auth redirect
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/app/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: '#0A0D14' }} />
    );
  }

  const segments = [
    { key: 'starter', data: seg.starter, ctaHref: '/signup?tier=starter', recommended: false },
    { key: 'growth',  data: { ...seg.growth, recommended: (seg.growth as { recommended?: string }).recommended }, ctaHref: '/signup?tier=growth', recommended: true },
    { key: 'scale',   data: seg.scale,   ctaHref: '/signup?tier=scale',   recommended: false },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0D14', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[70vh] px-6 pt-16 pb-8 overflow-hidden">
        <FlickeringGrid
          className="absolute inset-0 z-0"
          color="#ffffff"
          maxOpacity={0.10}
          squareSize={4}
          gridGap={7}
          flickerChance={0.06}
        />
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 55% at 50% 50%, transparent 20%, #0A0D14 100%)',
          }}
        />

        <motion.div
          className="relative z-20 flex flex-col items-center text-center max-w-2xl gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Mark */}
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="3.5" fill="#F5F1E8" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
              const x = 16 + 10 * Math.cos(angle);
              const y = 16 + 10 * Math.sin(angle);
              return <circle key={i} cx={x} cy={y} r="3.5" fill="#F5F1E8" opacity={0.55 + i * 0.045} />;
            })}
          </svg>

          <div>
            <h1
              className="text-4xl md:text-5xl font-bold leading-tight text-ivory"
              style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
            >
              {seg.headline}
            </h1>
            <p className="mt-4 text-base text-silver max-w-lg mx-auto leading-relaxed">
              {seg.sub}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <a
              href="/signup"
              className="px-6 py-2.5 rounded-full text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
            >
              Get Started Free
            </a>
            <a
              href="/login"
              className="px-6 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                color: '#B8BDC7',
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: 'transparent',
              }}
            >
              Sign In
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── 3 Segment cards ──────────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {segments.map(({ key, data, ctaHref, recommended }, idx) => {
            const colors = TIER_SEGMENT_COLORS[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + idx * 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="rounded-2xl p-7 flex flex-col gap-5 relative"
                style={{
                  backgroundColor: recommended ? '#111522' : '#0E1119',
                  border: `1px solid ${colors.border}`,
                }}
              >
                {recommended && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: colors.badgeBg, color: colors.badge, border: `1px solid ${colors.border}` }}
                  >
                    {(data as { recommended?: string }).recommended ?? 'Most popular'}
                  </div>
                )}

                <div>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: colors.badgeBg, color: colors.badge }}
                  >
                    {data.badge}
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-ivory">{data.title}</h2>
                  <p className="text-xs text-fog mt-0.5">{data.size}</p>
                </div>

                <ul className="space-y-2 flex-1">
                  {data.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2">
                      <Check size={12} className="mt-0.5 shrink-0" style={{ color: colors.badge }} />
                      <span className="text-sm text-silver leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={ctaHref}
                  className="block text-center py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95"
                  style={
                    recommended
                      ? { backgroundColor: '#F5F1E8', color: '#0A0D14' }
                      : { backgroundColor: 'rgba(255,255,255,0.05)', color: '#B8BDC7', border: '1px solid rgba(255,255,255,0.10)' }
                  }
                >
                  {data.cta}
                </a>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Module grid ──────────────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2
          className="text-center text-2xl font-bold text-ivory mb-8"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {vex.sections.features.heading}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {vex.sections.features.cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i, ease: 'easeOut' }}
              className="rounded-xl p-5"
              style={{
                backgroundColor: '#111522',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-sm font-semibold text-ivory mb-1">{card.title}</p>
              <p className="text-xs text-fog leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <section
        className="px-6 py-10 border-y"
        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0E1119' }}
      >
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center">
          {vex.sections.stats.map((stat, i) => (
            <div key={i}>
              <p className="text-2xl font-bold text-ivory">{stat.value}</p>
              <p className="text-xs text-fog mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="px-6 py-20 text-center max-w-xl mx-auto">
        <h2
          className="text-3xl font-bold text-ivory mb-4"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {vex.sections.cta.heading}
        </h2>
        <p className="text-sm text-silver mb-8">{vex.sections.cta.sub}</p>
        <a
          href="/signup"
          className="inline-block px-8 py-3 rounded-full text-sm font-medium transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
        >
          {vex.sections.cta.primary}
        </a>
      </section>

    </div>
  );
}
