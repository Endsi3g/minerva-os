'use client';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  Users,
  FolderKanban,
  CheckSquare,
  ClipboardCheck,
  FileBox,
  Receipt,
  BarChart2,
  Settings,
  LogOut,
  User,
  CalendarCheck,
  PackageCheck,
  WalletCards,
  Sparkles,
  Clock,
  BookOpen,
  FileSignature,
  CreditCard,
} from 'lucide-react';
import { TimerWidget } from './TimerWidget';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NavLink } from '@/components/ui/nav-link';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from './AppShell';

interface NavItem {
  href: string;
  icon: React.ElementType;
  labelKey: keyof ReturnType<typeof useLang>['t']['app']['sidebar'];
}

const workspaceNavItems: NavItem[] = [
  { href: '/app/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { href: '/app/pipeline',  icon: GitBranch,       labelKey: 'pipeline' },
  { href: '/app/clients',   icon: Users,           labelKey: 'clients' },
  { href: '/app/projects',  icon: FolderKanban,    labelKey: 'projects' },
  { href: '/app/tasks',     icon: CheckSquare,     labelKey: 'tasks' },
  { href: '/app/call-preps', icon: CalendarCheck,  labelKey: 'callPreps' },
  { href: '/app/time-tracking', icon: Clock,       labelKey: 'timeTracking' },
];

const studioNavItems: NavItem[] = [
  { href: '/app/approvals',  icon: ClipboardCheck, labelKey: 'approvals' },
  { href: '/app/files',      icon: FileBox,         labelKey: 'files' },
  { href: '/app/billing',    icon: Receipt,         labelKey: 'billing' },
  { href: '/app/finance',    icon: WalletCards,     labelKey: 'finance' },
  { href: '/app/reports',    icon: BarChart2,       labelKey: 'reports' },
  { href: '/app/fulfillment', icon: PackageCheck,   labelKey: 'fulfillment' },
  { href: '/app/services',   icon: BookOpen,        labelKey: 'serviceCatalog' },
  { href: '/app/proposals',  icon: FileSignature,   labelKey: 'proposals' },
  { href: '/app/expenses',   icon: CreditCard,      labelKey: 'expenses' },
  { href: '/app/agent-ops',  icon: Sparkles,        labelKey: 'agentOps' },
];

function SidebarNavItem({ item, collapsed, sidebar }: { item: NavItem; collapsed: boolean; sidebar: ReturnType<typeof useLang>['t']['app']['sidebar'] }) {
  return (
    <NavLink
      href={item.href}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-sidebar-accent text-ivory'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-ivory'
        )
      }
    >
      <item.icon size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{sidebar[item.labelKey]}</span>}
    </NavLink>
  );
}

function SidebarSection({
  label,
  items,
  collapsed,
  sidebar,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  sidebar: ReturnType<typeof useLang>['t']['app']['sidebar'];
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-fog">
          {label}
        </p>
      )}
      {items.map(item => (
        <SidebarNavItem key={item.href} item={item} collapsed={collapsed} sidebar={sidebar} />
      ))}
    </div>
  );
}

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const { t } = useLang();
  const { user, logout } = useAuth();
  const router = useRouter();
  const sidebar = t.app.sidebar;

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'US';

  async function handleSignOut() {
    await logout();
    router.push('/login');
  }

  return (
    <aside
      className={cn(
        'shrink-0 flex flex-col bg-void rounded-2xl overflow-hidden transition-all duration-300',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center pt-5 pb-4 px-4 shrink-0',
          collapsed ? 'justify-center px-2' : 'gap-2.5'
        )}
      >
        <div className="h-6 w-6 rounded-md bg-ivory flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-obsidian">M</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-ivory tracking-wide">Minerva</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-4 py-2 min-h-0">
        <SidebarSection label={sidebar.workspace} items={workspaceNavItems} collapsed={collapsed} sidebar={sidebar} />
        <SidebarSection label={sidebar.studio} items={studioNavItems} collapsed={collapsed} sidebar={sidebar} />
      </nav>

      {/* Timer Widget */}
      <div className="shrink-0 border-t border-sidebar-border pt-2 pb-1">
        <TimerWidget collapsed={collapsed} />
      </div>

      {/* Footer */}
      <div className="shrink-0 px-2 pb-3 space-y-0.5 border-t border-sidebar-border pt-2">
        <NavLink
          href="/app/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              collapsed && 'justify-center px-2',
              isActive
                ? 'bg-sidebar-accent text-ivory'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-ivory'
            )
          }
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span>{sidebar.settings}</span>}
        </NavLink>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-ivory',
                collapsed && 'justify-center px-2'
              )}
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-xs font-medium text-ivory truncate w-full">{user?.name ?? 'Uprising Studio'}</span>
                  <span className="text-[10px] text-fog truncate w-full">{user?.role ?? 'Admin'}</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push('/app/settings')}>
              <User size={14} />
              {sidebar.profile}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-ember">
              <LogOut size={14} />
              {sidebar.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
