'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';
import { PresenceAvatars } from '../minerva/PresenceAvatars';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useCommandPalette } from './CommandPalette';
import { supabase } from '@/lib/supabase';

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
  '/app/call-preps': 'Call Preps',
  '/app/fulfillment': 'Fulfillment',
  '/app/finance': 'Finance',
  '/app/time-tracking': 'Time Tracking',
  '/app/agent-ops': 'Agent Ops',
  '/app/services': 'Service Catalog',
  '/app/proposals': 'Proposals',
  '/app/expenses': 'Expenses',
  '/app/knowledge': 'Knowledge Base',
  '/app/tickets': 'Support Tickets',
  '/app/nps': 'NPS',
  '/app/resources': 'Resource Planning',
};

export function AppHeader() {
  const { collapsed, toggle } = useSidebar();
  const { toggleChat } = useChat();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { setOpen: openPalette } = useCommandPalette();
  const pathname = usePathname();
  const router = useRouter();
  const pageLabel = PAGE_LABELS[pathname ?? ''] ?? 'Minerva OS';

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const email = user?.email;
    if (!email) return;
    async function loadNotifications() {
      // 1. Get profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!profile) return;

      // 2. Get notifications
      const { data: list } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('timestamp', { ascending: false });

      if (list) {
        setNotifications(list.map(n => ({
          ...n,
          _id: n.id,
        })));
      }
    }
    loadNotifications();
  }, [user]);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  async function handleMarkRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    }
  }

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
      <Button
        variant="ghost"
        onClick={() => openPalette(true)}
        className="text-fog hover:text-ivory h-8 px-3 gap-2 text-xs hidden sm:flex items-center"
        aria-label="Search"
      >
        <Search size={14} />
        <span>Search</span>
        <kbd className="ml-1 text-[9px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 font-mono">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="text-fog hover:text-ivory sm:hidden" onClick={() => openPalette(true)} aria-label="Search">
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-fog hover:text-ivory relative" aria-label="Notifications">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-sage" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 bg-midnight border-white/5 p-0">
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-ivory">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] text-sage">{unreadCount} new</span>
            )}
          </div>
          <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-fog text-xs opacity-50">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n._id}
                  className={cn(
                    "p-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer",
                    !n.read && "bg-sage/5"
                  )}
                  onClick={() => handleMarkRead(n._id)}
                >
                  <p className="text-xs font-medium text-ivory">{n.title}</p>
                  <p className="text-[11px] text-fog mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[9px] text-fog/60 mt-1">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider delayDuration={0}>
        <PresenceAvatars />
      </TooltipProvider>

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
