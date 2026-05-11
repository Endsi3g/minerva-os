import { NavLink, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from './AppShell';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const workspaceNav: NavItem[] = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/pipeline',  icon: GitBranch,       label: 'Pipeline' },
  { to: '/app/clients',   icon: Users,            label: 'Clients' },
  { to: '/app/projects',  icon: FolderKanban,     label: 'Projects' },
  { to: '/app/tasks',     icon: CheckSquare,      label: 'Tasks' },
];

const studioNav: NavItem[] = [
  { to: '/app/approvals', icon: ClipboardCheck, label: 'Approvals' },
  { to: '/app/files',     icon: FileBox,        label: 'Files' },
  { to: '/app/billing',   icon: Receipt,        label: 'Billing' },
  { to: '/app/reports',   icon: BarChart2,      label: 'Reports' },
];

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
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
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function SidebarSection({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-fog">
          {label}
        </p>
      )}
      {items.map(item => (
        <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
      ))}
    </div>
  );
}

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const navigate = useNavigate();

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
      <nav className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
        <SidebarSection label="Workspace" items={workspaceNav} collapsed={collapsed} />
        <SidebarSection label="Studio" items={studioNav} collapsed={collapsed} />
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-2 pb-3 space-y-0.5 border-t border-sidebar-border pt-2">
        <NavLink
          to="/app/settings"
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
          {!collapsed && <span>Settings</span>}
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
                <AvatarFallback className="text-[10px]">US</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-xs font-medium text-ivory truncate w-full">Uprising Studio</span>
                  <span className="text-[10px] text-fog truncate w-full">Admin</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              <User size={14} />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/login')} className="text-ember">
              <LogOut size={14} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
