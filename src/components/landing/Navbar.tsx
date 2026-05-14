'use client';

import { useState } from 'react';
import { ShoppingCart, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useLang } from '@/i18n';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLang();
  const l = t.landing.nav;

  const navItems = [
    { label: l.home, href: '#', hasDot: true },
    { label: l.features, href: '#' },
    { label: l.about, href: '#' },
    { label: l.pages, href: '#', hasChevron: true },
  ];

  return (
    <nav className="flex justify-center pt-4 sm:pt-6 px-3 sm:px-4 relative z-50">
      <div className="bg-white rounded-full shadow-sm border border-neutral-200 pl-2 pr-2 py-2 w-full max-w-[760px] relative flex items-center">
        {/* Logo */}
        <Link href="/" className="shrink-0 ml-1">
          <svg width="32" height="32" viewBox="0 0 32 32" className="w-7 h-7 sm:w-8 sm:h-8">
            <circle cx="16" cy="16" r="3.5" fill="#ef4d23" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 8;
              const x = 16 + 10 * Math.cos(angle);
              const y = 16 + 10 * Math.sin(angle);
              return <circle key={i} cx={x} cy={y} r="3.5" fill="#ef4d23" />;
            })}
          </svg>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 ml-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[14px] font-medium text-neutral-600 hover:text-black flex items-center gap-1.5 transition-colors"
            >
              {item.label}
              {item.hasDot && <span className="w-[1.5px] h-[1.5px] bg-black rounded-full" />}
              {item.hasChevron && <ChevronDown size={14} className="text-[#ef4d23]" strokeWidth={3.5} />}
            </Link>
          ))}
        </div>

        {/* Right Cluster */}
        <div className="ml-auto flex items-center gap-2">
          <button className="hidden sm:flex items-center justify-center w-10 h-10 text-neutral-600 hover:text-black transition-colors">
            <ShoppingCart size={20} strokeWidth={2} />
          </button>
          
          <Link
            href="/signup"
            className="bg-[#ef4d23] text-white rounded-full pl-5 pr-2 py-2 text-[13px] sm:text-[14px] font-semibold flex items-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span className="hidden sm:inline">{l.getAccess}</span>
            <span className="sm:hidden">{l.earlyAccess}</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronRight size={14} strokeWidth={3} />
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden w-10 h-10 flex items-center justify-center text-neutral-600"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-2 right-2 mt-2 bg-white rounded-2xl shadow-lg border border-neutral-200 p-3 z-20 md:hidden"
            >
              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="px-4 py-3 text-[15px] font-medium text-neutral-700 hover:bg-neutral-50 rounded-xl flex items-center justify-between"
                  >
                    {item.label}
                    {item.hasChevron && <ChevronDown size={16} className="text-[#ef4d23]" />}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
