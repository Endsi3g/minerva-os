import { createContext, useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({ collapsed: false, toggle: () => {} });
export const useSidebar = () => useContext(SidebarContext);

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed(c => !c) }}>
      <div className="flex h-screen bg-void p-2 gap-2 overflow-hidden">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-background min-w-0">
          <AppHeader />
          <ScrollArea className="flex-1">
            <div className="p-6">
              <Outlet />
            </div>
          </ScrollArea>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
