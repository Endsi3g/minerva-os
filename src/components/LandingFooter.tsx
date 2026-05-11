import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FAQ_DATA = [
  {
    q: 'How do I get started with Minerva?',
    a: 'Request access via our portal. Once approved, you can start onboarding your agency and talent pool instantly.',
  },
  {
    q: 'Does my client need an account?',
    a: "No, your clients don't need an account. They access their dedicated portal via secure, encrypted links to track progress and approve deliverables.",
  },
  {
    q: 'Is there a mobile app available?',
    a: 'Yes, Minerva OS is built as a progressive web application, delivering a premium experience on iOS, Android, and desktop.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Subscriptions can be managed directly in your agency settings. We offer flexible plans that grow with your agency size.',
  },
  {
    q: 'What integrations are supported?',
    a: 'We support over 50 integrations including Stripe, Slack, and major cloud storage providers to centralize your operations.',
  },
];

const FOOTER_LINKS: Record<string, string[]> = {
  Platform: ['Features', 'Modules', 'Client Portal', 'Security', 'Insights'],
  Company: ['About', 'Blog', 'Careers', 'Contact'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
};

/* ── CTA Banner — full-width, standalone ─────────────────────────────────── */

function CTABanner() {
  const [hovered, setHovered] = useState(false);

  return (
    <section className="c5-animated-gradient relative overflow-hidden" style={{ minHeight: '420px' }}>
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.18)' }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center text-center py-28 px-5">
        <motion.div
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 24 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[10px] tracking-[0.22em] uppercase text-white/40 mb-5 font-medium">
            Start your journey
          </p>
          <h2
            className="font-normal text-white leading-[1.1] mb-6"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(2.25rem, 5.5vw, 4.5rem)',
              letterSpacing: '-0.03em',
              textShadow: '0 4px 32px rgba(0,0,0,0.4)',
            }}
          >
            Ready to Scale
            <br />
            Without Borders?
          </h2>
          <p className="text-base text-white/60 mb-10 max-w-md mx-auto leading-relaxed font-light">
            Operate your agency worldwide with clarity and precision. Centralize acquisition, onboarding, and execution.
          </p>
          <button
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="bg-[#F5F1E8] text-[#0A0D14] font-semibold text-sm cursor-pointer border-none transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
            style={{
              padding: '16px 48px',
              borderRadius: '12px',
              boxShadow: hovered
                ? '0 20px 40px rgba(245,241,232,0.20), 0 4px 12px rgba(0,0,0,0.3)'
                : '0 8px 24px rgba(0,0,0,0.35)',
            }}
          >
            Get Started Today
          </button>
        </motion.div>
      </div>
    </section>
  );
}

/* ── FAQ Section ─────────────────────────────────────────────────────────── */

function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="py-32 bg-[#0A0D14]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="max-w-[860px] mx-auto px-5">
        {/* Header */}
        <motion.div
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 16 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="text-[10px] tracking-[0.22em] uppercase text-[#7FA38A]/70 font-medium">FAQ</span>
          <h2
            className="text-3xl md:text-4xl font-normal text-[#F5F1E8] mt-3"
            style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '-0.02em' }}
          >
            Common questions
          </h2>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQ_DATA.map((item, index) => (
            <motion.div
              key={index}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 12 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.5 }}
              onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              className="rounded-[14px] border cursor-pointer transition-all duration-300"
              style={{
                borderColor: activeIndex === index ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                backgroundColor: activeIndex === index ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
              }}
            >
              <div className="flex justify-between items-center px-7 py-5">
                <span
                  className="font-medium text-sm text-[#F5F1E8] tracking-tight"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {item.q}
                </span>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-4 transition-colors duration-300"
                  style={{
                    backgroundColor: activeIndex === index ? 'rgba(127,163,138,0.15)' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  {activeIndex === index ? (
                    <Minus size={12} className="text-[#7FA38A]" strokeWidth={2} />
                  ) : (
                    <Plus size={12} className="text-white/40" strokeWidth={2} />
                  )}
                </div>
              </div>
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p
                      className="px-7 pb-6 text-sm leading-relaxed"
                      style={{
                        color: 'rgba(184,189,199,0.60)',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Main Footer ─────────────────────────────────────────────────────────── */

export default function LandingFooter() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* CTA Banner — standalone, full width */}
      <CTABanner />

      {/* FAQ — separated from CTA */}
      <FAQSection />

      {/* Footer */}
      <footer
        className="bg-[#0A0D14] pt-20 pb-10"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="max-w-[1280px] w-full mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-16 mb-20">
            {/* Brand column */}
            <div>
              <div
                className="text-sm font-semibold text-[#F5F1E8] mb-5 tracking-[0.18em] uppercase"
                style={{ letterSpacing: '0.18em' }}
              >
                MINERVA
              </div>
              <p
                className="text-sm text-[#B8BDC7]/40 leading-[1.8] max-w-[220px]"
                style={{ letterSpacing: '0.01em' }}
              >
                The strategic operating system for elite agencies. Built for clarity, precision, and global scale.
              </p>

              {/* Newsletter */}
              <div className="mt-10">
                <p className="text-xs tracking-[0.12em] uppercase text-white/30 mb-4 font-medium">
                  Stay updated
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@agency.com"
                    className="flex-grow border bg-transparent outline-none text-xs text-[#F5F1E8] placeholder:text-white/20 focus:border-white/25 transition-colors duration-200"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  />
                  <button
                    className="bg-[#F5F1E8] text-[#0A0D14] font-semibold text-xs cursor-pointer border-none transition-all duration-200 hover:-translate-y-0.5 flex-shrink-0"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(245,241,232,0.08)',
                    }}
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h4
                  className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/30 mb-7"
                  style={{ letterSpacing: '0.18em' }}
                >
                  {category}
                </h4>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-[#B8BDC7]/40 no-underline hover:text-[#F5F1E8] transition-colors duration-200"
                        style={{ letterSpacing: '0.03em' }}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span
              className="text-xs text-[#B8BDC7]/25"
              style={{ letterSpacing: '0.05em' }}
            >
              © 2026 Minerva OS — All rights reserved.
            </span>
            <div className="flex items-center gap-6">
              {['Privacy', 'Terms', 'Cookies'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs text-[#B8BDC7]/25 no-underline hover:text-white/50 transition-colors duration-200"
                  style={{ letterSpacing: '0.05em' }}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
