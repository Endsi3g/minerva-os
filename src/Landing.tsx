'use client';
import Navbar from '@/components/landing/Navbar';
import DashboardPreview from '@/components/landing/DashboardPreview';
import { useLang } from '@/i18n';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4';
const POSTER = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60';

export default function Landing() {
  const { t } = useLang();
  const l = t.landing;

  return (
    <div
      className="min-h-screen w-full p-3 sm:p-4"
      style={{ backgroundColor: '#ededed', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Hero container — clips everything inside */}
      <div
        className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl"
        style={{
          height: 'calc(100vh - 24px)',
          backgroundColor: '#d9d9d9',
        }}
      >
        {/* Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          src={BG_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={POSTER}
        />

        {/* White overlay */}
        <div className="absolute inset-0 bg-white/10" />

        {/* Foreground content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Navbar */}
          <Navbar />

          {/* Hero Content */}
          <div className="flex flex-col items-center px-4 pt-10 sm:pt-16 pb-8 sm:pb-12 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm mb-5 sm:mb-6">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#ef4d23' }} />
              <span className="text-[13px] font-medium text-neutral-700">{l.badge}</span>
            </div>

            {/* Headline */}
            <h1
              className="mt-0 max-w-4xl"
              style={{
                fontSize: 'clamp(36px, 8vw, 72px)',
                lineHeight: 1.05,
                fontWeight: 500,
                letterSpacing: '-0.02em',
                color: '#0b0f1a',
              }}
            >
              Shaping{' '}
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                Agencies
              </span>
              <br />
              of tomorrow
            </h1>

            {/* Subtitle */}
            <p
              className="mt-4 sm:mt-6 text-neutral-700 px-2 max-w-2xl"
              style={{ fontSize: 'clamp(13px, 3.5vw, 16px)' }}
            >
              {l.subtitle}
            </p>

            {/* CTA */}
            <Link
              href="/signup"
              className="mt-6 sm:mt-8 inline-flex items-center gap-3 rounded-full pl-6 sm:pl-7 pr-2 py-2 sm:py-2.5 text-white hover:brightness-110 active:scale-[0.98] transition-all"
              style={{
                backgroundColor: '#0b0f1a',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {l.cta}
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <ChevronRight size={16} strokeWidth={3} />
              </div>
            </Link>
          </div>

          {/* Dashboard Preview — bleeds off bottom edge */}
          <div className="mt-auto w-full">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
