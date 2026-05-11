'use client';
import { usePathname, useRouter } from 'next/navigation';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar, useChat } from './AppShell';
import { useTheme } from '@/theme';

const PAGE_LABELS: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/pipeline':  'Pipeline',
  '/app/clients':   'Clients',
  '/app/projects':  'Projects',
  '/app/tasks':     'Tasks',
  '/app/approvals': 'Approvals',
  '/app/files':     'Files',
  '/app/billing':   'Billing',
  '/app/reports':   'Reports',
  '/app/settings':  'Settings',
};

export function AppHeader() {
  const { collapsed, toggle } = useSidebar();
  const { toggleChat } = useChat();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const pageLabel = PAGE_LABELS[pathname ?? ''] ?? 'Minerva OS';

  return (
    <header className="h-14 flex items-center px-4 gap-3 border-b border-border shrink-0">
      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="text-fog hover:text-ivory"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </Button>

      {/* Breadcrumb */}
      <span className="text-sm font-medium text-ivory">{pageLabel}</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <Button variant="ghost" size="icon" className="text-fog hover:text-ivory" aria-label="Search">
        <Search size={16} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleChat}
        className="text-fog hover:text-sage transition-colors" 
        aria-label="AI Chat"
      >
        <MessageSquare size={16} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="text-fog hover:text-ivory"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </Button>

      <Button variant="ghost" size="icon" className="text-fog hover:text-ivory relative" aria-label="Notifications">
        <Bell size={16} />
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-sage" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none" aria-label="User menu">
            <Avatar className="h-7 w-7 cursor-pointer hover:ring-2 hover:ring-border transition-all">
              <AvatarFallback className="text-[10px]">US</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Uprising Studio</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/app/settings')}>
            <User size={14} />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/app/settings')}>
            <Settings size={14} />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/login')} className="text-ember">
            <LogOut size={14} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
