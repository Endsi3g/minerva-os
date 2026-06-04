'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useLang } from '@/i18n';

export default function NotFound() {
  const { t } = useLang();
  const nf = t.notFound;

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden"
      style={{ backgroundColor: '#0A0D14' }}
    >
      {/* Decorative subtle background gradient */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle 400px at 50% 50%, rgba(184, 155, 106, 0.08), transparent)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md space-y-8">
        {/* Large stylized 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2"
        >
          <span
            className="text-8xl md:text-9xl font-bold tracking-tighter block"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: '#F5F1E8',
              backgroundImage: 'linear-gradient(to bottom, #F5F1E8, #8A9099)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </span>
          <h1
            className="text-xl md:text-2xl font-medium text-ivory tracking-tight"
            style={{ color: '#F5F1E8' }}
          >
            {nf.heading}
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm md:text-base leading-relaxed"
          style={{ color: '#B8BDC7' }}
        >
          {nf.subheading}
        </motion.p>

        {/* Back Home CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/app/dashboard"
            className="inline-block px-8 py-3 rounded-full text-sm font-medium tracking-wide transition-all shadow-lg active:scale-95 cursor-pointer"
            style={{
              backgroundColor: '#F5F1E8',
              color: '#0A0D14',
            }}
          >
            {nf.backHome}
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
