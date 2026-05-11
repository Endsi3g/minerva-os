import { ArrowRight, BarChart3, ShieldCheck, Users, Zap, Layout, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import Header from './components/Header';
import LandingFooter from './components/LandingFooter';
import { motion } from 'motion/react';

const BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_155101_f2540600-6fe9-433e-8e48-b3f4b72f0727.mp4';

/* ── Motion Variants ─────────────────────────────────────────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.12 } },
};


/* ── Bento Card ──────────────────────────────────────────────────────────── */

function BentoCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 24 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ scale: 1.008, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
      className={`rounded-[20px] border border-white/[0.06] bg-white/[0.025] overflow-hidden relative group
        hover:border-white/[0.13] hover:bg-white/[0.04]
        transition-colors duration-500 ease-out
        ${className}`}
      style={{
        backdropFilter: 'blur(2px)',
        boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset',
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Icon Container ──────────────────────────────────────────────────────── */

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 border"
      style={{
        backgroundColor: 'rgba(127,163,138,0.08)',
        borderColor: 'rgba(127,163,138,0.18)',
      }}
    >
      {children}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function Landing() {
  const { t } = useLang();

  return (
    <div
      className="relative w-full min-h-screen overflow-x-hidden selection:bg-[#F5F1E8]/20"
      style={{ backgroundColor: '#0A0D14' }}
    >
      {/* ═══════════════════════════════════════════════════════════════
          HERO — full viewport
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative h-screen overflow-hidden">
        {/* Background video */}
        <video
          className="absolute inset-0 z-0 w-full h-full object-cover"
          src={BG_VIDEO}
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Deep cinematic overlay — pushes video far into background */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(10,13,20,0.55) 0%, rgba(10,13,20,0.35) 35%, rgba(10,13,20,0.50) 70%, rgba(10,13,20,0.85) 100%)',
          }}
        />

        {/* Central radial mask — darkens behind the text column */}
        <div
          className="absolute inset-0 z-[15] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(10,13,20,0.65) 0%, transparent 100%)',
          }}
        />

        <Header />

        {/* Hero content */}
        <div className="relative z-20 flex flex-col items-center text-center px-5 sm:px-8 h-full justify-center pb-16">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            {/* Eyebrow badge */}
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-medium mb-8 tracking-wide uppercase"
              style={{
                backgroundColor: 'rgba(10,13,20,0.88)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: '#B8BDC7',
                backdropFilter: 'blur(20px)',
                letterSpacing: '0.08em',
                boxShadow: '0 0 0 1px rgba(127,163,138,0.06) inset, 0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                style={{ backgroundColor: '#7FA38A' }}
              />
              {t.landing.badge}
            </motion.div>

            {/* Headline — clear of video element */}
            <motion.h1
              variants={fadeInUp}
              className="font-normal leading-[1.08] tracking-tight max-w-4xl"
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                color: '#F5F1E8',
                textShadow: '0 4px 32px rgba(0,0,0,0.5)',
              }}
            >
              {t.landing.headline1}
              <br />
              <span style={{ color: 'rgba(245,241,232,0.80)' }}>{t.landing.headline2}</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="mt-6 leading-relaxed max-w-xl text-base md:text-lg font-light"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'rgba(184,189,199,0.85)',
                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              }}
            >
              {t.landing.subtitle1} {t.landing.subtitle2}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              className="mt-10 flex items-center gap-4 flex-wrap justify-center"
            >
              {/* Primary CTA — glow effect */}
              <Link
                to="/signup"
                id="hero-cta-primary"
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-[1.03] hover:brightness-105 active:scale-[0.98] group"
                style={{
                  backgroundColor: '#F5F1E8',
                  color: '#0A0D14',
                  border: '1px solid rgba(245,241,232,0.9)',
                  boxShadow: '0 0 0 2px rgba(245,241,232,0.08), 0 8px 48px rgba(245,241,232,0.22), 0 2px 12px rgba(0,0,0,0.4)',
                }}
              >
                {t.landing.cta}
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                />
              </Link>

              {/* Secondary CTA — glassmorphism */}
              <Link
                to="/login"
                id="hero-cta-secondary"
                className="flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-medium transition-all duration-300 hover:bg-white/[0.10] hover:border-white/30"
                style={{
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: 'rgba(245,241,232,0.90)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                }}
              >
                {t.landing.ctaSecondary}
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.35, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/40" />
            <div
              className="w-1 h-1 rounded-full bg-white/40 animate-bounce"
              style={{ animationDuration: '2s' }}
            />
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LOGO CLOUD
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-20 bg-[#0A0D14]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-7xl mx-auto px-5">
          <p className="text-center text-[10px] tracking-[0.22em] uppercase text-white/25 mb-12 font-medium" style={{ letterSpacing: '0.22em' }}>
            {t.landing.trust}
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-10 items-center justify-items-center">
            {['AURA', 'LUMEN', 'VERTEX', 'STRATA', 'NOVA', 'KINETIC'].map((logo) => (
              <div
                key={logo}
                className="text-base font-bold tracking-[0.15em] text-white/20 font-serif cursor-default hover:text-white/50 transition-colors duration-500 select-none"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES — BENTO GRID
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-44 bg-[#0A0D14]">
        <div className="max-w-[1280px] mx-auto px-5">

          {/* Section label */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 16 }}
            viewport={{ once: true }}
            className="mb-16 flex flex-col items-center text-center gap-3"
          >
            <span className="text-[10px] tracking-[0.22em] uppercase text-[#7FA38A]/70 font-medium">The Platform</span>
            <h2
              className="text-3xl md:text-4xl font-normal text-[#F5F1E8]"
              style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '-0.02em' }}
            >
              Everything your agency needs
            </h2>
            <p className="text-sm text-[#B8BDC7]/50 max-w-md leading-relaxed">
              One unified system that replaces a dozen disconnected tools — built from the ground up for creative agencies.
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(260px,auto)]">

            {/* ─ Main Feature — Platform (spans 7 cols × 2 rows) */}
            <BentoCard className="md:col-span-7 md:row-span-2 p-10 flex flex-col justify-between" delay={0}>
              <div className="relative z-10">
                <IconBox>
                  <Layout className="text-[#7FA38A]" size={20} strokeWidth={1.5} />
                </IconBox>
                <h3
                  className="text-3xl font-normal text-[#F5F1E8] mb-4 leading-tight"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  {t.landing.features.platform.title}
                </h3>
                <p className="text-sm text-[#B8BDC7]/55 leading-relaxed max-w-sm">
                  {t.landing.features.platform.desc}
                </p>
              </div>
              <div className="relative z-10 flex flex-wrap gap-2 mt-8">
                {['CRM', 'Pipeline', 'Intake', 'Operations'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 rounded-full border text-white/35"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {/* Ambient glow */}
              <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-[#7FA38A]/6 blur-[80px] group-hover:bg-[#7FA38A]/10 transition-colors duration-700 pointer-events-none" />
            </BentoCard>

            {/* ─ Client Portal (spans 5 cols × 1 row) */}
            <BentoCard className="md:col-span-5 p-8 flex flex-col justify-between" delay={0.05}>
              <div>
                <IconBox>
                  <Users className="text-[#7FA38A]" size={18} strokeWidth={1.5} />
                </IconBox>
                <h3
                  className="text-xl font-normal text-[#F5F1E8] mb-3 leading-snug"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  {t.landing.features.portal.title}
                </h3>
                <p className="text-sm text-[#B8BDC7]/50 leading-relaxed">
                  {t.landing.features.portal.desc}
                </p>
              </div>
              <div className="flex items-center text-xs text-[#7FA38A] gap-1.5 font-medium cursor-pointer mt-6 hover:gap-2.5 transition-all duration-200">
                {t.landing.features.portal.cta}
                <ArrowRight size={13} strokeWidth={2} />
              </div>
            </BentoCard>

            {/* ─ Insights (spans 5 cols × 1 row) */}
            <BentoCard className="md:col-span-5 p-8 flex flex-col justify-between" delay={0.1}>
              <div>
                <IconBox>
                  <BarChart3 className="text-[#7FA38A]" size={18} strokeWidth={1.5} />
                </IconBox>
                <h3
                  className="text-xl font-normal text-[#F5F1E8] mb-3 leading-snug"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  {t.landing.features.insights.title}
                </h3>
                <p className="text-sm text-[#B8BDC7]/50 leading-relaxed">
                  {t.landing.features.insights.desc}
                </p>
              </div>
              {/* Progress bar */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-[10px] text-white/25 uppercase tracking-wider mb-1">
                  <span>Performance</span>
                  <span>+67%</span>
                </div>
                <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-gradient-to-r from-[#7FA38A]/60 to-[#7FA38A]/20 rounded-full" />
                </div>
              </div>
            </BentoCard>

            {/* ─ Security (spans 4 cols) */}
            <BentoCard className="md:col-span-4 p-8 flex flex-col justify-between" delay={0.15}>
              <div>
                <IconBox>
                  <ShieldCheck className="text-[#7FA38A]" size={18} strokeWidth={1.5} />
                </IconBox>
                <h3
                  className="text-xl font-normal text-[#F5F1E8] mb-3 leading-snug"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  {t.landing.features.security.title}
                </h3>
                <p className="text-sm text-[#B8BDC7]/50 leading-relaxed">
                  {t.landing.features.security.desc}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border"
                      style={{
                        background: `hsl(${150 + i * 15}, 20%, ${25 + i * 5}%)`,
                        borderColor: '#0A0D14',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Enterprise Grade</span>
              </div>
            </BentoCard>

            {/* ─ AI Automation (spans 8 cols) */}
            <BentoCard
              className="md:col-span-8 p-10 flex items-center gap-10"
              delay={0.2}
            >
              <div className="flex-1">
                <IconBox>
                  <Zap className="text-[#F5F1E8]" size={18} strokeWidth={1.5} />
                </IconBox>
                <h3
                  className="text-2xl font-normal text-[#F5F1E8] mb-3 leading-tight"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  {t.landing.features.automation.title}
                </h3>
                <p className="text-sm text-[#B8BDC7]/55 leading-relaxed max-w-sm">
                  {t.landing.features.automation.desc}
                </p>
              </div>
              {/* Mock UI decoration */}
              <div className="hidden md:flex flex-col gap-2 w-40 flex-shrink-0">
                {['Brief received', 'Analysis done', 'Draft ready'].map((label, i) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] text-white/40 border"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(255,255,255,0.07)',
                      transform: `translateX(${i * 4}px)`,
                      opacity: 1 - i * 0.2,
                    }}
                  >
                    <div className="w-1 h-1 rounded-full bg-[#7FA38A]/60" />
                    {label}
                  </div>
                ))}
              </div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#F5F1E8]/3 blur-3xl pointer-events-none" />
            </BentoCard>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          METRICS — wrapped in visual module
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-44 bg-[#0A0D14]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto px-5">
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 16 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[10px] tracking-[0.22em] uppercase text-[#7FA38A]/70 font-medium">By the numbers</span>
          </motion.div>
          <div
            className="rounded-[24px] border grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x"
            style={{
              borderColor: 'rgba(255,255,255,0.06)',

              backgroundColor: 'rgba(255,255,255,0.015)',
            }}
          >
            {t.landing.metrics.map((m, i) => (
              <motion.div
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center text-center py-16 px-10"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="text-6xl md:text-7xl font-normal text-[#F5F1E8] mb-3 tabular-nums"
                  style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '-0.02em' }}
                >
                  {m.value}
                </div>
                <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7FA38A] mb-4">
                  {m.label}
                </div>
                <p className="text-sm text-[#B8BDC7]/65 max-w-[200px] leading-relaxed">
                  {m.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIAL
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-40 bg-[#0A0D14]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <motion.div
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.97 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Decorative quote mark */}
            <div className="flex justify-center mb-10">
              <Quote className="text-[#7FA38A]/30" size={36} strokeWidth={1} />
            </div>

            <blockquote
              className="text-2xl md:text-4xl font-normal leading-snug text-[#F5F1E8] mb-12 italic"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              <span
                style={{
                  background: 'linear-gradient(to bottom, #F5F1E8 0%, rgba(245,241,232,0.65) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                "{t.landing.testimonial.quote}"
              </span>
            </blockquote>

            <div className="flex flex-col items-center gap-4">
              {/* Avatar — prominent, with gradient + initials */}
              <div
                className="w-20 h-20 rounded-full overflow-hidden border-2 flex items-center justify-center"
                style={{
                  borderColor: 'rgba(127,163,138,0.30)',
                  boxShadow: '0 0 0 4px rgba(127,163,138,0.06)',
                  background: 'linear-gradient(135deg, #5C7A6B 0%, #3E566A 50%, #2E3D60 100%)',
                }}
              >
                <span
                  className="text-lg font-semibold text-white/80 select-none"
                  style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em' }}
                >
                  SC
                </span>
              </div>

              <div>
                <div className="text-[#F5F1E8] font-medium text-base">{t.landing.testimonial.author}</div>
                <div className="text-xs text-white/35 uppercase tracking-[0.18em] mt-1">
                  {t.landing.testimonial.role}
                </div>
              </div>

              {/* Company logo badge */}
              <div
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] tracking-widest uppercase"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(255,255,255,0.30)',
                  letterSpacing: '0.15em',
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[8px] font-bold text-white/50"
                  style={{ backgroundColor: 'rgba(127,163,138,0.18)' }}
                >
                  I
                </span>
                Imperium Creative
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
