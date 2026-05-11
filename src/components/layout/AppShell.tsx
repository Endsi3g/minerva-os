'use client';
import { createContext, useContext, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { ChatSidebar } from './ChatSidebar';

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
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed(c => !c) }}>
      <ChatContext.Provider value={{ isChatOpen, toggleChat: () => setIsChatOpen(o => !o) }}>
        <div className="flex h-screen bg-void p-2 gap-2 overflow-hidden relative">
          {/* Sidebar */}
          <AppSidebar />

          {/* Main area */}
          <div className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-background min-w-0">
            <AppHeader />
            <ScrollArea className="flex-1">
              <div className="p-6">
                {children}
              </div>
            </ScrollArea>
          </div>

          {/* AI Chat Sidebar */}
          <ChatSidebar />
        </div>
      </ChatContext.Provider>
    </SidebarContext.Provider>
  );
}
