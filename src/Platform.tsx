import { useState } from 'react';
import { useLang } from './i18n';
import Header from './components/Header';
import LandingFooter from './components/LandingFooter';
import { motion } from 'motion/react';
import { IntroDisclosure } from './components/ui/intro-disclosure';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Platform() {
  const { t } = useLang();
  const [tourOpen, setTourOpen] = useState(false);

  const steps = [
    {
      title: "Celestial Architecture",
      short_description: "Centralize your agency operations in a beautiful obsidian workspace.",
      full_description: "Minerva OS provides unified oversight across projects, pipeline status, and finance metrics under a curated editorial aesthetic.",
      media: {
        type: "image" as const,
        src: "/brand/tour_dashboard.png",
        alt: "Obsidian Workspace Dashboard Mockup",
      }
    },
    {
      title: "Client Portal Sync",
      short_description: "Real-time client collaboration and approval flow.",
      full_description: "Deliverables are submitted directly to the client portal, where stakeholder committees can vote, comment, and review instantly.",
      media: {
        type: "image" as const,
        src: "/brand/tour_portal.png",
        alt: "Client Portal Approval interface Mockup",
      }
    },
    {
      title: "Hermes AI Assistant",
      short_description: "Automated agent workflows for project health monitoring.",
      full_description: "Hermes watches active risks, flags potential delays, and generates action suggestions that you can approve with a single click.",
      media: {
        type: "image" as const,
        src: "/brand/tour_hermes.png",
        alt: "AI agent supervision interface Mockup",
      }
    }
  ];

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
            {t.nav.items[0].toUpperCase()}
          </div>
          
          <h1 
            className="text-4xl md:text-6xl font-normal leading-[1.1] tracking-tight text-[#F5F1E8] mb-8"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            The engine of <br className="hidden sm:block" /> agency excellence.
          </h1>
          
          <p 
            className="text-base md:text-lg text-[#B8BDC7]/70 leading-relaxed max-w-2xl mx-auto mb-12"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            Minerva OS is not just a tool; it's a strategic framework designed to centralize your entire operations. From talent acquisition to delivery precision, every detail is engineered for clarity.
          </p>

          <div className="flex justify-center mb-16">
            <button
              onClick={() => setTourOpen(true)}
              className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#F5F1E8] text-[#0A0D14] hover:bg-[#F5F1E8]/90 transition-all cursor-pointer"
            >
              Start Feature Tour
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {[
              { title: "Unified Workflow", desc: "Break silos and connect every phase of your project lifecycle." },
              { title: "Strategic Oversight", desc: "Real-time visibility into agency health and performance metrics." },
              { title: "Talent Alignment", desc: "Map the right skills to the right challenges with surgical precision." },
              { title: "Delivery Excellence", desc: "Maintain the highest standards of quality across every output." }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm"
              >
                <h3 className="text-lg font-medium text-[#F5F1E8] mb-3">{feature.title}</h3>
                <p className="text-sm text-[#B8BDC7]/60 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <LandingFooter />

      {/* Intro Feature Tour Dialog */}
      <IntroDisclosure
        steps={steps}
        open={tourOpen}
        setOpen={setTourOpen}
        featureId="platform-tour"
      />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-emerald-500/5 blur-[100px] pointer-events-none" />
    </div>
  );
}

