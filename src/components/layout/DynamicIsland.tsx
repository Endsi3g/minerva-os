'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Receipt,
  Settings,
  Search,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommandPalette } from './CommandPalette';

const NAV_ITEMS = [
  { href: '/app/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/app/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/app/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/app/billing', icon: Receipt, label: 'Billing' },
  { href: '/app/settings', icon: Settings, label: 'Settings' },
];

export function DynamicIsland() {
  const pathname = usePathname();
  const { setOpen: openPalette } = useCommandPalette();
  const [hovered, setHovered] = useState(false);

  // Transition parameters following AGENTS.md constraints:
  // "slow and atmospheric — 0.4–0.9s duration, cubic-bezier(0.22, 1, 0.36, 1) easing. No bouncy springs."
  const transition = {
    type: 'tween',
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1],
  };

  return (
    <div
      className="fixed top-3 right-20 z-50 pointer-events-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        layout
        transition={transition}
        style={{ borderRadius: 9999 }}
        className={cn(
          'pointer-events-auto flex items-center justify-center overflow-hidden border shadow-2xl transition-colors duration-300',
          hovered
            ? 'bg-[#111522]/95 border-white/12 h-11 px-5 gap-4 backdrop-blur-xl'
            : 'bg-[#0A0D14]/90 border-white/8 h-9 px-3 gap-2 backdrop-blur-md'
        )}
      >
        {/* Left side Sparkles indicator */}
        <motion.div layout transition={transition} className="flex items-center shrink-0">
          <Sparkles size={13} className="text-sage animate-pulse shrink-0" />
        </motion.div>

        {/* Collapsed visual indicator */}
        <AnimatePresence mode="wait">
          {!hovered && (
            <motion.span
              layout
              key="collapsed-text"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] font-medium tracking-[0.15em] uppercase text-silver font-sans select-none shrink-0"
            >
              Minerva
            </motion.span>
          )}
        </AnimatePresence>

        {/* Expanded Navigation Links */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              layout
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={transition}
              className="flex items-center gap-1 overflow-hidden shrink-0"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors select-none',
                      isActive
                        ? 'text-ivory bg-white/5 border border-white/10'
                        : 'text-silver hover:text-ivory hover:bg-white/[0.03]'
                    )}
                    title={item.label}
                  >
                    <item.icon size={13} className="shrink-0" />
                    <span className="hidden sm:inline text-[11px]">{item.label}</span>
                  </Link>
                );
              })}

              <div className="h-4 w-px bg-white/10 mx-1 shrink-0" />

              {/* Quick Search inside Dynamic Island */}
              <button
                onClick={() => openPalette(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-silver hover:text-ivory hover:bg-white/[0.03] transition-colors shrink-0"
                title="Search (⌘K)"
              >
                <Search size={13} className="shrink-0" />
                <span className="hidden sm:inline text-[11px]">Search</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
