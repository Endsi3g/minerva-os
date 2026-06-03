'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  TrendingUp,
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
  Library,
  Headphones,
  Star,
  CalendarRange,
  ChevronDown,
  HelpCircle,
  History,
  GitPullRequest,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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

interface NavGroup {
  key: string;
  labelKey: keyof ReturnType<typeof useLang>['t']['app']['sidebar'];
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    key: 'crm',
    labelKey: 'crmGroup',
    icon: Users,
    items: [
      { href: '/app/dashboard',   icon: LayoutDashboard, labelKey: 'dashboard' },
      { href: '/app/pipeline',    icon: GitBranch,       labelKey: 'pipeline' },
      { href: '/app/clients',     icon: Users,           labelKey: 'clients' },
      { href: '/app/call-preps',  icon: CalendarCheck,   labelKey: 'callPreps' },
    ],
  },
  {
    key: 'delivery',
    labelKey: 'deliveryGroup',
    icon: FolderKanban,
    items: [
      { href: '/app/projects',    icon: FolderKanban,  labelKey: 'projects' },
      { href: '/app/tasks',       icon: CheckSquare,   labelKey: 'tasks' },
      { href: '/app/approvals',   icon: ClipboardCheck, labelKey: 'approvals' },
      { href: '/app/files',       icon: FileBox,        labelKey: 'files' },
      { href: '/app/fulfillment', icon: PackageCheck,   labelKey: 'fulfillment' },
      { href: '/app/resources',   icon: CalendarRange,  labelKey: 'resources' },
    ],
  },
  {
    key: 'finance',
    labelKey: 'financeGroup',
    icon: Receipt,
    items: [
      { href: '/app/billing',        icon: Receipt,       labelKey: 'billing' },
      { href: '/app/finance',        icon: WalletCards,   labelKey: 'finance' },
      { href: '/app/profitability',  icon: TrendingUp,    labelKey: 'profitability' },
      { href: '/app/expenses',       icon: CreditCard,    labelKey: 'expenses' },
      { href: '/app/proposals',      icon: FileSignature, labelKey: 'proposals' },
    ],
  },
  {
    key: 'intelligence',
    labelKey: 'intelligenceGroup',
    icon: BarChart2,
    items: [
      { href: '/app/reports',     icon: BarChart2, labelKey: 'reports' },
      { href: '/app/nps',         icon: Star,      labelKey: 'nps' },
      { href: '/app/knowledge',   icon: Library,   labelKey: 'knowledge' },
      { href: '/app/agent-ops',   icon: Sparkles,  labelKey: 'agentOps' },
      { href: '/app/changelog',   icon: History,   labelKey: 'changelog' },
    ],
  },
  {
    key: 'ops',
    labelKey: 'opsGroup',
    icon: Settings,
    items: [
      { href: '/app/workflows',      icon: GitPullRequest, labelKey: 'workflows' },
      { href: '/app/services',      icon: BookOpen,    labelKey: 'serviceCatalog' },
      { href: '/app/time-tracking', icon: Clock,       labelKey: 'timeTracking' },
      { href: '/app/tickets',       icon: Headphones,  labelKey: 'tickets' },
      { href: '/app/support',       icon: HelpCircle,  labelKey: 'support' },
    ],
  },
];

function SidebarNavItem({
  item,
  collapsed,
  sidebar,
}: {
  item: NavItem;
  collapsed: boolean;
  sidebar: ReturnType<typeof useLang>['t']['app']['sidebar'];
}) {
  return (
    <NavLink
      href={item.href}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors min-h-[44px]',
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

function SidebarGroup({
  group,
  collapsed,
  sidebar,
}: {
  group: NavGroup;
  collapsed: boolean;
  sidebar: ReturnType<typeof useLang>['t']['app']['sidebar'];
}) {
  const pathname = usePathname();
  const isGroupActive = group.items.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return isGroupActive;
    const saved = localStorage.getItem(`sidebar_group_${group.key}`);
    return saved !== null ? (JSON.parse(saved) as boolean) : isGroupActive;
  });

  useEffect(() => {
    if (isGroupActive) {
      setOpen(true);
    }
  }, [isGroupActive]);

  function toggle() {
    setOpen(v => {
      const next = !v;
      localStorage.setItem(`sidebar_group_${group.key}`, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <button
          type="button"
          onClick={toggle}
          className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-fog flex items-center justify-between w-full hover:text-silver transition-colors cursor-pointer rounded-md"
        >
          <span>{sidebar[group.labelKey]}</span>
          <ChevronDown
            size={10}
            className={cn('transition-transform duration-200', !open && '-rotate-90')}
          />
        </button>
      )}
      <AnimatePresence initial={false}>
        {(open || collapsed) && (
          <motion.div
            key={group.key}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            {group.items.map(item => (
              <SidebarNavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                sidebar={sidebar}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
    ? user.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
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
        {navGroups.map(group => (
          <SidebarGroup
            key={group.key}
            group={group}
            collapsed={collapsed}
            sidebar={sidebar}
          />
        ))}
      </nav>



      {/* Footer */}
      <div className="shrink-0 px-2 pb-3 space-y-0.5 border-t border-sidebar-border pt-2">
        <NavLink
          href="/app/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors min-h-[44px]',
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
                'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-ivory min-h-[44px]',
                collapsed && 'justify-center px-2'
              )}
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-xs font-medium text-ivory truncate w-full">
                    {user?.name ?? 'Uprising Studio'}
                  </span>
                  <span className="text-[10px] text-fog truncate w-full">
                    {user?.role ?? 'Admin'}
                  </span>
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
