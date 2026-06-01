'use client';
import { useLang } from '@/i18n';
import { Button } from '@/components/ui/button';
import { FileWarning } from 'lucide-react';
import { motion } from 'motion/react';

export default function PortalExpired() {
  const { t, lang, setLang } = useLang();
  const exp = t.app.clients.portal.expired;

  return (
    <div className="min-h-screen w-full bg-[#0A0D14] flex flex-col justify-between p-6 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Header / Language Switcher */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md flex items-center justify-center bg-[#F5F1E8]">
            <span className="text-[10px] font-bold text-[#0A0D14]">M</span>
          </div>
          <span className="text-sm font-semibold tracking-wide text-[#F5F1E8]">Minerva</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
          className="text-xs text-[#8A9099] hover:text-[#F5F1E8] border border-white/5"
        >
          {lang === 'en' ? 'FR' : 'EN'}
        </Button>
      </header>

      {/* Main Expired Message */}
      <main className="flex-1 flex items-center justify-center z-10 my-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md p-8 text-center space-y-6"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-[#A86A6A]/10 border border-[#A86A6A]/20 flex items-center justify-center">
            <FileWarning size={28} className="text-[#A86A6A]" />
          </div>

          <div className="space-y-3">
            <h1
              className="text-3xl font-normal text-[#F5F1E8]"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}
            >
              {exp.title}
            </h1>
            <p className="text-sm text-[#B8BDC7] leading-relaxed max-w-sm mx-auto">
              {exp.desc}
            </p>
            <p className="text-xs text-[#8A9099] max-w-xs mx-auto">
              {exp.contact}
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-[#8A9099] z-10 opacity-65">
        Powered by Minerva OS · Uprising Studio
      </footer>

      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#A86A6A]/3 blur-[120px] pointer-events-none rounded-full" />
    </div>
  );
}
