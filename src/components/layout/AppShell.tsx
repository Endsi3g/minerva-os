'use client';
import { createContext, useContext, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { ChatSidebar } from './ChatSidebar';
import { CommandPaletteProvider, useCommandPalette } from './CommandPalette';
import { BottomBlur } from '@/components/ui/edge-blur';
import { DynamicIsland } from './DynamicIsland';
import Link from 'next/link';
import {
  Command,
  TrendingUp,
  Layers,
  BarChart2,
  Activity,
  Search,
  Menu,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
}

interface ChatContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
}

const SidebarContext = createContext<SidebarContextType>({ collapsed: false, toggle: () => {} });
const ChatContext = createContext<ChatContextType>({ isChatOpen: false, toggleChat: () => {} });

export const useSidebar = () => useContext(SidebarContext);
export const useChat = () => useContext(ChatContext);

const MOBILE_NAV_ITEMS = [
  { href: '/app/command',  icon: Command,    label: 'Command' },
  { href: '/app/pipeline', icon: TrendingUp, label: 'Growth' },
  { href: '/app/projects', icon: Layers,     label: 'Delivery' },
  { href: '/app/billing',  icon: BarChart2,  label: 'Finance' },
  { href: '/app/nps',      icon: Activity,   label: 'Pulse' },
];

function MobileBottomNav() {
  const { setOpen: openPalette } = useCommandPalette();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(10,13,20,0.88)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2 h-[60px]">
        {MOBILE_NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors"
              style={{ color: isActive ? '#7FA38A' : '#9FA8B5' }}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
            </Link>
          );
        })}

        {/* Search */}
        <button
          onClick={() => openPalette(true)}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors"
          style={{ color: '#9FA8B5' }}
          aria-label="Search"
        >
          <Search size={20} strokeWidth={1.5} />
          <span style={{ fontSize: 10 }}>Search</span>
        </button>

        {/* More — opens full nav drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors"
              style={{ color: '#9FA8B5' }}
              aria-label="More navigation"
            >
              <Menu size={20} strokeWidth={1.5} />
              <span style={{ fontSize: 10 }}>More</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl border-t border-white/10 p-0"
            style={{
              background: 'var(--midnight)',
              maxHeight: '80vh',
            }}
          >
            <div className="px-4 pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
              <AppSidebar />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-void p-2 gap-2 overflow-hidden relative">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      {/* Main area */}
      <div className="relative flex-1 flex flex-col overflow-hidden rounded-2xl bg-background min-w-0">
        <DynamicIsland />
        <AppHeader />
        <ScrollArea className="flex-1">
          <div className={isMobile ? 'p-4 pb-[80px]' : 'p-6 pb-24'}>
            <div className="w-full">
              {children}
            </div>
          </div>
        </ScrollArea>
        <BottomBlur className="absolute z-30" />

      </div>

      {/* AI Chat Sidebar */}
      <ChatSidebar />

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <CommandPaletteProvider>
      <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed(c => !c) }}>
        <ChatContext.Provider value={{ isChatOpen, toggleChat: () => setIsChatOpen(o => !o) }}>
          <AppShellContent>{children}</AppShellContent>
        </ChatContext.Provider>
      </SidebarContext.Provider>
    </CommandPaletteProvider>
  );
}
