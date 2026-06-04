'use client';
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  ShoppingBag,
  Activity,
  MessageSquare,
  Bot,
  Wrench,
  Network,
  Database,
  MoreHorizontal,
  BarChart2,
  Key,
  Settings,
  Hammer,
  Users,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  CheckCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
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
  const [workforceOpen, setWorkforceOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(true);

  const workspaceInitials = workspace?.name
    ? workspace.name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AM';

  async function handleSignOut() {
    await logout();
    router.push('/login');
  }

  // Check if any link in "More" popover is active
  const isMoreActive = [
    '/app/proposals',
    '/app/billing',
    '/app/time-tracking',
    '/app/expenses',
    '/app/nps',
    '/app/changelog',
    '/app/services',
  ].some(href => pathname === href || pathname.startsWith(href + '/'));

  // Define sidebar menu items mapping Relevance AI sidebar
  const mainNavItems = [
    { href: '/app/dashboard', label: 'Home', icon: Home },
    { href: '/app/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { href: '/app/tasks', label: 'Tasks', icon: Activity },
    { href: '/app/copilot', label: 'Chat', icon: MessageSquare },
  ];

  const workforceItems = [
    { href: '/app/agents', label: 'Agents', icon: Bot, hasDropdown: true },
    { href: '/app/agent-ops', label: 'Tools', icon: Wrench },
    { href: '/app/resources', label: 'Workforce', icon: Network },
    { href: '/app/knowledge', label: 'Knowledge', icon: Database },
  ];

  const accountItems = [
    { href: '/app/finance-hub', label: 'Analytics', icon: BarChart2 },
    { href: '/app/settings', label: 'Integrations & API Keys', icon: Key },
  ];

  const bottomItems = [
    { href: '/app/settings', label: 'Settings', icon: Settings },
    { href: '/app/workflows', label: 'Relevance builders', icon: Hammer },
    { href: '/app/clients', label: 'Community', icon: Users },
    { href: '/app/support-hub', label: 'Ask for help', icon: HelpCircle },
  ];

  // Dynamic values for footer card
  const isStarter = tier === 'starter';
  const isGrowth = tier === 'growth';

  const planName = isStarter ? 'FREE PLAN' : isGrowth ? 'GROWTH PLAN' : 'SCALE PLAN';
  const actionText = isStarter
    ? '169 remaining /200'
    : isGrowth
    ? '8,450 remaining /10K'
    : 'Unlimited Actions';
  const creditText = isStarter
    ? '681 remaining /1K'
    : isGrowth
    ? '42.5K remaining /50K'
    : 'Unlimited Credits';
  const actionPct = isStarter ? 84.5 : isGrowth ? 84.5 : 100;
  const creditPct = isStarter ? 68.1 : isGrowth ? 85 : 100;

  return (
    <aside
      className={cn(
        'shrink-0 flex flex-col bg-[#0A0D14] border-r border-white/5 transition-all duration-300 select-none h-screen',
        collapsed ? 'w-14' : 'w-[230px]'
      )}
    >
      {/* Workspace Header */}
      <div className="shrink-0 p-3 flex items-center justify-between border-b border-white/5 h-[64px]">
        {collapsed ? (
          <button
            onClick={() => toggle()}
            className="p-1 hover:bg-white/5 rounded-md text-fog hover:text-silver transition-colors cursor-pointer mx-auto"
            title="Expand Sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-md transition-colors cursor-pointer text-left max-w-[150px] group">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white bg-blue-600 shadow-md group-hover:opacity-90"
                    style={{ backgroundColor: workspace?.brandColor ?? '#4F46E5' }}
                  >
                    {workspaceInitials}
                  </div>
                  <div className="min-w-0 flex-1 leading-none">
                    <p className="text-[12px] font-bold text-ivory truncate">{workspace?.name ?? 'AS Mobbin'}</p>
                    <p className="text-[9px] text-fog truncate mt-0.5">{workspace?.name ?? 'AS Mobbin'}</p>
                  </div>
                  <ChevronDown size={11} className="text-fog shrink-0 transition-transform group-hover:text-silver ml-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="w-52 bg-[#111522] border-white/5 text-silver z-50">
                <DropdownMenuLabel className="text-xs text-ivory font-semibold px-2 py-1">Workspaces</DropdownMenuLabel>
                {workspaces.map(w => (
                  <DropdownMenuItem
                    key={w.id}
                    onClick={() => switchWorkspace(w.id)}
                    className="flex items-center gap-2 hover:bg-white/5 focus:bg-white/5 text-xs text-silver hover:text-ivory cursor-pointer"
                  >
                    <div
                      className="h-5 w-5 rounded flex items-center justify-center shrink-0 text-[9px] font-bold text-obsidian"
                      style={{ backgroundColor: w.brandColor ?? '#F5F1E8' }}
                    >
                      {w.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 truncate">{w.name}</span>
                    {w.id === workspace?.id && <CheckCircle size={10} className="text-[#7FA38A] shrink-0" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => setNewWorkspaceOpen(true)} className="flex items-center gap-2 hover:bg-white/5 text-xs text-silver hover:text-ivory cursor-pointer">
                  <Plus size={12} />
                  <span>New Workspace</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => router.push('/app/profile')} className="flex items-center gap-2 hover:bg-white/5 text-xs text-silver hover:text-ivory cursor-pointer">
                  <Bot size={12} />
                  <span>{sidebar.profile}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 hover:bg-white/5 text-xs text-ember hover:text-ember cursor-pointer">
                  <LogOut size={12} />
                  <span>{sidebar.signOut}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sidebar toggle button */}
            <button
              onClick={() => toggle()}
              className="p-1 hover:bg-white/5 rounded-md text-fog hover:text-silver transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3.5 space-y-4 scrollbar-thin">
        
        {/* General Items */}
        <div className="space-y-0.5">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                  isActive
                    ? 'text-ivory bg-white/8 font-semibold'
                    : 'text-silver hover:text-ivory hover:bg-white/4'
                )}
              >
                <item.icon size={14} className={isActive ? 'text-[#7FA38A]' : 'text-fog'} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Workforce Section */}
        <div className="space-y-0.5">
          {!collapsed && (
            <button
              onClick={() => setWorkforceOpen(!workforceOpen)}
              className="w-full flex items-center justify-between px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-fog hover:text-silver cursor-pointer"
            >
              <span>Workforce</span>
              <ChevronDown
                size={10}
                className={cn('transition-transform duration-200', !workforceOpen && '-rotate-90')}
              />
            </button>
          )}

          {(workforceOpen || collapsed) && (
            <div className="space-y-0.5">
              {workforceItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                      isActive
                        ? 'text-ivory bg-white/8 font-semibold'
                        : 'text-silver hover:text-ivory hover:bg-white/4'
                    )}
                  >
                    <item.icon size={14} className={isActive ? 'text-[#7FA38A]' : 'text-fog'} />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && item.hasDropdown && (
                      <ChevronRight size={10} className="text-fog" />
                    )}
                  </Link>
                );
              })}

              {/* More Popover for remaining modules */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors text-silver hover:text-ivory hover:bg-white/4 cursor-pointer',
                      isMoreActive && 'text-ivory bg-white/8'
                    )}
                  >
                    <MoreHorizontal size={14} className={isMoreActive ? 'text-[#7FA38A]' : 'text-fog'} />
                    {!collapsed && <span className="flex-1 text-left">More</span>}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-48 bg-[#111522] border-white/5 text-silver z-50">
                  <DropdownMenuLabel className="text-[10px] text-fog font-bold uppercase tracking-wider px-2.5 py-1">More Modules</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={() => router.push('/app/proposals')} className="flex items-center gap-2 hover:bg-white/5 text-xs text-silver hover:text-ivory cursor-pointer">
                    <span>Proposals</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/app/time-tracking')} className="flex items-center gap-2 hover:bg-white/5 text-xs text-silver hover:text-ivory cursor-pointer">
                    <span>Time Tracking</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/app/expenses')} className="flex items-center gap-2 hover:bg-white/5 text-xs text-silver hover:text-ivory cursor-pointer">
                    <span>Expenses</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/app/nps')} className="flex items-center gap-2 hover:bg-white/5 text-xs text-silver hover:text-ivory cursor-pointer">
                    <span>NPS Responses</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/app/changelog')} className="flex items-center gap-2 hover:bg-white/5 text-xs text-silver hover:text-ivory cursor-pointer">
                    <span>Changelog</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/app/services')} className="flex items-center gap-2 hover:bg-white/5 text-xs text-silver hover:text-ivory cursor-pointer">
                    <span>Services</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/app/billing')} className="flex items-center gap-2 hover:bg-white/5 text-xs text-silver hover:text-ivory cursor-pointer">
                    <span>Billing / Subscriptions</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Account Section */}
        <div className="space-y-0.5">
          {!collapsed && (
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="w-full flex items-center justify-between px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-fog hover:text-silver cursor-pointer"
            >
              <span>Account</span>
              <ChevronDown
                size={10}
                className={cn('transition-transform duration-200', !accountOpen && '-rotate-90')}
              />
            </button>
          )}

          {(accountOpen || collapsed) && (
            <div className="space-y-0.5">
              {accountItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                      isActive
                        ? 'text-ivory bg-white/8 font-semibold'
                        : 'text-silver hover:text-ivory hover:bg-white/4'
                    )}
                  >
                    <item.icon size={14} className={isActive ? 'text-[#7FA38A]' : 'text-fog'} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom items */}
        <div className="pt-2 border-t border-white/5 space-y-0.5">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                  isActive
                    ? 'text-ivory bg-white/8 font-semibold'
                    : 'text-silver hover:text-ivory hover:bg-white/4'
                )}
              >
                <item.icon size={14} className={isActive ? 'text-[#7FA38A]' : 'text-fog'} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Plan Card */}
      {!collapsed && (
        <div className="shrink-0 p-3 border-t border-white/5 bg-white/[0.01]">
          <div className="border border-white/5 rounded-lg p-2.5 space-y-2 bg-[#111522]/50">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-ivory tracking-wide uppercase">{planName}</span>
            </div>

            {/* Actions Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[8px] text-fog">
                <span>Actions</span>
                <span className="font-semibold text-silver">{actionText}</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[#7FA38A] h-full rounded-full transition-all duration-300"
                  style={{ width: `${actionPct}%` }}
                />
              </div>
            </div>

            {/* Credits Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[8px] text-fog">
                <span>Credits</span>
                <span className="font-semibold text-silver">{creditText}</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[#7FA38A] h-full rounded-full transition-all duration-300"
                  style={{ width: `${creditPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[8px] text-fog border-t border-white/5 mt-1">
              <button
                onClick={() => router.push('/app/billing')}
                className="hover:text-ivory font-bold hover:underline transition-all cursor-pointer flex items-center gap-0.5"
              >
                Manage plan <ChevronRight size={8} />
              </button>
              <span>Resets in 22 days</span>
            </div>
          </div>
        </div>
      )}

      <NewWorkspaceModal open={newWorkspaceOpen} onClose={() => setNewWorkspaceOpen(false)} />
    </aside>
  );
}
