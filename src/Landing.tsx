'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';

// Video URL from VEX Ventures specification
const BG_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4';

interface FadeInProps {
  children: ReactNode;
  delay?: number; // delay in ms
  duration?: number; // transition duration in ms
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
      className={cn("transition-opacity ease-out duration-1000", className)}
      style={{
        opacity: isMounted ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
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
  delay = 200,
  charDelay = 30,
  duration = 500,
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
                  {/* Add space after word if it is not the last word in the line */}
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
                      {'\u00A0'}
                    </span>
                  )}
                  {/* Increment counter for the space */}
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

export default function Landing() {
  const { t } = useLang();
  const vex = t.landing.vex;

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden flex flex-col font-sans select-none">
      {/* Full-screen background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        src={BG_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Navbar Container */}
      <header className="w-full px-6 md:px-12 lg:px-16 pt-6 z-10">
        <nav className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between w-full">
          {/* Logo */}
          <Link href="/" className="text-2xl font-semibold tracking-tight hover:opacity-90 transition-opacity">
            {vex.logo}
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {vex.navLinks.map((label) => (
              <span
                key={label}
                className="text-sm text-white hover:text-gray-300 cursor-pointer transition-colors duration-200"
              >
                {label}
              </span>
            ))}
          </div>

          {/* Start a Chat Button */}
          <Link
            href="/signup"
            className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
          >
            {vex.chatButton}
          </Link>
        </nav>
      </header>

      {/* Hero Content Container */}
      <div className="flex-1 w-full px-6 md:px-12 lg:px-16 pb-24 lg:pb-28 flex flex-col justify-end z-10 relative">
        <div className="w-full lg:grid lg:grid-cols-2 lg:items-end gap-12">
          {/* Left Column - Main content */}
          <div className="space-y-6">
            {/* Staggered text heading */}
            <AnimatedHeading
              text={vex.headline}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal leading-[1.05] text-white"
            />

            {/* Subheading */}
            <FadeIn delay={800} duration={1000}>
              <p className="text-base md:text-lg text-gray-300 max-w-xl">
                {vex.subheading}
              </p>
            </FadeIn>

            {/* Action buttons row */}
            <FadeIn delay={1200} duration={1000}>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer text-center text-sm"
                >
                  {vex.chatButton}
                </Link>
                <Link
                  href="/login"
                  className="liquid-glass border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-colors cursor-pointer text-center text-sm"
                >
                  {vex.exploreButton}
                </Link>
              </div>
            </FadeIn>
          </div>

          {/* Right Column - Tag */}
          <div className="mt-8 lg:mt-0 flex items-end justify-start lg:justify-end">
            <FadeIn delay={1400} duration={1000} className="w-full sm:w-auto">
              <div className="liquid-glass border border-white/20 px-6 py-3 rounded-xl inline-block">
                <p className="text-lg md:text-xl lg:text-2xl font-light text-white tracking-wide">
                  {vex.tag}
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* Changelog hover panel — fixed at bottom center */}
      <ChangelogPanel vex={vex} />
    </div>
  );
}

/* ── Changelog hover panel ─────────────────────────────────────────────────── */

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
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Expandable changelog card */}
      <div
        className="liquid-glass border border-white/10 rounded-t-2xl overflow-hidden w-[min(90vw,560px)] transition-all duration-500 ease-out"
        style={{
          maxHeight: open ? '440px' : '0px',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="p-5 max-h-[440px] overflow-y-auto">
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

      {/* Trigger tab — always visible */}
      <div className="liquid-glass border border-white/10 border-b-0 rounded-t-xl px-5 py-1.5 cursor-default">
        <p className="text-xs text-white/50 font-medium tracking-wide">
          {vex.changelogTitle} <span className="text-white/25">·</span> {vex.releases[0]?.version}
        </p>
      </div>
    </div>
  );
}
