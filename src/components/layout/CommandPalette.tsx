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
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [kbArticles, setKbArticles] = useState<any[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (!workspaceId || debouncedQuery.trim().length < 2) {
      setClients([]);
      setProjects([]);
      setKbArticles([]);
      return;
    }
    const q = debouncedQuery.trim();

    async function fallbackProjectsSearch(queryStr: string) {
      const { data: pData } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .or(`name.ilike.%${queryStr}%,client_name.ilike.%${queryStr}%`);
      if (pData) {
        setProjects(pData.map((p: any) => ({ ...p, _id: p.id, clientName: p.client_name })));
      } else {
        setProjects([]);
      }
    }

    async function fallbackKbSearch(queryStr: string) {
      const { data: kbData } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('workspace_id', workspaceId)
        .or(`title.ilike.%${queryStr}%,content.ilike.%${queryStr}%`);
      if (kbData) {
        setKbArticles(kbData.map((a: any) => ({ ...a, _id: a.id })));
      } else {
        setKbArticles([]);
      }
    }

    async function runTextFallback(queryStr: string) {
      const [{ data: cData }, { data: pData }, { data: kbData }] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('workspace_id', workspaceId)
          .or(`company.ilike.%${queryStr}%,contact.ilike.%${queryStr}%`),
        supabase
          .from('projects')
          .select('*')
          .eq('workspace_id', workspaceId)
          .or(`name.ilike.%${queryStr}%,client_name.ilike.%${queryStr}%`),
        supabase
          .from('knowledge_base')
          .select('*')
          .eq('workspace_id', workspaceId)
          .or(`title.ilike.%${queryStr}%,content.ilike.%${queryStr}%`),
      ]);
      if (cData) setClients(cData.map(c => ({ ...c, _id: c.id })));
      else setClients([]);

      if (pData) setProjects(pData.map(p => ({ ...p, _id: p.id, clientName: p.client_name })));
      else setProjects([]);

      if (kbData) setKbArticles(kbData.map(a => ({ ...a, _id: a.id })));
      else setKbArticles([]);
    }

    async function search() {
      let embedData: any = null;
      try {
        const embedRes = await fetch('/api/ai/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: q }),
        });
        if (embedRes.ok) {
          embedData = await embedRes.json();
        }
      } catch (e) {
        console.error('Failed to fetch embedding', e);
      }

      if (embedData?.embedding) {
        try {
          const [
            { data: pData, error: pErr },
            { data: kbData, error: kbErr },
            { data: cData, error: cErr }
          ] = await Promise.all([
            supabase.rpc('match_projects', {
              query_embedding: embedData.embedding,
              match_threshold: 0.1,
              match_count: 5,
              filter_workspace_id: workspaceId,
            }),
            supabase.rpc('match_knowledge_base', {
              query_embedding: embedData.embedding,
              match_threshold: 0.1,
              match_count: 5,
              filter_workspace_id: workspaceId,
            }),
            supabase
              .from('clients')
              .select('*')
              .eq('workspace_id', workspaceId)
              .or(`company.ilike.%${q}%,contact.ilike.%${q}%`)
          ]);

          if (!pErr && pData) {
            setProjects(pData.map((p: any) => ({ ...p, _id: p.id, clientName: p.client_name || 'Client' })));
          } else {
            await fallbackProjectsSearch(q);
          }

          if (!kbErr && kbData) {
            setKbArticles(kbData.map((a: any) => ({ ...a, _id: a.id })));
          } else {
            await fallbackKbSearch(q);
          }

          if (!cErr && cData) {
            setClients(cData.map((c: any) => ({ ...c, _id: c.id })));
          } else {
            setClients([]);
          }
        } catch (err) {
          console.error('Vector search failed, falling back to text search', err);
          await runTextFallback(q);
        }
      } else {
        await runTextFallback(q);
      }
    }
    search();
  }, [debouncedQuery, workspaceId]);

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
                  onSelect={() => navigate(`/app/clients`)}
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
                  onSelect={() => navigate(`/app/projects`)}
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

        {searchQuery.trim().length >= 2 && kbArticles.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Knowledge Base">
              {kbArticles.map(article => (
                <CommandItem
                  key={`kb-${article._id}`}
                  onSelect={() => navigate(`/app/knowledge`)}
                  className="gap-3"
                >
                  <BookOpen size={14} className="text-fog shrink-0" />
                  <span>{article.title}</span>
                  <span className="ml-auto text-[10px] text-fog">Article · {article.category}</span>
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
