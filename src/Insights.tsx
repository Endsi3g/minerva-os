import { useLang } from './i18n';
import Header from './components/Header';
import LandingFooter from './components/LandingFooter';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Users2, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Insights() {
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
            {t.nav.items[4].toUpperCase()}
          </div>
          
          <h1 
            className="text-4xl md:text-6xl font-normal leading-[1.1] tracking-tight text-[#F5F1E8] mb-8"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Intelligence, <br className="hidden sm:block" /> not just information.
          </h1>
          
          <p 
            className="text-base md:text-lg text-[#B8BDC7]/70 leading-relaxed max-w-2xl mx-auto mb-16"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            Go beyond simple reporting. Minerva's Insight engine analyzes historical patterns to predict resource bottlenecks and profitability trends before they impact your delivery.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
            {[
              { label: "Efficiency", value: "94.2%", icon: BarChart3, color: "text-emerald-400" },
              { label: "Growth", value: "+12%", icon: TrendingUp, color: "text-blue-400" },
              { label: "Talent Util.", value: "88%", icon: Users2, color: "text-purple-400" },
              { label: "Avg. Cycle", value: "14d", icon: Clock, color: "text-orange-400" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center"
              >
                <stat.icon size={20} className={`${stat.color} mb-3`} />
                <div className="text-2xl font-semibold text-[#F5F1E8] mb-1">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-[#B8BDC7]/40">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
             <div className="space-y-6">
                <h3 className="text-xl font-medium text-[#F5F1E8]">Operational Intelligence</h3>
                <p className="text-sm text-[#B8BDC7]/60 leading-relaxed">Stop guessing your next move. Our deep analytics provide a clear roadmap based on actual delivery performance and talent velocity.</p>
                <ul className="space-y-3">
                   {["Predictive resourcing", "Profitability heatmaps", "Real-time burn rates"].map(item => (
                     <li key={item} className="flex items-center gap-3 text-xs text-[#B8BDC7]/80">
                        <div className="w-1 h-1 rounded-full bg-[#7FA38A]" />
                        {item}
                     </li>
                   ))}
                </ul>
             </div>
             <div className="relative aspect-square md:aspect-auto rounded-3xl border border-white/5 bg-white/[0.01] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                <div className="text-[#F5F1E8]/10 text-6xl font-serif">Data</div>
             </div>
          </div>
        </motion.div>
      </main>

      <LandingFooter />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] pointer-events-none" />
    </div>
  );
}
