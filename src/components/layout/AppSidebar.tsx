'use client';
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  TrendingUp,
  Users,
  FolderOpen,
  CheckSquare,
  Bot,
  Sparkles,
  BookOpen,
  CreditCard,
  FileText,
  BarChart2,
  Settings,
  Store,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { NewWorkspaceModal } from '@/components/minerva/NewWorkspaceModal';
import { useSidebar } from './AppShell';
import { useTier } from '@/lib/hooks/useTier';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/* ── Minerva logo SVG inline ─────────────────────────────────────────── */
function MinervaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-label="Minerva">
      <rect width="28" height="28" rx="8" fill="#4F46E5" />
      <path
        d="M6 20V8l8 8 8-8v12"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Nav section data ────────────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { href: '/app/dashboard',  labelKey: 'cockpit',    fallback: 'Dashboard',    icon: Home },
      { href: '/app/pipeline',   labelKey: 'pipeline',   fallback: 'Pipeline',     icon: TrendingUp },
      { href: '/app/clients',    labelKey: 'clients',    fallback: 'Clients',      icon: Users },
      { href: '/app/projects',   labelKey: 'projects',   fallback: 'Projects',     icon: FolderOpen },
      { href: '/app/tasks',      labelKey: 'tasks',      fallback: 'Tasks',        icon: CheckSquare },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/app/agents',    labelKey: 'agents',    fallback: 'Agents',    icon: Bot },
      { href: '/app/copilot',   labelKey: 'copilot',   fallback: 'Copilot',   icon: Sparkles },
      { href: '/app/knowledge', labelKey: 'knowledge', fallback: 'Knowledge', icon: BookOpen },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/app/billing',   labelKey: 'billing',   fallback: 'Billing',   icon: CreditCard },
      { href: '/app/proposals', labelKey: 'proposals', fallback: 'Proposals', icon: FileText },
      { href: '/app/reports',   labelKey: 'reports',   fallback: 'Reports',   icon: BarChart2 },
    ],
  },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const { t } = useLang();
  const { logout } = useAuth();
  const { workspace, workspaces, switchWorkspace } = useWorkspace();
  const { tier } = useTier();
  const sidebar = t.app.sidebar;

  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const isStarter = tier === 'starter';
  const isGrowth = tier === 'growth';
  const planName = isStarter ? 'FREE PLAN' : isGrowth ? 'GROWTH PLAN' : 'SCALE PLAN';
  const actionText = isStarter ? '169 remaining /200' : isGrowth ? '8,450 remaining /10K' : 'Unlimited Actions';
  const creditText = isStarter ? '681 remaining /1K' : isGrowth ? '42.5K remaining /50K' : 'Unlimited Credits';
  const actionPct = isStarter ? 84.5 : isGrowth ? 84.5 : 100;
  const creditPct = isStarter ? 68.1 : isGrowth ? 85 : 100;

  /* ── Nav item component ─────────────────────────────────────────────── */
  function NavItem({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
  }) {
    const isActive = pathname === href || pathname.startsWith(href + '/');

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              href={href}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg transition-colors mx-auto',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground'
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-sidebar-foreground hover:bg-accent/60 hover:text-accent-foreground'
        )}
      >
        <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'shrink-0 flex flex-col border-r transition-all duration-300 select-none h-screen',
          'bg-sidebar border-sidebar-border',
          collapsed ? 'w-14' : 'w-[240px]'
        )}
      >
        {/* ── Logo / Workspace header ─────────────────────────────────── */}
        <div className={cn(
          'shrink-0 flex items-center border-b border-sidebar-border h-16',
          collapsed ? 'justify-center px-2' : 'px-4 justify-between'
        )}>
          {collapsed ? (
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          ) : (
            <>
              {/* Logo + wordmark */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 hover:bg-accent/60 px-2 py-1.5 rounded-lg transition-colors cursor-pointer text-left group min-w-0 flex-1">
                    <MinervaLogo size={28} />
                    <div className="min-w-0 flex-1 leading-none">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {workspace?.name ?? 'Minerva'}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        Uprising Studio
                      </p>
                    </div>
                    <ChevronDown size={12} className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start" className="w-52 z-50">
                  <DropdownMenuLabel className="text-xs font-semibold px-2 py-1">Workspaces</DropdownMenuLabel>
                  {workspaces.map(w => (
                    <DropdownMenuItem
                      key={w.id}
                      onClick={() => switchWorkspace(w.id)}
                      className="flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <div
                        className="h-5 w-5 rounded flex items-center justify-center shrink-0 text-[9px] font-bold text-white"
                        ref={(node) => { if (node) node.style.backgroundColor = w.brandColor ?? '#4F46E5'; }}
                      >
                        {w.name.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">{w.name}</span>
                      {w.id === workspace?.id && <CheckCircle size={10} className="text-primary shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setNewWorkspaceOpen(true)} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Plus size={12} />
                    <span>New Workspace</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/app/profile')} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Settings size={12} />
                    <span>{sidebar.profile}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-xs text-destructive cursor-pointer">
                    <LogOut size={12} />
                    <span>{sidebar.signOut}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={toggle}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer shrink-0"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={14} />
              </button>
            </>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={section.label} className={cn('px-2', sIdx > 0 && 'pt-2')}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const label = (sidebar as Record<string, string>)[item.labelKey] ?? item.fallback;
                  return (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={label}
                      icon={item.icon}
                    />
                  );
                })}
              </div>
              {sIdx < NAV_SECTIONS.length - 1 && !collapsed && (
                <div className="mt-2 border-t border-sidebar-border" />
              )}
            </div>
          ))}

          {/* ── Footer links ─────────────────────────────────────────── */}
          <div className={cn('px-2 pt-2 border-t border-sidebar-border')}>
            {[
              { href: '/app/settings',    label: sidebar.settings,    icon: Settings },
              { href: '/app/marketplace', label: sidebar.marketplace ?? 'Marketplace', icon: Store },
              { href: '/app/support-hub', label: sidebar.help,        icon: HelpCircle },
            ].map(item => (
              <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>
        </nav>

        {/* ── Footer plan card ────────────────────────────────────────── */}
        {!collapsed && (
          <div className="shrink-0 p-3 border-t border-sidebar-border">
            <div className="border border-border rounded-xl p-3 space-y-2.5 bg-secondary/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-foreground tracking-wide uppercase">{planName}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Actions</span>
                  <span className="font-medium text-foreground">{actionText}</span>
                </div>
                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    ref={(node) => { if (node) node.style.width = `${actionPct}%`; }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Credits</span>
                  <span className="font-medium text-foreground">{creditText}</span>
                </div>
                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    ref={(node) => { if (node) node.style.width = `${creditPct}%`; }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border mt-1">
                <button
                  onClick={() => router.push('/app/billing')}
                  className="hover:text-primary font-semibold hover:underline transition-all cursor-pointer flex items-center gap-0.5"
                >
                  Manage plan <ChevronRight size={9} />
                </button>
                <span>Resets in 22 days</span>
              </div>
            </div>
          </div>
        )}

        <NewWorkspaceModal open={newWorkspaceOpen} onClose={() => setNewWorkspaceOpen(false)} />
      </aside>
    </TooltipProvider>
  );
}
