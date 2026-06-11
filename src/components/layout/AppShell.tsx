'use client';
import { createContext, useContext, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { ChatSidebar } from './ChatSidebar';
import { CommandPaletteProvider, useCommandPalette } from './CommandPalette';
import { BottomBlur } from '@/components/ui/edge-blur';
import Link from 'next/link';
import {
  Home,
  Users,
  Layers,
  BarChart2,
  Brain,
  Search,
  Menu,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLang } from '@/i18n';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';

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
  { href: '/app/dashboard',    icon: Home,       label: 'Home' },
  { href: '/app/clients',      icon: Users,      label: 'Clients' },
  { href: '/app/delivery',     icon: Layers,     label: 'Delivery' },
  { href: '/app/finance-hub',  icon: BarChart2,  label: 'Finance' },
  { href: '/app/intelligence', icon: Brain,      label: 'Intel' },
];

function MobileBottomNav() {
  const { setOpen: openPalette } = useCommandPalette();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLang();

  const navStyle = {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    backgroundColor: 'var(--background)',
    borderTop: '1px solid var(--border)',
    paddingBottom: 'env(safe-area-inset-bottom)',
  };
  const sheetStyle = { backgroundColor: 'var(--background)', maxHeight: '80vh' };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50"
      style={navStyle}
    >
      <div className="flex items-center justify-around px-2 h-[60px]">
        {MOBILE_NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const linkStyle = { color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' };
          const spanStyle = { fontSize: 10, fontWeight: isActive ? 600 : 400 };
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors"
              style={linkStyle}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span style={spanStyle}>{label}</span>
            </Link>
          );
        })}

        {/* Search */}
        <button
          onClick={() => openPalette(true)}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors text-muted-foreground"
          aria-label={t.app.searchCommands}
          title={t.app.searchCommands}
        >
          <Search size={20} strokeWidth={1.5} />
          <span className="text-[10px]">Search</span>
        </button>

        {/* More — opens full nav drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors text-muted-foreground"
              aria-label="More navigation"
            >
              <Menu size={20} strokeWidth={1.5} />
              <span className="text-[10px]">More</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl border-t border-border p-0"
            style={sheetStyle}
          >
            <div className="px-4 pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
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
  const router = useRouter();
  const pathname = usePathname();
  const { workspace, isLoading: workspaceLoading } = useWorkspace();

  useEffect(() => {
    if (!workspaceLoading && workspace && workspace.onboardingComplete === false) {
      router.push('/onboarding');
    }
  }, [workspaceLoading, workspace, router]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      {/* Main area */}
      <div className="relative flex-1 flex flex-col overflow-hidden bg-background min-w-0">
        <AppHeader />
        <ScrollArea className={`flex-1 h-full min-h-0 ${pathname === '/app/dashboard' ? 'no-scrollbar' : ''}`}>
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
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <CommandPaletteProvider>
      <SidebarContext.Provider value={{ collapsed: false, toggle: () => {} }}>
        <ChatContext.Provider value={{ isChatOpen, toggleChat: () => setIsChatOpen(o => !o) }}>
          <AppShellContent>{children}</AppShellContent>
        </ChatContext.Provider>
      </SidebarContext.Provider>
    </CommandPaletteProvider>
  );
}
