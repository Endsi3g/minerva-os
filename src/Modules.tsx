import { useLang } from './i18n';
import Header from './components/Header';
import LandingFooter from './components/LandingFooter';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Modules() {
  const { t } = useLang();

  return (
    <div className="min-h-screen w-full bg-[#0A0D14] flex flex-col relative overflow-x-hidden">
      <Header />
      
      <main className="flex-1 flex flex-col items-center pt-32 pb-20 px-6 sm:px-10">
        <div className="w-full max-w-4xl mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-200 group"
            style={{ color: 'rgba(184,189,199,0.45)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#B8BDC7')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(184,189,199,0.45)')}
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
            {t.nav.back}
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 bg-white/5 border border-white/10 text-[#B8BDC7] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7FA38A]" />
            {t.nav.items[1].toUpperCase()}
          </div>
          
          <h1 
            className="text-4xl md:text-6xl font-normal leading-[1.1] tracking-tight text-[#F5F1E8] mb-8"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Surgical tools <br className="hidden sm:block" /> for modern agencies.
          </h1>
          
          <p 
            className="text-base md:text-lg text-[#B8BDC7]/70 leading-relaxed max-w-2xl mx-auto mb-16"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            Customizable modules that adapt to your specific agency model. Whether you focus on creative production or technical consulting, Minerva's modular core expands with your needs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { title: "Acquisition", desc: "CRM optimized for strategic deal flows and high-touch relationships." },
              { title: "Onboarding", desc: "Automated white-glove onboarding experiences for every new client." },
              { title: "Talent Map", desc: "Global skills inventory and capacity planning dashboard." },
              { title: "Resource Hub", desc: "Centralized assets, templates, and knowledge management." },
              { title: "Financials", desc: "Profitability tracking and automated billing infrastructure." },
              { title: "Automation", desc: "No-code workflows to eliminate repetitive agency tasks." }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm"
              >
                <h3 className="text-base font-medium text-[#F5F1E8] mb-3">{feature.title}</h3>
                <p className="text-xs text-[#B8BDC7]/50 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <LandingFooter />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-orange-500/5 blur-[100px] pointer-events-none" />
    </div>
  );
}
