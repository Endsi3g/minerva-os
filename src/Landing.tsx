'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  GitBranch, FolderKanban, CreditCard, Sparkles, Archive, Users,
  Menu, X,
} from 'lucide-react';
import { useLang, type Lang } from '@/i18n';
import { cn } from '@/lib/utils';
import LandingFooter from '@/components/LandingFooter';

const BG_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4';

const NAV_PATHS = ['/platform', '/modules', '/portal', '/security', '/insights'];

/* ── Utilities ─────────────────────────────────────────────────────────────── */

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

function FadeIn({ children, delay = 0, duration = 1000, className }: FadeInProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn('transition-opacity ease-out', className)}
      style={{ opacity: isMounted ? 1 : 0, transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

interface AnimatedHeadingProps {
  text: string;
  delay?: number;
  charDelay?: number;
  duration?: number;
  className?: string;
}

function AnimatedHeading({
  text,
  delay = 400,
  charDelay = 55,
  duration = 750,
  className,
}: AnimatedHeadingProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const lines = text.split('\n');
  let charCounter = 0;

  return (
    <h1 className={className} style={{ letterSpacing: '-0.04em' }}>
      {lines.map((line, lineIndex) => {
        const words = line.split(' ');
        return (
          <span key={lineIndex} className="block">
            {words.map((word, wordIndex) => {
              const chars = Array.from(word);
              return (
                <span key={wordIndex} className="inline-block whitespace-nowrap">
                  {chars.map((char, charIndex) => {
                    const staggerDelay = charCounter * charDelay;
                    charCounter++;
                    return (
                      <span
                        key={charIndex}
                        className="inline-block transition-all ease-out"
                        style={{
                          opacity: animate ? 1 : 0,
                          transform: animate ? 'translateX(0)' : 'translateX(-18px)',
                          transitionDuration: `${duration}ms`,
                          transitionDelay: `${staggerDelay}ms`,
                        }}
                      >
                        {char}
                      </span>
                    );
                  })}
                  {wordIndex < words.length - 1 && (
                    <span
                      className="inline-block transition-all ease-out"
                      style={{
                        opacity: animate ? 1 : 0,
                        transform: animate ? 'translateX(0)' : 'translateX(-18px)',
                        transitionDuration: `${duration}ms`,
                        transitionDelay: `${charCounter * charDelay}ms`,
                      }}
                    >
                      {' '}
                    </span>
                  )}
                  {wordIndex < words.length - 1 && charCounter++ && null}
                </span>
              );
            })}
          </span>
        );
      })}
    </h1>
  );
}

/* ── Lang toggle (compact pill) ────────────────────────────────────────────── */

function LangToggle() {
  const { lang, setLang } = useLang();
  const opts: Lang[] = ['en', 'fr'];
  return (
    <div
      className="flex items-center rounded-full px-1 py-1 gap-0.5"
      style={{ border: '1px solid rgba(255,255,255,0.13)' }}
    >
      {opts.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
          style={{
            backgroundColor: lang === l ? 'rgba(255,255,255,0.12)' : 'transparent',
            color: lang === l ? '#F5F1E8' : 'rgba(184,189,199,0.45)',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ── Mobile nav ────────────────────────────────────────────────────────────── */

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div
        className="fixed inset-0 z-30 lg:hidden"
        style={{
          backdropFilter: open ? 'blur(12px)' : 'blur(0px)',
          backgroundColor: open ? 'rgba(10,13,20,0.65)' : 'rgba(10,13,20,0)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'backdrop-filter 0.5s ease, background-color 0.5s ease',
        }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 left-0 right-0 z-40 lg:hidden"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        <div
          className="pt-[72px] pb-8 px-5 overflow-y-auto"
          style={{
            maxHeight: '100svh',
            backgroundColor: 'rgba(10,13,20,0.98)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex flex-col gap-1 mt-2">
            {t.nav.items.map((item, i) => (
              <Link
                key={item}
                href={NAV_PATHS[i]}
                onClick={onClose}
                className="text-base py-3 px-3 rounded-xl flex items-center justify-between"
                style={{
                  color: 'rgba(245,241,232,0.7)',
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(-6px)',
                  transition: `opacity 0.35s cubic-bezier(0.23,1,0.32,1) ${i * 45 + 60}ms, transform 0.35s cubic-bezier(0.23,1,0.32,1) ${i * 45 + 60}ms`,
                }}
              >
                {item}
              </Link>
            ))}
          </div>
          <div
            className="mt-6 pt-5 flex flex-col gap-3"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-6px)',
              transition: 'opacity 0.35s cubic-bezier(0.23,1,0.32,1) 300ms, transform 0.35s cubic-bezier(0.23,1,0.32,1) 300ms',
            }}
          >
            <LangToggle />
            <Link
              href="/login"
              onClick={onClose}
              className="w-full py-3 rounded-full text-center text-sm font-medium"
              style={{ color: '#B8BDC7', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {t.nav.signIn}
            </Link>
            <Link
              href="/signup"
              onClick={onClose}
              className="w-full py-3 rounded-full text-center text-sm font-medium"
              style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
            >
              {t.nav.requestAccess}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Feature icon map ──────────────────────────────────────────────────────── */

const FEATURE_ICONS = [GitBranch, FolderKanban, CreditCard, Sparkles, Archive, Users];

/* ── Main page ─────────────────────────────────────────────────────────────── */

export default function Landing() {
  const { t } = useLang();
  const vex = t.landing.vex;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="w-full bg-[#0A0D14] text-white font-sans select-none">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          src={BG_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />

        {/* Navbar */}
        <header className="w-full px-6 md:px-12 lg:px-16 pt-6 z-10 relative">
          <nav className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between w-full">
            <Link href="/" className="text-2xl font-semibold tracking-tight hover:opacity-90 transition-opacity">
              {vex.logo}
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              {t.nav.items.map((label, i) => (
                <Link
                  key={label}
                  href={NAV_PATHS[i]}
                  className="text-sm text-white/80 hover:text-white transition-colors duration-200"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-3">
              <LangToggle />
              <Link
                href="/welcome"
                className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors duration-200"
              >
                {vex.chatButton}
              </Link>
            </div>

            {/* Mobile: lang + hamburger */}
            <div className="flex items-center gap-2 md:hidden">
              <LangToggle />
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300"
                style={{ backgroundColor: menuOpen ? 'rgba(255,255,255,0.07)' : 'transparent' }}
                aria-label="Toggle menu"
              >
                {menuOpen
                  ? <X size={20} color="#F5F1E8" strokeWidth={1.5} />
                  : <Menu size={20} color="#F5F1E8" strokeWidth={1.5} />
                }
              </button>
            </div>
          </nav>
        </header>

        {/* Hero content */}
        <div className="flex-1 w-full px-6 md:px-12 lg:px-16 pb-28 flex flex-col justify-end z-10 relative">
          <div className="w-full lg:grid lg:grid-cols-2 lg:items-end gap-12">
            <div className="space-y-6">
              <AnimatedHeading
                text={vex.headline}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal leading-[1.05] text-white"
              />
              <FadeIn delay={1300} duration={1000}>
                <p className="text-base md:text-lg text-gray-300 max-w-xl">{vex.subheading}</p>
              </FadeIn>
              <FadeIn delay={2000} duration={1000}>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/welcome"
                    className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
                  >
                    {vex.chatButton}
                  </Link>
                  <Link
                    href="/login"
                    className="liquid-glass border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-colors text-sm"
                  >
                    {vex.exploreButton}
                  </Link>
                </div>
              </FadeIn>
            </div>

            <div className="mt-8 lg:mt-0 flex items-end justify-start lg:justify-end">
              <FadeIn delay={2500} duration={1000} className="w-full sm:w-auto">
                <div className="liquid-glass border border-white/20 px-6 py-3 rounded-xl inline-block">
                  <p className="text-lg md:text-xl lg:text-2xl font-light text-white tracking-wide">{vex.tag}</p>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>

        <ChangelogPanel vex={vex} />
      </section>

      {/* ── Features grid ─────────────────────────────────────────────────── */}
      <section className="w-full px-6 md:px-12 lg:px-20 py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            className="text-3xl md:text-5xl font-normal leading-tight text-[#F5F1E8] mb-16 max-w-2xl"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {vex.sections.features.heading}
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vex.sections.features.cards.map((card, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="p-6 rounded-2xl flex flex-col gap-4"
                  style={{
                    backgroundColor: 'rgba(17,21,34,0.7)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    <Icon size={16} color="#B8BDC7" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#F5F1E8] mb-1.5">{card.title}</h3>
                    <p className="text-xs text-[#8A9099] leading-relaxed">{card.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section
        className="w-full px-6 md:px-12 lg:px-20 py-20"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {vex.sections.stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }}
            >
              <div
                className="text-4xl md:text-5xl font-normal mb-2 text-[#F5F1E8]"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {stat.value}
              </div>
              <div className="text-xs uppercase tracking-widest text-[#8A9099]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────────── */}
      <section className="w-full px-6 md:px-12 lg:px-20 py-32">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2
            className="text-4xl md:text-6xl font-normal text-[#F5F1E8] mb-6"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.03em' }}
          >
            {vex.sections.cta.heading}
          </h2>
          <p className="text-[#8A9099] text-base mb-10 max-w-lg mx-auto">{vex.sections.cta.sub}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/welcome"
              className="bg-[#F5F1E8] text-[#0A0D14] px-8 py-3.5 rounded-xl text-sm font-medium hover:bg-white transition-colors"
            >
              {vex.sections.cta.primary}
            </Link>
            <Link
              href="/login"
              className="text-[#B8BDC7] px-8 py-3.5 rounded-xl text-sm font-medium transition-colors hover:text-[#F5F1E8]"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {vex.sections.cta.secondary}
            </Link>
          </div>
        </motion.div>
      </section>

      <LandingFooter />

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

/* ── Changelog hover/click panel ───────────────────────────────────────────── */

const TAG_COLORS: Record<string, string> = {
  Major:   'bg-white/10 text-white border-white/20',
  Feature: 'bg-white/10 text-white/80 border-white/15',
  Foundation: 'bg-white/5 text-white/60 border-white/10',
  Majeur:  'bg-white/10 text-white border-white/20',
  'Fonctionnalité': 'bg-white/10 text-white/80 border-white/15',
  Fondations: 'bg-white/5 text-white/60 border-white/10',
};

type VexTranslation = ReturnType<typeof useLang>['t']['landing']['vex'];

function ChangelogPanel({ vex }: { vex: VexTranslation }) {
  const [hovered, setHovered] = useState(false);
  const [locked, setLocked] = useState(false);
  const open = hovered || locked;

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Expandable changelog card */}
      <div
        className="liquid-glass border border-white/10 rounded-t-2xl overflow-hidden w-[min(90vw,560px)] transition-all duration-500 ease-out"
        style={{
          maxHeight: open ? (locked ? '540px' : '440px') : '0px',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="p-5 max-h-[540px] overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">{vex.changelogTitle}</p>
          <p className="text-sm text-white/60 mb-4">{vex.changelogSub}</p>
          <div className="space-y-5">
            {vex.releases.map((release) => (
              <div key={release.version}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-white">{release.version}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', TAG_COLORS[release.tag] ?? 'bg-white/10 text-white/70 border-white/15')}>
                    {release.tag}
                  </span>
                  <span className="text-xs text-white/30 ml-auto">{release.date}</span>
                </div>
                <ul className="space-y-1">
                  {release.items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-xs text-white/60 leading-relaxed">
                      <span className="text-white/25 flex-shrink-0 mt-0.5">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trigger tab */}
      <button
        onClick={() => setLocked((v) => !v)}
        className="liquid-glass border border-white/10 border-b-0 rounded-t-xl px-5 py-1.5 cursor-pointer hover:border-white/20 transition-colors"
      >
        <p className="text-xs text-white/50 font-medium tracking-wide">
          {vex.changelogTitle}
          <span className="text-white/25"> · </span>
          {vex.releases[0]?.version}
          {locked && <span className="text-white/30 ml-2">×</span>}
        </p>
      </button>
    </div>
  );
}
