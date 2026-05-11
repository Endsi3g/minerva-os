import { useLang } from './i18n';
import Header from './components/Header';
import LandingFooter from './components/LandingFooter';
import { motion } from 'motion/react';

export default function ClientPortal() {
  const { t } = useLang();

  return (
    <div className="min-h-screen w-full bg-[#0A0D14] flex flex-col relative overflow-x-hidden">
      <Header />
      
      <main className="flex-1 flex flex-col items-center pt-32 pb-20 px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 bg-white/5 border border-white/10 text-[#B8BDC7] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7FA38A]" />
            {t.nav.items[2].toUpperCase()}
          </div>
          
          <h1 
            className="text-4xl md:text-6xl font-normal leading-[1.1] tracking-tight text-[#F5F1E8] mb-8"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            The window into <br className="hidden sm:block" /> your agency's heart.
          </h1>
          
          <p 
            className="text-base md:text-lg text-[#B8BDC7]/70 leading-relaxed max-w-2xl mx-auto mb-16"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            A premium, white-labeled experience for your clients. Provide transparency without the noise. From milestone approvals to asset delivery, the client portal is the center of trust.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {[
              { title: "Radical Transparency", desc: "Live progress bars and real-time activity feeds for every project milestone." },
              { title: "One-Click Approvals", desc: "Reduce friction with integrated feedback and sign-off tools." },
              { title: "Secure Asset Vault", desc: "Enterprise-grade storage for every deliverable and source file." },
              { title: "Direct Communication", desc: "High-signal communication channels that bypass the chaos of email." }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                className="p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent"
              >
                <h3 className="text-xl font-medium text-[#F5F1E8] mb-4">{feature.title}</h3>
                <p className="text-sm text-[#B8BDC7]/50 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <LandingFooter />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] pointer-events-none" />
    </div>
  );
}
