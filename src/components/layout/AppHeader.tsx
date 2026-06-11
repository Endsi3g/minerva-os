'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  MessageSquare,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/theme';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChat } from './AppShell';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { PresenceAvatars } from '../minerva/PresenceAvatars';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useCommandPalette } from './CommandPalette';
import { supabase } from '@/lib/supabase';

const PAGE_LABELS: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/growth': 'Growth',
  '/app/operations': 'Operations',
  '/app/client-space': 'Client Space',
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
  '/app/folders': 'Folders',
  '/app/sla-audit': 'SLA Risk Audit',
  '/app/contracts': 'Contracts',
  '/app/delivery/approvals': 'Approvals',
  '/app/intelligence': 'Intelligence',
  '/app/delivery': 'Delivery',
  '/app/finance-hub': 'Finance Hub',
};

function HeaderBreadcrumb({ pageLabel, pathname }: { pageLabel: string; pathname: string | null }) {
  const searchParams = useSearchParams();
  const folderId = searchParams?.get('id');

  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/app/dashboard">Minerva OS</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathname !== '/app/dashboard' && (
          <>
            <BreadcrumbSeparator />
            {pathname?.startsWith('/app/clients/') ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/app/clients">Clients</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Client Details</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : pathname === '/app/folders' && folderId ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/app/folders">Folders</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Folder Details</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </>
        )}
        {pathname === '/app/dashboard' && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppHeader() {
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
    let channel: any = null;

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

      // 3. Subscribe to realtime changes
      channel = supabase
        .channel(`realtime-notifications-${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`,
          },
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [
                { ...payload.new, _id: payload.new.id },
                ...prev,
              ]);
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? { ...payload.new, _id: payload.new.id } : n)
              );
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }
    loadNotifications();

    return () => {
      if (channel && typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel);
      }
    };
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
    <header className="h-14 flex items-center px-4 gap-3 bg-background border-b border-border shrink-0">
      {/* Breadcrumb */}
      <Suspense fallback={<span className="text-sm font-medium text-foreground">{pageLabel}</span>}>
        <HeaderBreadcrumb pageLabel={pageLabel} pathname={pathname} />
      </Suspense>
      <span className="text-sm font-medium text-foreground sm:hidden">{pageLabel}</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <Button
        variant="ghost"
        onClick={() => openPalette(true)}
        className="text-muted-foreground hover:text-foreground h-8 px-3 gap-2 text-xs hidden sm:flex items-center"
        aria-label="Search"
      >
        <Search size={14} />
        <span>Search</span>
        <kbd className="ml-1 text-[9px] bg-secondary px-1.5 py-0.5 rounded border border-border font-mono">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground sm:hidden" onClick={() => openPalette(true)} aria-label="Search">
        <Search size={16} />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleChat}
        className="text-muted-foreground hover:text-primary transition-colors"
        aria-label="AI Chat"
      >
        <MessageSquare size={16} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative" aria-label="Notifications">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] text-primary">{unreadCount} new</span>
            )}
          </div>
          <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-xs opacity-50">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n._id}
                  className={cn(
                    "p-3 border-b border-border last:border-0 hover:bg-secondary/60 transition-colors cursor-pointer",
                    !n.read && "bg-primary/5"
                  )}
                  onClick={() => handleMarkRead(n._id)}
                >
                  <p className="text-xs font-medium text-foreground">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1">
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
          <DropdownMenuItem onClick={() => router.push('/login')} className="text-destructive">
            <LogOut size={14} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
