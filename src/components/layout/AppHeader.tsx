import { useLocation, useNavigate } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  User,
  LogOut,
  Settings,
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
import { useSidebar } from './AppShell';

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
  const location = useLocation();
  const navigate = useNavigate();
  const pageLabel = PAGE_LABELS[location.pathname] ?? 'Minerva OS';

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
          <DropdownMenuItem onClick={() => navigate('/app/settings')}>
            <User size={14} />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/app/settings')}>
            <Settings size={14} />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/login')} className="text-ember">
            <LogOut size={14} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
