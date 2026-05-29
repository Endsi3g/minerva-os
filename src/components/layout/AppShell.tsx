'use client';
import { createContext, useContext, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { ChatSidebar } from './ChatSidebar';
import { CommandPaletteProvider } from './CommandPalette';
import { TopBlur, BottomBlur } from '@/components/ui/edge-blur';
import { Dock, DockCard } from '@/components/ui/dock';
import Link from 'next/link';
import { LayoutDashboard, FolderKanban, CheckSquare, ClipboardCheck, FileBox, Settings } from 'lucide-react';

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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <CommandPaletteProvider>
      <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed(c => !c) }}>
        <ChatContext.Provider value={{ isChatOpen, toggleChat: () => setIsChatOpen(o => !o) }}>
          <div className="flex h-screen bg-void p-2 gap-2 overflow-hidden relative">
            {/* Sidebar */}
            <AppSidebar />

            {/* Main area */}
            <div className="relative flex-1 flex flex-col overflow-hidden rounded-2xl bg-background min-w-0">
              <TopBlur className="absolute z-30" />
              <AppHeader />
              <ScrollArea className="flex-1">
                <div className="p-6 pb-24">
                  {children}
                </div>
              </ScrollArea>
              <BottomBlur className="absolute z-30" />

              {/* Floating Dock */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 pb-4 pt-10 px-20 group">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] transform translate-y-2 group-hover:translate-y-0 scale-95 group-hover:scale-100">
                  <Dock>
                    <DockCard id="dashboard">
                      <Link href="/app/dashboard" className="text-silver hover:text-ivory p-2 flex items-center justify-center" title="Dashboard">
                        <LayoutDashboard size={18} />
                      </Link>
                    </DockCard>
                    <DockCard id="projects">
                      <Link href="/app/projects" className="text-silver hover:text-ivory p-2 flex items-center justify-center" title="Projects">
                        <FolderKanban size={18} />
                      </Link>
                    </DockCard>
                    <DockCard id="tasks">
                      <Link href="/app/tasks" className="text-silver hover:text-ivory p-2 flex items-center justify-center" title="Tasks">
                        <CheckSquare size={18} />
                      </Link>
                    </DockCard>
                    <DockCard id="approvals">
                      <Link href="/app/approvals" className="text-silver hover:text-ivory p-2 flex items-center justify-center" title="Approvals">
                        <ClipboardCheck size={18} />
                      </Link>
                    </DockCard>
                    <DockCard id="files">
                      <Link href="/app/files" className="text-silver hover:text-ivory p-2 flex items-center justify-center" title="Files">
                        <FileBox size={18} />
                      </Link>
                    </DockCard>
                    <DockCard id="settings">
                      <Link href="/app/settings" className="text-silver hover:text-ivory p-2 flex items-center justify-center" title="Settings">
                        <Settings size={18} />
                      </Link>
                    </DockCard>
                  </Dock>
                </div>
              </div>
            </div>

            {/* AI Chat Sidebar */}
            <ChatSidebar />
          </div>
        </ChatContext.Provider>
      </SidebarContext.Provider>
    </CommandPaletteProvider>
  );
}
