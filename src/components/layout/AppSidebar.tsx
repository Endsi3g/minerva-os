'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Command,
  TrendingUp,
  Layers,
  BarChart2,
  Activity,
  Settings2,
  GitBranch,
  Users,
  FolderKanban,
  CheckSquare,
  ClipboardCheck,
  FileBox,
  Settings,
  LogOut,
  User,
  WalletCards,
  Sparkles,
  Clock,
  BookOpen,
  FileSignature,
  Headphones,
  CalendarRange,
  History,
  GitPullRequest,
  ShoppingBag,
  Award,
  ChevronDown,
  Lock,
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
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useTier } from '@/lib/hooks/useTier';
import type { FeatureKey } from '@/lib/types';
import { useSidebar } from './AppShell';
import { UpgradeModal, TIER_BADGE_COLORS } from '@/components/minerva/UpgradeModal';
import { FEATURE_MIN_TIER } from '@/lib/tier';

interface NavItem {
  href: string;
  icon: React.ElementType;
  labelKey: keyof ReturnType<typeof useLang>['t']['app']['sidebar'];
  featureKey?: FeatureKey;
}

interface Space {
  key: string;
  labelKey: keyof ReturnType<typeof useLang>['t']['app']['sidebar'];
  icon: React.ElementType;
  color: string;
  items: NavItem[];
}

const spaces: Space[] = [
  {
    key: 'home',
    labelKey: 'homeSpace',
    icon: Command,
    color: '#7FA38A',
    items: [
      { href: '/app/command',   icon: Command,   labelKey: 'command' },
      { href: '/app/dashboard', icon: BarChart2, labelKey: 'dashboard' },
    ],
  },
  {
    key: 'revenue',
    labelKey: 'revenueSpace',
    icon: TrendingUp,
    color: '#B89B6A',
    items: [
      { href: '/app/clients',   icon: Users,         labelKey: 'clients' },
      { href: '/app/pipeline',  icon: GitBranch,     labelKey: 'pipeline' },
      { href: '/app/proposals', icon: FileSignature, labelKey: 'proposals' },
    ],
  },
  {
    key: 'delivery',
    labelKey: 'deliverySpace',
    icon: Layers,
    color: '#B8BDC7',
    items: [
      { href: '/app/projects',      icon: FolderKanban,   labelKey: 'projects' },
      { href: '/app/tasks',         icon: CheckSquare,    labelKey: 'tasks' },
      { href: '/app/approvals',     icon: ClipboardCheck, labelKey: 'approvals' },
      { href: '/app/files',         icon: FileBox,        labelKey: 'files' },
      { href: '/app/workflows',     icon: GitPullRequest, labelKey: 'workflows',    featureKey: 'workflows' },
      { href: '/app/time-tracking', icon: Clock,          labelKey: 'timeTracking', featureKey: 'time_tracking' },
      { href: '/app/resources',     icon: CalendarRange,  labelKey: 'resources',    featureKey: 'resources' },
    ],
  },
  {
    key: 'finance',
    labelKey: 'financeSpace',
    icon: BarChart2,
    color: '#D8DDE6',
    items: [
      { href: '/app/finance-hub', icon: WalletCards, labelKey: 'financeHub', featureKey: 'finance_hub' },
    ],
  },
  {
    key: 'intelligence',
    labelKey: 'intelligenceSpace',
    icon: Activity,
    color: '#8A9099',
    items: [
      { href: '/app/intelligence', icon: Sparkles, labelKey: 'intelligenceHub', featureKey: 'intelligence' },
    ],
  },
  {
    key: 'admin',
    labelKey: 'adminSpace',
    icon: Settings2,
    color: '#8A9099',
    items: [
      { href: '/app/settings',    icon: Settings,   labelKey: 'settings' },
      { href: '/app/support-hub', icon: Headphones,  labelKey: 'supportHub',      featureKey: 'support_hub' },
      { href: '/app/services',    icon: BookOpen,    labelKey: 'serviceCatalog' },
      { href: '/app/marketplace', icon: ShoppingBag, labelKey: 'marketplace',     featureKey: 'marketplace' },
      { href: '/app/scorecards',  icon: Award,       labelKey: 'scorecards',      featureKey: 'scorecards' },
      { href: '/app/changelog',   icon: History,     labelKey: 'changelog' },
    ],
  },
];


function LockedNavItem({
  item,
  collapsed,
  onUpgradeClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onUpgradeClick: (key: FeatureKey) => void;
}) {
  const { t } = useLang();
  const sidebar = t.app.sidebar;
  const requiredTier = item.featureKey ? FEATURE_MIN_TIER[item.featureKey] : 'growth';
  const tierStyle = TIER_BADGE_COLORS[requiredTier];
  const hint = item.featureKey ? ((t.tier.hints as Record<string, string>)[item.featureKey] ?? '') : '';

  function handleClick() {
    if (item.featureKey) onUpgradeClick(item.featureKey);
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={hint}
        className="w-full flex items-center justify-center rounded-lg p-2 transition-colors min-h-[36px] opacity-35 hover:opacity-55 cursor-pointer"
      >
        <Lock size={13} className="shrink-0 text-fog" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={hint}
      className="w-full flex items-center gap-2.5 rounded-lg pl-5 pr-3 py-1.5 transition-colors min-h-[34px] opacity-40 hover:opacity-60 cursor-pointer"
    >
      <item.icon size={14} className="shrink-0 text-fog" />
      <span className="truncate text-[13px] text-fog flex-1 text-left">{sidebar[item.labelKey]}</span>
      <span
        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize shrink-0"
        style={tierStyle}
      >
        {requiredTier}
      </span>
    </button>
  );
}

function SpaceGroup({
  space,
  collapsed,
  sidebar,
}: {
  space: Space;
  collapsed: boolean;
  sidebar: ReturnType<typeof useLang>['t']['app']['sidebar'];
}) {
  const pathname = usePathname();
  const { isFeatureVisible } = useTier();
  const [upgradeKey, setUpgradeKey] = useState<FeatureKey | null>(null);

  const visibleItems = space.items.filter(
    item => !item.featureKey || isFeatureVisible(item.featureKey)
  );

  const lockedItems = space.items.filter(
    item => item.featureKey && !isFeatureVisible(item.featureKey)
  );

  const isSpaceActive = visibleItems.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  if (visibleItems.length === 0 && lockedItems.length === 0) return null;

  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return isSpaceActive;
    const saved = localStorage.getItem(`sidebar_space_${space.key}`);
    return saved !== null ? (JSON.parse(saved) as boolean) : isSpaceActive;
  });

  useEffect(() => {
    if (isSpaceActive) setOpen(true);
  }, [isSpaceActive]);

  function toggle() {
    setOpen(v => {
      const next = !v;
      localStorage.setItem(`sidebar_space_${space.key}`, JSON.stringify(next));
      return next;
    });
  }

  if (collapsed) {
    return (
      <>
        <div className="space-y-0.5">
          {visibleItems.map(item => (
            <NavLink
              key={item.href}
              href={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-center rounded-lg p-2 text-sm transition-colors min-h-[36px]',
                  isActive
                    ? 'bg-white/10 text-ivory'
                    : 'text-fog hover:bg-white/5 hover:text-silver'
                )
              }
            >
              <item.icon size={15} className="shrink-0" />
            </NavLink>
          ))}
          {lockedItems.map(item => (
            <LockedNavItem
              key={item.href}
              item={item}
              collapsed
              onUpgradeClick={setUpgradeKey}
            />
          ))}
        </div>
        <UpgradeModal featureKey={upgradeKey} open={upgradeKey !== null} onClose={() => setUpgradeKey(null)} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={toggle}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-colors hover:bg-white/5 cursor-pointer"
          style={{ color: isSpaceActive ? space.color : '#8A9099' }}
        >
          <space.icon size={10} className="shrink-0" />
          <span className="flex-1 text-left">{sidebar[space.labelKey]}</span>
          <ChevronDown
            size={9}
            className={cn('transition-transform duration-200', !open && '-rotate-90')}
          />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key={space.key}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              {visibleItems.map(item => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg pl-5 pr-3 py-1.5 text-sm transition-colors min-h-[34px]',
                      isActive
                        ? 'text-ivory bg-white/8'
                        : 'text-fog hover:text-silver hover:bg-white/5'
                    )
                  }
                >
                  <item.icon size={14} className="shrink-0" />
                  <span className="truncate text-[13px]">{sidebar[item.labelKey]}</span>
                </NavLink>
              ))}
              {lockedItems.map(item => (
                <LockedNavItem
                  key={item.href}
                  item={item}
                  collapsed={false}
                  onUpgradeClick={setUpgradeKey}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <UpgradeModal featureKey={upgradeKey} open={upgradeKey !== null} onClose={() => setUpgradeKey(null)} />
    </>
  );
}

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const { t } = useLang();
  const { user, logout } = useAuth();
  const { workspace } = useWorkspace();
  const { tier } = useTier();
  const router = useRouter();
  const sidebar = t.app.sidebar;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w: string) => w[0])
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
      <nav className="flex-1 overflow-y-auto px-2 space-y-3 py-2 min-h-0">
        {spaces.map(space => (
          <SpaceGroup
            key={space.key}
            space={space}
            collapsed={collapsed}
            sidebar={sidebar}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-2 pb-3 space-y-0.5 border-t border-sidebar-border pt-2">
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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-fog">
                      {user?.role ?? 'Admin'}
                    </span>
                    {workspace?.tier && (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
                        style={TIER_BADGE_COLORS[tier]}
                      >
                        {tier}
                      </span>
                    )}
                  </div>
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
