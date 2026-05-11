import { useLang } from './i18n';
import Header from './components/Header';
import LandingFooter from './components/LandingFooter';
import { motion } from 'motion/react';

export default function Security() {
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
            {t.nav.items[3].toUpperCase()}
          </div>
          
          <h1 
            className="text-4xl md:text-6xl font-normal leading-[1.1] tracking-tight text-[#F5F1E8] mb-8"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Fortress-grade <br className="hidden sm:block" /> agency security.
          </h1>
          
          <p 
            className="text-base md:text-lg text-[#B8BDC7]/70 leading-relaxed max-w-2xl mx-auto mb-16"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            Your agency's IP is your most valuable asset. Minerva OS is built with enterprise-grade encryption and granular access controls, ensuring your data—and your clients'—remains sovereign.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left mb-20">
            {[
              { title: "End-to-End Encryption", desc: "Data is encrypted at rest and in transit using the highest industry standards." },
              { title: "Granular Permissions", desc: "Control access at the module, project, and even field level for total sovereignty." },
              { title: "Audit Trails", desc: "Complete immutable logs of every action taken within your operating system." },
              { title: "Sovereign Identity", desc: "Integrated SSO and multi-factor authentication for every team member and client." }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="flex gap-6"
              >
                <div className="w-1 h-full bg-white/10 rounded-full flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-[#F5F1E8] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#B8BDC7]/50 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-10 rounded-3xl border border-[#7FA38A]/20 bg-[#7FA38A]/5 text-center">
             <h2 className="text-xl font-medium text-[#F5F1E8] mb-4">Need a detailed security assessment?</h2>
             <p className="text-[#B8BDC7]/70 text-sm mb-6 max-w-lg mx-auto">Our infrastructure team provides comprehensive whitepapers and compliance documentation for enterprise requirements.</p>
             <button className="text-sm font-medium px-6 py-2.5 rounded-full bg-[#F5F1E8] text-[#0A0D14] hover:opacity-90 transition-all">Download Security PDF</button>
          </div>
        </motion.div>
      </main>

      <LandingFooter />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#7FA38A]/5 to-transparent pointer-events-none" />
    </div>
  );
}
