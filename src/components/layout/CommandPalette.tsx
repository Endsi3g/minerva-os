'use client';
import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, GitBranch, Users, FolderKanban, CheckSquare,
  ClipboardCheck, FileBox, Receipt, BarChart2, CalendarCheck,
  PackageCheck, WalletCards, Sparkles, Clock, Settings,
  Plus, UserPlus, DollarSign, BookOpen, FileSignature,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/lib/supabase';

interface CommandPaletteContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType>({
  open: false,
  setOpen: () => {},
});

export const useCommandPalette = () => useContext(CommandPaletteContext);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

const navItems = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Pipeline', href: '/app/pipeline', icon: GitBranch },
  { label: 'Clients', href: '/app/clients', icon: Users },
  { label: 'Projects', href: '/app/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/app/tasks', icon: CheckSquare },
  { label: 'Approvals', href: '/app/approvals', icon: ClipboardCheck },
  { label: 'Files', href: '/app/files', icon: FileBox },
  { label: 'Billing', href: '/app/billing', icon: Receipt },
  { label: 'Finance', href: '/app/finance', icon: WalletCards },
  { label: 'Reports', href: '/app/reports', icon: BarChart2 },
  { label: 'Call Preps', href: '/app/call-preps', icon: CalendarCheck },
  { label: 'Fulfillment', href: '/app/fulfillment', icon: PackageCheck },
  { label: 'Time Tracking', href: '/app/time-tracking', icon: Clock },
  { label: 'Service Catalog', href: '/app/services', icon: BookOpen },
  { label: 'Proposals', href: '/app/proposals', icon: FileSignature },
  { label: 'Agent Ops', href: '/app/agent-ops', icon: Sparkles },
  { label: 'Settings', href: '/app/settings', icon: Settings },
];

const quickActions = [
  { label: 'New Project', href: '/app/projects', icon: Plus, hint: 'Create a project' },
  { label: 'Add Client', href: '/app/clients', icon: UserPlus, hint: 'Add a client' },
  { label: 'Add Deal', href: '/app/pipeline', icon: GitBranch, hint: 'Add to pipeline' },
  { label: 'New Invoice', href: '/app/billing', icon: DollarSign, hint: 'Create invoice' },
];

function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (!workspaceId || searchQuery.trim().length < 2) {
      setClients([]);
      setProjects([]);
      return;
    }
    const q = searchQuery.trim();
    async function search() {
      const [{ data: cData }, { data: pData }] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('workspace_id', workspaceId)
          .or(`company.ilike.%${q}%,contact.ilike.%${q}%`),
        supabase
          .from('projects')
          .select('*')
          .eq('workspace_id', workspaceId)
          .or(`name.ilike.%${q}%,client_name.ilike.%${q}%`),
      ]);
      if (cData) setClients(cData.map(c => ({ ...c, _id: c.id })));
      if (pData) setProjects(pData.map(p => ({ ...p, _id: p.id, clientName: p.client_name })));
    }
    search();
  }, [searchQuery, workspaceId]);

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
    setSearchQuery('');
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} showCloseButton={false}>
      <CommandInput 
        placeholder="Search pages, actions..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          {quickActions.map(item => (
            <CommandItem
              key={item.href + item.label}
              onSelect={() => navigate(item.href)}
              className="gap-3"
            >
              <item.icon size={14} className="text-fog shrink-0" />
              <span>{item.label}</span>
              <span className="ml-auto text-[10px] text-fog">{item.hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        {searchQuery.trim().length >= 2 && (clients.length > 0 || projects.length > 0) && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Search results">
              {clients.map(client => (
                <CommandItem
                  key={`client-${client._id}`}
                  onSelect={() => navigate(`/app/clients/${client._id}`)}
                  className="gap-3"
                >
                  <Users size={14} className="text-fog shrink-0" />
                  <span>{client.company}</span>
                  <span className="ml-auto text-[10px] text-fog">Client · {client.contact}</span>
                </CommandItem>
              ))}
              {projects.map(project => (
                <CommandItem
                  key={`project-${project._id}`}
                  onSelect={() => navigate(`/app/projects/${project._id}`)}
                  className="gap-3"
                >
                  <FolderKanban size={14} className="text-fog shrink-0" />
                  <span>{project.name}</span>
                  <span className="ml-auto text-[10px] text-fog">Project · {project.clientName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Navigate">
          {navItems.map(item => (
            <CommandItem
              key={item.href}
              onSelect={() => navigate(item.href)}
              className="gap-3"
            >
              <item.icon size={14} className="text-fog shrink-0" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
