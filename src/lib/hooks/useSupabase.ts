import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MOCK_LEADS, MOCK_CLIENTS, MOCK_PROJECTS, MOCK_TASKS,
  MOCK_INVOICES, MOCK_APPROVALS,
} from '@/lib/mock-data';

const MOCK_WS_ID = 'mock-ws';
const IS_TEST = process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === '1';

// ── Mappings (snake_case -> camelCase & id -> _id compatibility) ─────────────

export function mapClient(db: any) {
  if (!db) return null;
  return {
    _id: db.id,
    id: db.id,
    workspaceId: db.workspace_id,
    company: db.company,
    contact: db.contact,
    email: db.email,
    monthlyValue: Number(db.monthly_value || 0),
    status: db.status,
    createdAt: db.created_at,
  };
}

export function mapProject(db: any) {
  if (!db) return null;
  return {
    _id: db.id,
    id: db.id,
    workspaceId: db.workspace_id,
    clientId: db.client_id,
    clientName: db.client_name,
    name: db.name,
    status: db.status,
    dueDate: db.due_date,
    budget: Number(db.budget || 0),
    healthScore: db.health_score || 100,
    activeRiskFlags: db.active_risk_flags || [],
    createdAt: db.created_at,
  };
}

export function mapTask(db: any) {
  if (!db) return null;
  return {
    _id: db.id,
    id: db.id,
    workspaceId: db.workspace_id,
    projectId: db.project_id,
    title: db.title,
    description: db.description,
    status: db.status,
    priority: db.priority,
    assignee: db.assignee,
    dueDate: db.due_date,
    estimatedHours: db.estimated_hours,
    createdAt: db.created_at,
  };
}

export function mapDeal(db: any) {
  if (!db) return null;
  return {
    _id: db.id,
    id: db.id,
    workspaceId: db.workspace_id,
    company: db.company,
    contact: db.contact,
    email: db.email,
    value: Number(db.value || 0),
    stage: db.stage,
    notes: db.notes,
    lastContact: db.last_contact,
    createdAt: db.created_at,
  };
}

export function mapInvoice(db: any) {
  if (!db) return null;
  return {
    _id: db.id,
    id: db.id,
    workspaceId: db.workspace_id,
    clientId: db.client_id,
    invoiceNumber: db.invoice_number,
    amount: Number(db.amount || 0),
    status: db.status,
    date: db.date,
    dueDate: db.due_date,
    items: db.items || [],
    paidDate: db.paid_date,
    tps: Number(db.tps || 0),
    tvq: Number(db.tvq || 0),
    createdAt: db.created_at,
  };
}

export function mapRetainer(db: any) {
  if (!db) return null;
  return {
    _id: db.id,
    id: db.id,
    workspaceId: db.workspace_id,
    clientId: db.client_id,
    amount: Number(db.amount || 0),
    cycle: db.cycle,
    status: db.status,
    startDate: db.start_date,
    renewalDate: db.renewal_date,
    hoursIncluded: Number(db.hours_included || 0),
    hoursUsed: Number(db.hours_used || 0),
    notes: db.notes,
    createdAt: db.created_at,
  };
}

export function mapFinance(db: any) {
  if (!db) return null;
  return {
    _id: db.id,
    id: db.id,
    workspaceId: db.workspace_id,
    type: db.type,
    amount: Number(db.amount || 0),
    category: db.category,
    date: db.date,
    description: db.description,
    tps: Number(db.tps || 0),
    tvq: Number(db.tvq || 0),
    status: db.status,
    createdAt: db.created_at,
  };
}

export function mapApproval(db: any) {
  if (!db) return null;
  return {
    _id: db.id,
    id: db.id,
    workspaceId: db.workspace_id,
    projectId: db.project_id,
    name: db.name,
    type: db.type,
    status: db.status,
    submittedDate: db.submitted_date,
    fileUrl: db.file_url,
    createdAt: db.created_at,
  };
}

export function mapActivity(db: any) {
  if (!db) return null;
  return {
    _id: db.id,
    id: db.id,
    workspaceId: db.workspace_id,
    user: db.username,
    action: db.action_name,
    targetName: db.target_name,
    timestamp: db.created_at,
  };
}


// ── Queries ──────────────────────────────────────────────────────────────────

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<any[] | null>(null);

  useEffect(() => {
    if (IS_TEST) {
      setWorkspaces([{ _id: MOCK_WS_ID, id: MOCK_WS_ID, name: 'Uprising Studio', slug: 'uprising' }]);
      return;
    }
    async function fetchWorkspaces() {
      try {
        const { data, error } = await supabase.from('workspaces').select('*');
        if (!error && data) {
          setWorkspaces(data.map(w => ({ _id: w.id, id: w.id, name: w.name, slug: w.slug })));
        } else {
          setWorkspaces([]);
        }
      } catch (err) {
        console.error('fetchWorkspaces failed:', err);
        setWorkspaces([]);
      }
    }
    fetchWorkspaces();
  }, []);

  return workspaces;
}

export function useClients(workspaceId: string | undefined | null) {
  const [clients, setClients] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setClients([]);
      return;
    }
    if (workspaceId === MOCK_WS_ID) {
      setClients(MOCK_CLIENTS.map(c => ({
        _id: c.id, id: c.id, workspaceId,
        company: c.company, contact: c.contact, email: c.email,
        monthlyValue: c.monthlyValue, status: c.status,
        industry: (c as any).industry ?? '',
        activeProjects: c.activeProjects ?? 0,
        createdAt: '2026-01-01',
      })));
      return;
    }

    let active = true;

    async function fetchClients() {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('workspace_id', workspaceId);

        if (active) {
          if (!error && data) {
            setClients(data.map(mapClient));
          } else {
            setClients([]);
          }
        }
      } catch (err) {
        console.error('fetchClients failed:', err);
        if (active) setClients([]);
      }
    }

    fetchClients();

    const channel = supabase
      .channel(`clients-realtime-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `workspace_id=eq.${workspaceId}` }, () => {
        fetchClients();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return clients;
}

export function useProjects(workspaceId: string | undefined | null) {
  const [projects, setProjects] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setProjects([]);
      return;
    }
    if (workspaceId === MOCK_WS_ID) {
      setProjects(MOCK_PROJECTS.map(p => ({
        _id: p.id, id: p.id, workspaceId,
        clientId: p.clientId, clientName: p.client,
        name: p.name, status: p.status, dueDate: p.dueDate,
        budget: p.budget, spent: p.spent,
        totalTasks: p.totalTasks, doneTasks: p.doneTasks,
        healthScore: p.spent / p.budget > 0.9 ? 62 : 90,
        activeRiskFlags: p.spent / p.budget > 0.9 ? ['Over budget threshold'] : [],
        createdAt: '2026-01-01',
      })));
      return;
    }

    let active = true;

    async function fetchProjects() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('due_date', { ascending: false });

        if (active) {
          if (!error && data) {
            setProjects(data.map(mapProject));
          } else {
            setProjects([]);
          }
        }
      } catch (err) {
        console.error('fetchProjects failed:', err);
        if (active) setProjects([]);
      }
    }

    fetchProjects();

    const channel = supabase
      .channel(`projects-realtime-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `workspace_id=eq.${workspaceId}` }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return projects;
}

export function useTasks(
  workspaceId: string | undefined | null,
  projectId?: string | null,
  page?: number,
  pageSize: number = 50
): any {
  const [tasks, setTasks] = useState<any[] | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    if (!workspaceId) {
      setTasks([]);
      return;
    }
    if (workspaceId === MOCK_WS_ID) {
      const filtered = projectId
        ? MOCK_TASKS.filter(t => t.projectId === projectId)
        : MOCK_TASKS;
      let mapped = filtered.map(t => ({
        _id: t.id, id: t.id, workspaceId,
        projectId: t.projectId, title: t.title, description: '',
        status: t.status, priority: t.priority,
        assignee: t.assignee, dueDate: t.dueDate,
        estimatedHours: 0, createdAt: '2026-01-01',
      }));
      setTotalCount(mapped.length);
      if (page !== undefined) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        mapped = mapped.slice(from, to);
      }
      setTasks(mapped);
      return;
    }

    let active = true;

    async function fetchTasks() {
      try {
        let query = supabase.from('tasks').select('*', { count: 'exact' }).eq('workspace_id', workspaceId);
        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        if (page !== undefined) {
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (active) {
          if (!error && data) {
            setTasks(data.map(mapTask));
            if (count !== null) {
              setTotalCount(count);
            }
          } else {
            setTasks([]);
          }
        }
      } catch (err) {
        console.error('fetchTasks failed:', err);
        if (active) setTasks([]);
      }
    }

    fetchTasks();

    const channel = supabase
      .channel(`tasks-realtime-${workspaceId}-${projectId || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${workspaceId}` }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [workspaceId, projectId, page, pageSize]);

  if (page !== undefined) {
    return { data: tasks, count: totalCount };
  }
  return tasks;
}

export function useDeals(workspaceId: string | undefined | null) {
  const [deals, setDeals] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setDeals([]);
      return;
    }
    if (workspaceId === MOCK_WS_ID) {
      setDeals(MOCK_LEADS.map(l => ({
        _id: l.id, id: l.id, workspaceId,
        company: l.company, contact: l.contact, email: l.email,
        value: l.value, stage: l.stage, notes: '',
        lastContact: new Date(Date.now() - l.daysInStage * 86_400_000).toISOString(),
        createdAt: '2026-01-01',
      })));
      return;
    }

    let active = true;

    async function fetchDeals() {
      try {
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (active) {
          if (!error && data) {
            setDeals(data.map(mapDeal));
          } else {
            setDeals([]);
          }
        }
      } catch (err) {
        console.error('fetchDeals failed:', err);
        if (active) setDeals([]);
      }
    }

    fetchDeals();

    const channel = supabase
      .channel(`deals-realtime-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals', filter: `workspace_id=eq.${workspaceId}` }, () => {
        fetchDeals();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return deals;
}

export function useInvoices(
  workspaceId: string | undefined | null,
  page?: number,
  pageSize: number = 50
): any {
  const [invoices, setInvoices] = useState<any[] | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    if (!workspaceId) {
      setInvoices([]);
      return;
    }
    if (workspaceId === MOCK_WS_ID) {
      let mapped = MOCK_INVOICES.map(i => ({
        _id: i.id, id: i.id, workspaceId,
        clientId: i.clientId, invoiceNumber: (i as any).number ?? i.id,
        amount: i.amount, status: i.status,
        date: (i as any).issuedDate ?? i.id, dueDate: i.dueDate,
        items: (i as any).lineItems ?? [],
        paidDate: (i as any).paidDate ?? null,
        tps: 0, tvq: 0, createdAt: '2026-01-01',
      }));
      setTotalCount(mapped.length);
      if (page !== undefined) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        mapped = mapped.slice(from, to);
      }
      setInvoices(mapped);
      return;
    }

    let active = true;

    async function fetchInvoices() {
      try {
        let query = supabase
          .from('invoices')
          .select('*', { count: 'exact' })
          .eq('workspace_id', workspaceId)
          .order('date', { ascending: false });

        if (page !== undefined) {
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (active) {
          if (!error && data) {
            setInvoices(data.map(mapInvoice));
            if (count !== null) {
              setTotalCount(count);
            }
          } else {
            setInvoices([]);
          }
        }
      } catch (err) {
        console.error('fetchInvoices failed:', err);
        if (active) setInvoices([]);
      }
    }

    fetchInvoices();

    const channel = supabase
      .channel(`invoices-realtime-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `workspace_id=eq.${workspaceId}` }, () => {
        fetchInvoices();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [workspaceId, page, pageSize]);

  if (page !== undefined) {
    return { data: invoices, count: totalCount };
  }
  return invoices;
}

export function useRetainers(workspaceId: string | undefined | null) {
  const [retainers, setRetainers] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setRetainers([]);
      return;
    }

    let active = true;

    async function fetchRetainers() {
      try {
        const { data, error } = await supabase
          .from('retainers')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (active) {
          if (!error && data) {
            setRetainers(data.map(mapRetainer));
          } else {
            setRetainers([]);
          }
        }
      } catch (err) {
        console.error('fetchRetainers failed:', err);
        if (active) setRetainers([]);
      }
    }

    fetchRetainers();

    const channel = supabase
      .channel(`retainers-realtime-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retainers', filter: `workspace_id=eq.${workspaceId}` }, () => {
        fetchRetainers();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return retainers;
}

export function useFinances(workspaceId: string | undefined | null) {
  const [finances, setFinances] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setFinances([]);
      return;
    }

    let active = true;

    async function fetchFinances() {
      try {
        const { data, error } = await supabase
          .from('finances')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('date', { ascending: false });

        if (active) {
          if (!error && data) {
            setFinances(data.map(mapFinance));
          } else {
            setFinances([]);
          }
        }
      } catch (err) {
        console.error('fetchFinances failed:', err);
        if (active) setFinances([]);
      }
    }

    fetchFinances();

    const channel = supabase
      .channel(`finances-realtime-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finances', filter: `workspace_id=eq.${workspaceId}` }, () => {
        fetchFinances();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return finances;
}

export function useApprovals(workspaceId?: string | undefined | null) {
  const [approvals, setApprovals] = useState<any[] | null>(null);

  useEffect(() => {
    if (workspaceId === MOCK_WS_ID || (IS_TEST && !workspaceId)) {
      setApprovals(MOCK_APPROVALS.map(a => ({
        _id: a.id, id: a.id, workspaceId: workspaceId ?? MOCK_WS_ID,
        projectId: (a as any).projectId ?? null,
        name: a.name, type: a.type, status: a.status,
        submittedDate: a.submittedDate, fileUrl: null, createdAt: '2026-01-01',
      })));
      return;
    }

    if (!workspaceId) {
      setApprovals([]);
      return;
    }

    let active = true;

    async function fetchApprovals() {
      try {
        let query = supabase.from('approvals').select('*');
        if (workspaceId) {
          query = query.eq('workspace_id', workspaceId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (active) {
          if (!error && data) {
            setApprovals(data.map(mapApproval));
          } else {
            setApprovals([]);
          }
        }
      } catch (err) {
        console.error('fetchApprovals failed:', err);
        if (active) setApprovals([]);
      }
    }

    fetchApprovals();

    const channel = supabase
      .channel(`approvals-realtime-${workspaceId || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => {
        fetchApprovals();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return approvals;
}

export function useActivity(workspaceId: string | undefined | null) {
  const [activity, setActivity] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setActivity([]);
      return;
    }

    let active = true;

    async function fetchActivity() {
      try {
        const { data, error } = await supabase
          .from('activity')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (active) {
          if (!error && data) {
            setActivity(data.map(mapActivity));
          } else {
            setActivity([]);
          }
        }
      } catch (err) {
        console.error('fetchActivity failed:', err);
        if (active) setActivity([]);
      }
    }

    fetchActivity();

    const channel = supabase
      .channel(`activity-realtime-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity', filter: `workspace_id=eq.${workspaceId}` }, () => {
        fetchActivity();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return activity;
}


export function useUserProfileByEmail(email: string | undefined | null) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!email) {
      setProfile(null);
      return;
    }

    let active = true;

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (active && !error && data) {
          setProfile({
            _id: data.id,
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            avatar: data.avatar_url,
            onboardingCompleted: data.onboarding_completed,
          });
        }
      } catch (err) {
        console.error('fetchProfile failed:', err);
      }
    }

    fetchProfile();

    const channel = supabase
      .channel(`user-profile-${email}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles', filter: `email=eq.${email}` }, () => {
        fetchProfile();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [email]);

  return profile;
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useAddClient() {
  return async (args: { workspaceId: string; company: string; contact: string; email: string; status: string; monthlyValue?: number }) => {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        workspace_id: args.workspaceId,
        company: args.company,
        contact: args.contact,
        email: args.email,
        status: args.status,
        monthly_value: args.monthlyValue || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return mapClient(data);
  };
}

export function useAddProject() {
  return async (args: { workspaceId: string; clientName: string; name: string; status: string; dueDate: string; budget: number; description?: string }) => {
    let embedding: number[] | null = null;
    try {
      const textToEmbed = `${args.name} ${args.description || ''}`.trim();
      const embedRes = await fetch('/api/ai/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToEmbed }),
      });
      const embedData = await embedRes.json();
      if (embedData.embedding) {
        embedding = embedData.embedding;
      }
    } catch (err) {
      console.error('Failed to generate project embedding:', err);
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        workspace_id: args.workspaceId,
        client_name: args.clientName,
        name: args.name,
        status: args.status,
        due_date: args.dueDate,
        budget: args.budget,
        description: args.description || '',
        ...(embedding ? { embedding } : {}),
      })
      .select()
      .single();

    if (error) throw error;
    return mapProject(data);
  };
}

export function useUpdateProject() {
  return async (args: { id: string; name?: string; status?: string; dueDate?: string; budget?: number; description?: string }) => {
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.status !== undefined) updates.status = args.status;
    if (args.dueDate !== undefined) updates.due_date = args.dueDate;
    if (args.budget !== undefined) updates.budget = args.budget;
    if (args.description !== undefined) updates.description = args.description;

    if (args.name !== undefined || args.description !== undefined) {
      try {
        const textToEmbed = `${args.name || ''} ${args.description || ''}`.trim();
        if (textToEmbed) {
          const embedRes = await fetch('/api/ai/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToEmbed }),
          });
          const embedData = await embedRes.json();
          if (embedData.embedding) {
            updates.embedding = embedData.embedding;
          }
        }
      } catch (err) {
        console.error('Failed to generate project embedding:', err);
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', args.id)
      .select()
      .single();

    if (error) throw error;
    return mapProject(data);
  };
}

export function useAddTask() {
  return async (args: { workspaceId: string; title: string; projectId: string; status: string; priority: string; assignee: string; dueDate: string }) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        workspace_id: args.workspaceId,
        title: args.title,
        project_id: args.projectId,
        status: args.status,
        priority: args.priority,
        assignee: args.assignee,
        due_date: args.dueDate,
      })
      .select()
      .single();

    if (error) throw error;

    // Log Activity
    await supabase.from('activity').insert({
      workspace_id: args.workspaceId,
      username: args.assignee,
      action_name: 'created task',
      target_name: args.title,
      entity_type: 'task',
    });

    return mapTask(data);
  };
}

export function useUpdateTask() {
  return async (args: { id: string; status?: string; priority?: string; assignee?: string; dueDate?: string; title?: string }) => {
    const updates: any = {};
    if (args.status !== undefined) updates.status = args.status;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.assignee !== undefined) updates.assignee = args.assignee;
    if (args.dueDate !== undefined) updates.due_date = args.dueDate;
    if (args.title !== undefined) updates.title = args.title;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', args.id)
      .select()
      .single();

    if (error) throw error;
    return mapTask(data);
  };
}

export function useDeleteTask() {
  return async (args: { id: string }) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', args.id);

    if (error) throw error;
  };
}

export function useAddDeal() {
  return async (args: { workspaceId: string; company: string; contact: string; email: string; value: number; stage: string; notes?: string; lastContact: string }) => {
    const { data, error } = await supabase
      .from('deals')
      .insert({
        workspace_id: args.workspaceId,
        company: args.company,
        contact: args.contact,
        email: args.email,
        value: args.value,
        stage: args.stage,
        notes: args.notes || '',
        last_contact: args.lastContact,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDeal(data);
  };
}

export function useUpdateDeal() {
  return async (args: { id: string; company: string; contact: string; email: string; value: number; stage: string; notes?: string; lastContact: string }) => {
    const { data, error } = await supabase
      .from('deals')
      .update({
        company: args.company,
        contact: args.contact,
        email: args.email,
        value: args.value,
        stage: args.stage,
        notes: args.notes || '',
        last_contact: args.lastContact,
      })
      .eq('id', args.id)
      .select()
      .single();

    if (error) throw error;
    return mapDeal(data);
  };
}

export function useUpdateDealStage() {
  return async (args: { id: string; stage: string }) => {
    const { data, error } = await supabase
      .from('deals')
      .update({ stage: args.stage })
      .eq('id', args.id)
      .select()
      .single();

    if (error) throw error;
    return mapDeal(data);
  };
}

export function useAddInvoice() {
  return async (args: { workspaceId: string; clientId: string; invoiceNumber: string; amount: number; status: string; date: string; dueDate: string; items: any[]; tps: number; tvq: number }) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        workspace_id: args.workspaceId,
        client_id: args.clientId,
        invoice_number: args.invoiceNumber,
        amount: args.amount,
        status: args.status,
        date: args.date,
        due_date: args.dueDate,
        items: args.items,
        tps: args.tps,
        tvq: args.tvq,
      })
      .select()
      .single();

    if (error) throw error;
    return mapInvoice(data);
  };
}

export function useUpdateInvoiceStatus() {
  return async (args: { id: string; status: string }) => {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: args.status })
      .eq('id', args.id)
      .select()
      .single();

    if (error) throw error;
    return mapInvoice(data);
  };
}

export function useDeleteInvoice() {
  return async (args: { id: string }) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', args.id);

    if (error) throw error;
  };
}

export function useAddRetainer() {
  return async (args: { workspaceId: string; clientId: string; amount: number; cycle: string; status: string; startDate: string; renewalDate: string; hoursIncluded: number; hoursUsed: number; notes?: string }) => {
    const { data, error } = await supabase
      .from('retainers')
      .insert({
        workspace_id: args.workspaceId,
        client_id: args.clientId,
        amount: args.amount,
        cycle: args.cycle,
        status: args.status,
        start_date: args.startDate,
        renewal_date: args.renewalDate,
        hours_included: args.hoursIncluded,
        hours_used: args.hoursUsed,
        notes: args.notes || '',
      })
      .select()
      .single();

    if (error) throw error;
    return mapRetainer(data);
  };
}

export function useUpdateRetainer() {
  return async (args: { id: string; amount?: number; cycle?: string; status?: string; hoursIncluded?: number; hoursUsed?: number; renewalDate?: string; notes?: string }) => {
    const updates: any = {};
    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.cycle !== undefined) updates.cycle = args.cycle;
    if (args.status !== undefined) updates.status = args.status;
    if (args.hoursIncluded !== undefined) updates.hours_included = args.hoursIncluded;
    if (args.hoursUsed !== undefined) updates.hours_used = args.hoursUsed;
    if (args.renewalDate !== undefined) updates.renewal_date = args.renewalDate;
    if (args.notes !== undefined) updates.notes = args.notes;

    const { data, error } = await supabase
      .from('retainers')
      .update(updates)
      .eq('id', args.id)
      .select()
      .single();

    if (error) throw error;
    return mapRetainer(data);
  };
}

export function useDeleteRetainer() {
  return async (args: { id: string }) => {
    const { error } = await supabase
      .from('retainers')
      .delete()
      .eq('id', args.id);

    if (error) throw error;
  };
}

export function useAddFinance() {
  return async (args: { workspaceId: string; type: string; amount: number; category: string; date: string; description: string; tps: number; tvq: number; status: string }) => {
    const { data, error } = await supabase
      .from('finances')
      .insert({
        workspace_id: args.workspaceId,
        type: args.type,
        amount: args.amount,
        category: args.category,
        date: args.date,
        description: args.description,
        tps: args.tps,
        tvq: args.tvq,
        status: args.status,
      })
      .select()
      .single();

    if (error) throw error;
    return mapFinance(data);
  };
}

export function useUpdateUserProfile() {
  return async (args: { id: string; name?: string; role?: string; avatar?: string }) => {
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.role !== undefined) updates.role = args.role;
    if (args.avatar !== undefined) updates.avatar_url = args.avatar;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', args.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };
}

// ── Phase 2.5 — Workflow Engine ───────────────────────────────────────────────

export function mapWorkflow(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    name: db.name,
    description: db.description,
    isActive: db.is_active,
    isTemplate: db.is_template,
    triggerEvent: db.trigger_event,
    triggerFilters: db.trigger_filters ?? {},
    steps: (db.workflow_steps ?? []).map((s: any) => ({
      id: s.id,
      workflowId: s.workflow_id,
      stepOrder: s.step_order,
      stepType: s.step_type,
      config: s.config ?? {},
    })),
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapWorkflowRun(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    workflowId: db.workflow_id,
    workflowName: db.workflows?.name,
    triggerEvent: db.trigger_event,
    entityType: db.entity_type,
    entityId: db.entity_id,
    status: db.status,
    currentStep: db.current_step,
    resumeAt: db.resume_at,
    stepsLog: db.steps_log ?? [],
    errorMessage: db.error_message,
    startedAt: db.started_at,
    completedAt: db.completed_at,
  };
}

export function mapHandoff(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    projectId: db.project_id,
    fromStage: db.from_stage,
    toStage: db.to_stage,
    status: db.status,
    requiredFields: db.required_fields ?? [],
    notes: db.notes,
    signedOffBy: db.signed_off_by,
    signedOffAt: db.signed_off_at,
    createdAt: db.created_at,
  };
}

export function mapProjectTemplate(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    name: db.name,
    projectType: db.project_type,
    description: db.description,
    isBuiltin: db.is_builtin,
    taskPacks: db.task_packs ?? [],
    checklistItems: db.checklist_items ?? [],
    requiredFields: db.required_fields ?? [],
    slaDefaults: db.sla_defaults ?? {},
    createdAt: db.created_at,
  };
}

export function mapSLAPolicy(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    name: db.name,
    responseTime: db.response_time,
    resolutionTime: db.resolution_time,
    priority: db.priority,
  };
}

export function useWorkflows(workspaceId: string | null) {
  const [workflows, setWorkflows] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetch() {
      const { data } = await supabase
        .from('workflows')
        .select('*, workflow_steps(*)')
        .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
        .order('created_at', { ascending: false });
      setWorkflows((data ?? []).map(mapWorkflow));
    }
    fetch();

    const channel = supabase
      .channel(`workflows-realtime-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflows' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId]);

  return workflows;
}

export function useWorkflowRuns(workspaceId: string | null, limit = 20) {
  const [runs, setRuns] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetch() {
      const { data } = await supabase
        .from('workflow_runs')
        .select('*, workflows(name)')
        .eq('workspace_id', workspaceId)
        .order('started_at', { ascending: false })
        .limit(limit);
      setRuns((data ?? []).map(mapWorkflowRun));
    }
    fetch();

    const channel = supabase
      .channel(`workflow-runs-realtime-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_runs',
        filter: `workspace_id=eq.${workspaceId}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId, limit]);

  return runs;
}

export function useHandoffs(workspaceId: string | null, projectId?: string) {
  const [handoffs, setHandoffs] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetch() {
      let q = supabase
        .from('handoffs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data } = await q;
      setHandoffs((data ?? []).map(mapHandoff));
    }
    fetch();

    const channel = supabase
      .channel(`handoffs-realtime-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'handoffs',
        filter: `workspace_id=eq.${workspaceId}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId, projectId]);

  return handoffs;
}

export function useProjectTemplates() {
  const [templates, setTemplates] = useState<any[] | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('project_templates')
        .select('*')
        .is('workspace_id', null)
        .order('created_at');
      setTemplates((data ?? []).map(mapProjectTemplate));
    }
    fetch();
  }, []);

  return templates;
}

export function useSLAPolicies(workspaceId: string | null) {
  const [policies, setPolicies] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetch() {
      const { data } = await supabase
        .from('sla_policies')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('priority');
      setPolicies((data ?? []).map(mapSLAPolicy));
    }
    fetch();
  }, [workspaceId]);

  return policies;
}

export function useProjectDependencies(workspaceId: string | null, projectId: string | null) {
  const [deps, setDeps] = useState<{ tasks: any[]; approvals: any[]; invoices: any[]; deals: any[] } | null>(null);

  useEffect(() => {
    if (!workspaceId || !projectId) return;

    async function fetch() {
      const [tasksRes, approvalsRes, invoicesRes, dealsRes] = await Promise.all([
        supabase.from('tasks').select('id,title,status,priority,assignee,due_date').eq('workspace_id', workspaceId).eq('project_id', projectId).order('due_date'),
        supabase.from('approvals').select('id,name,status,type,sla_deadline,sla_breached').eq('workspace_id', workspaceId).eq('project_id', projectId),
        supabase.from('invoices').select('id,invoice_number,amount,status,due_date').eq('workspace_id', workspaceId).eq('project_id', projectId),
        supabase.from('deals').select('id,company,stage,value').eq('workspace_id', workspaceId),
      ]);
      setDeps({
        tasks: tasksRes.data ?? [],
        approvals: approvalsRes.data ?? [],
        invoices: invoicesRes.data ?? [],
        deals: dealsRes.data ?? [],
      });
    }
    fetch();
  }, [workspaceId, projectId]);

  return deps;
}

export function useAddWorkflow() {
  return async (args: { workspaceId: string; name: string; description?: string; triggerEvent: string; triggerFilters?: Record<string, unknown>; steps: Array<{ stepOrder: number; stepType: string; config: Record<string, unknown> }> }) => {
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        workspace_id: args.workspaceId,
        name: args.name,
        description: args.description,
        trigger_event: args.triggerEvent,
        trigger_filters: args.triggerFilters ?? {},
        is_active: true,
        is_template: false,
      })
      .select()
      .single();

    if (error) throw error;

    if (args.steps.length > 0) {
      const { error: stepsError } = await supabase
        .from('workflow_steps')
        .insert(args.steps.map(s => ({
          workflow_id: data.id,
          step_order: s.stepOrder,
          step_type: s.stepType,
          config: s.config,
        })));
      if (stepsError) throw stepsError;
    }

    return mapWorkflow(data);
  };
}

export function useUpdateWorkflow() {
  return async (args: { id: string; name?: string; description?: string; isActive?: boolean; steps?: Array<{ stepOrder: number; stepType: string; config: Record<string, unknown> }> }) => {
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.is_active = args.isActive;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.from('workflows').update(updates).eq('id', args.id);
    if (error) throw error;

    if (args.steps) {
      await supabase.from('workflow_steps').delete().eq('workflow_id', args.id);
      if (args.steps.length > 0) {
        await supabase.from('workflow_steps').insert(args.steps.map(s => ({
          workflow_id: args.id,
          step_order: s.stepOrder,
          step_type: s.stepType,
          config: s.config,
        })));
      }
    }
  };
}

export function useDeleteWorkflow() {
  return async (id: string) => {
    const { error } = await supabase.from('workflows').delete().eq('id', id);
    if (error) throw error;
  };
}

export function useAddHandoff() {
  return async (args: { workspaceId: string; projectId: string; fromStage: string; toStage: string; requiredFields: Array<{ field: string; label: string; satisfied: boolean }> }) => {
    const { data, error } = await supabase
      .from('handoffs')
      .insert({
        workspace_id: args.workspaceId,
        project_id: args.projectId,
        from_stage: args.fromStage,
        to_stage: args.toStage,
        required_fields: args.requiredFields,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return mapHandoff(data);
  };
}

export function useUpdateHandoff() {
  return async (args: { id: string; status?: string; requiredFields?: any[]; notes?: string; signedOffBy?: string }) => {
    const updates: any = {};
    if (args.status !== undefined) updates.status = args.status;
    if (args.requiredFields !== undefined) updates.required_fields = args.requiredFields;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.signedOffBy !== undefined) { updates.signed_off_by = args.signedOffBy; updates.signed_off_at = new Date().toISOString(); }

    const { error } = await supabase.from('handoffs').update(updates).eq('id', args.id);
    if (error) throw error;
  };
}

export function useAddSLAPolicy() {
  return async (args: { workspaceId: string; name: string; priority: string; responseTime: number; resolutionTime: number }) => {
    const { data, error } = await supabase
      .from('sla_policies')
      .insert({ workspace_id: args.workspaceId, name: args.name, priority: args.priority, response_time: args.responseTime, resolution_time: args.resolutionTime })
      .select().single();
    if (error) throw error;
    return mapSLAPolicy(data);
  };
}

export function useUpdateSLAPolicy() {
  return async (args: { id: string; name?: string; responseTime?: number; resolutionTime?: number }) => {
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.responseTime !== undefined) updates.response_time = args.responseTime;
    if (args.resolutionTime !== undefined) updates.resolution_time = args.resolutionTime;
    const { error } = await supabase.from('sla_policies').update(updates).eq('id', args.id);
    if (error) throw error;
  };
}

export function useDeleteSLAPolicy() {
  return async (id: string) => {
    const { error } = await supabase.from('sla_policies').delete().eq('id', id);
    if (error) throw error;
  };
}

// ── Phase 2.6 — Finance & Profitability ──────────────────────────────────────

function mapServiceCatalogItem(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    name: db.name,
    description: db.description,
    basePrice: db.base_price ?? 0,
    category: db.category,
    costRate: db.cost_rate ?? 0,
    sellRate: db.sell_rate ?? 0,
    targetMargin: db.target_margin ?? 40,
    createdAt: db.created_at,
  };
}

function mapProjectPhase(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    projectId: db.project_id,
    stage: db.stage,
    budgetHours: db.budget_hours ?? 0,
    budgetAmount: db.budget_amount ?? 0,
    createdAt: db.created_at,
  };
}

function mapBillingDispute(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    invoiceId: db.invoice_id,
    projectId: db.project_id,
    clientId: db.client_id,
    title: db.title,
    description: db.description,
    amountDisputed: db.amount_disputed ?? 0,
    status: db.status,
    resolution: db.resolution,
    resolvedBy: db.resolved_by,
    resolvedAt: db.resolved_at,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapEstimationTemplate(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    name: db.name,
    serviceType: db.service_type,
    estimatedHours: db.estimated_hours ?? 0,
    sellRate: db.sell_rate ?? 0,
    costRate: db.cost_rate ?? 0,
    lineItems: db.line_items ?? [],
    isBuiltin: db.is_builtin ?? false,
    createdAt: db.created_at,
  };
}

export function useServiceCatalogItems(workspaceId: string | null) {
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    const load = async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
        .order('name');
      setItems((data ?? []).map(mapServiceCatalogItem));
    };
    load();

    const channel = supabase.channel(`services:${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services', filter: `workspace_id=eq.${workspaceId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId]);

  return items;
}

export function useUpdateServiceRates() {
  return async (args: { id: string; costRate?: number; sellRate?: number; targetMargin?: number }) => {
    const updates: any = {};
    if (args.costRate !== undefined) updates.cost_rate = args.costRate;
    if (args.sellRate !== undefined) updates.sell_rate = args.sellRate;
    if (args.targetMargin !== undefined) updates.target_margin = args.targetMargin;
    const { error } = await supabase.from('services').update(updates).eq('id', args.id);
    if (error) throw error;
  };
}

export function usePhaseBudgets(projectId: string | null) {
  const [phases, setPhases] = useState<any[] | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      const { data } = await supabase
        .from('project_phase_budgets')
        .select('*')
        .eq('project_id', projectId)
        .order('stage');
      setPhases((data ?? []).map(mapProjectPhase));
    };
    load();

    const channel = supabase.channel(`phase_budgets:${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_phase_budgets', filter: `project_id=eq.${projectId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  return phases;
}

export function useUpsertPhaseBudget() {
  return async (args: { workspaceId: string; projectId: string; stage: string; budgetHours: number; budgetAmount: number }) => {
    const { error } = await supabase
      .from('project_phase_budgets')
      .upsert({
        workspace_id: args.workspaceId,
        project_id: args.projectId,
        stage: args.stage,
        budget_hours: args.budgetHours,
        budget_amount: args.budgetAmount,
      }, { onConflict: 'project_id,stage' });
    if (error) throw error;
  };
}

export function useBillingDisputes(workspaceId: string | null, projectId?: string) {
  const [disputes, setDisputes] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    const load = async () => {
      let q = supabase.from('billing_disputes').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data } = await q;
      setDisputes((data ?? []).map(mapBillingDispute));
    };
    load();

    const channel = supabase.channel(`disputes:${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billing_disputes', filter: `workspace_id=eq.${workspaceId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId, projectId]);

  return disputes;
}

export function useAddBillingDispute() {
  return async (args: { workspaceId: string; title: string; description?: string; amountDisputed: number; projectId?: string; invoiceId?: string; clientId?: string; createdBy?: string }) => {
    const { data, error } = await supabase
      .from('billing_disputes')
      .insert({
        workspace_id: args.workspaceId,
        title: args.title,
        description: args.description,
        amount_disputed: args.amountDisputed,
        project_id: args.projectId,
        invoice_id: args.invoiceId,
        client_id: args.clientId,
        created_by: args.createdBy,
        status: 'open',
      })
      .select()
      .single();
    if (error) throw error;
    return mapBillingDispute(data);
  };
}

export function useUpdateBillingDispute() {
  return async (args: { id: string; status?: string; resolution?: string; resolvedBy?: string }) => {
    const updates: any = {};
    if (args.status !== undefined) updates.status = args.status;
    if (args.resolution !== undefined) updates.resolution = args.resolution;
    if (args.resolvedBy !== undefined) { updates.resolved_by = args.resolvedBy; updates.resolved_at = new Date().toISOString(); }
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('billing_disputes').update(updates).eq('id', args.id);
    if (error) throw error;
  };
}

export function useEstimationTemplates(workspaceId?: string | null) {
  const [templates, setTemplates] = useState<any[] | null>(null);

  useEffect(() => {
    const load = async () => {
      let q = supabase.from('estimation_templates').select('*').order('name');
      if (workspaceId) {
        q = q.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);
      } else {
        q = q.is('workspace_id', null);
      }
      const { data } = await q;
      setTemplates((data ?? []).map(mapEstimationTemplate));
    };
    load();
  }, [workspaceId]);

  return templates;
}

export function useAddEstimationTemplate() {
  return async (args: { workspaceId: string; name: string; serviceType: string; estimatedHours: number; sellRate: number; costRate: number; lineItems: any[] }) => {
    const { data, error } = await supabase
      .from('estimation_templates')
      .insert({
        workspace_id: args.workspaceId,
        name: args.name,
        service_type: args.serviceType,
        estimated_hours: args.estimatedHours,
        sell_rate: args.sellRate,
        cost_rate: args.costRate,
        line_items: args.lineItems,
        is_builtin: false,
      })
      .select()
      .single();
    if (error) throw error;
    return mapEstimationTemplate(data);
  };
}

export function useProjectFinancials(workspaceId: string | null) {
  const [financials, setFinancials] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    const load = async () => {
      const [{ data: projects }, { data: timeEntries }, { data: milestones }] = await Promise.all([
        supabase.from('projects').select('id,name,client_name,budget,estimated_hours,scope_flagged,scope_flagged_at,status').eq('workspace_id', workspaceId),
        supabase.from('time_entries').select('project_id,duration,hourly_rate').eq('workspace_id', workspaceId),
        supabase.from('milestones').select('project_id,revenue_pct,status,recognized_at').eq('workspace_id', workspaceId),
      ]);

      const teByProject: Record<string, { hours: number; cost: number }> = {};
      for (const te of (timeEntries ?? [])) {
        if (!te.project_id) continue;
        if (!teByProject[te.project_id]) teByProject[te.project_id] = { hours: 0, cost: 0 };
        const hrs = (te.duration ?? 0) / 60;
        teByProject[te.project_id].hours += hrs;
        teByProject[te.project_id].cost += hrs * (te.hourly_rate ?? 0);
      }

      const mssByProject: Record<string, number> = {};
      for (const ms of (milestones ?? [])) {
        if (!ms.project_id) continue;
        if (!mssByProject[ms.project_id]) mssByProject[ms.project_id] = 0;
        if (ms.status === 'completed') mssByProject[ms.project_id] += ms.revenue_pct ?? 0;
      }

      const result = (projects ?? []).map((p: any) => {
        const te = teByProject[p.id] ?? { hours: 0, cost: 0 };
        const revPct = Math.min(mssByProject[p.id] ?? 0, 100);
        const recognizedRevenue = p.budget * (revPct / 100);
        const margin = recognizedRevenue > 0 ? ((recognizedRevenue - te.cost) / recognizedRevenue) * 100 : 0;
        return {
          projectId: p.id,
          projectName: p.name,
          clientName: p.client_name,
          budget: p.budget ?? 0,
          estimatedHours: p.estimated_hours ?? 0,
          loggedHours: te.hours,
          loggedCost: te.cost,
          recognizedRevenue,
          margin,
          scopeFlagged: p.scope_flagged ?? false,
          scopeFlaggedAt: p.scope_flagged_at,
        };
      });
      setFinancials(result);
    };
    load();
  }, [workspaceId]);

  return financials;
}

export function useCashForecast(workspaceId: string | null) {
  const [forecast, setForecast] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    const load = async () => {
      const now = new Date();
      const d90 = new Date(now.getTime() + 90 * 24 * 3600000).toISOString();
      const [{ data: invoices }, { data: milestones }, { data: projects }] = await Promise.all([
        supabase.from('invoices').select('amount,due_date,status').eq('workspace_id', workspaceId).lte('due_date', d90).neq('status', 'paid'),
        supabase.from('milestones').select('project_id,due_date,revenue_pct').eq('workspace_id', workspaceId).lte('due_date', d90).neq('status', 'completed'),
        supabase.from('projects').select('id,budget').eq('workspace_id', workspaceId),
      ]);

      const budgetMap: Record<string, number> = {};
      for (const p of (projects ?? [])) budgetMap[p.id] = p.budget ?? 0;

      const buckets = [
        { label: '30d', daysFrom: 0, daysTo: 30, invoicedAmount: 0, milestoneRevenue: 0 },
        { label: '60d', daysFrom: 30, daysTo: 60, invoicedAmount: 0, milestoneRevenue: 0 },
        { label: '90d', daysFrom: 60, daysTo: 90, invoicedAmount: 0, milestoneRevenue: 0 },
      ];

      for (const inv of (invoices ?? [])) {
        if (!inv.due_date) continue;
        const diff = (new Date(inv.due_date).getTime() - now.getTime()) / (24 * 3600000);
        for (const b of buckets) {
          if (diff >= b.daysFrom && diff < b.daysTo) { b.invoicedAmount += inv.amount ?? 0; break; }
        }
      }

      for (const ms of (milestones ?? [])) {
        if (!ms.due_date) continue;
        const diff = (new Date(ms.due_date).getTime() - now.getTime()) / (24 * 3600000);
        const rev = (budgetMap[ms.project_id] ?? 0) * ((ms.revenue_pct ?? 0) / 100);
        for (const b of buckets) {
          if (diff >= b.daysFrom && diff < b.daysTo) { b.milestoneRevenue += rev; break; }
        }
      }

      setForecast(buckets.map(b => ({
        ...b,
        expectedRevenue: b.invoicedAmount + b.milestoneRevenue,
      })));
    };
    load();
  }, [workspaceId]);

  return forecast;
}

export function usePortfolioClients(workspaceId: string | null) {
  const [portfolio, setPortfolio] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    const load = async () => {
      const [{ data: projects }, { data: timeEntries }] = await Promise.all([
        supabase.from('projects').select('id,client_id,client_name,budget,estimated_hours,scope_flagged,status').eq('workspace_id', workspaceId),
        supabase.from('time_entries').select('project_id,duration,hourly_rate').eq('workspace_id', workspaceId),
      ]);

      const costByProject: Record<string, number> = {};
      for (const te of (timeEntries ?? [])) {
        if (!te.project_id) continue;
        costByProject[te.project_id] = (costByProject[te.project_id] ?? 0) + ((te.duration ?? 0) / 60) * (te.hourly_rate ?? 0);
      }

      const clientMap: Record<string, { clientId: string; clientName: string; totalBudget: number; totalRevenue: number; totalCost: number; projectCount: number }> = {};
      for (const p of (projects ?? [])) {
        const key = p.client_id ?? p.client_name;
        if (!clientMap[key]) clientMap[key] = { clientId: p.client_id ?? key, clientName: p.client_name, totalBudget: 0, totalRevenue: 0, totalCost: 0, projectCount: 0 };
        clientMap[key].totalBudget += p.budget ?? 0;
        clientMap[key].totalCost += costByProject[p.id] ?? 0;
        clientMap[key].projectCount += 1;
        if (p.status === 'completed') clientMap[key].totalRevenue += p.budget ?? 0;
      }

      setPortfolio(Object.values(clientMap).map(c => ({
        clientId: c.clientId,
        clientName: c.clientName,
        totalBudget: c.totalBudget,
        totalRevenue: c.totalRevenue,
        activeProjects: c.projectCount,
        avgMargin: c.totalRevenue > 0 ? ((c.totalRevenue - c.totalCost) / c.totalRevenue) * 100 : 0,
      })));
    };
    load();
  }, [workspaceId]);

  return portfolio;
}

export function useFlagScopeCreep() {
  return async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .update({ scope_flagged: true, scope_flagged_at: new Date().toISOString() })
      .eq('id', projectId);
    if (error) throw error;
  };
}

export function useUpdateMilestoneRevenue() {
  return async (args: { id: string; revenuePct: number; markRecognized?: boolean }) => {
    const updates: any = { revenue_pct: args.revenuePct };
    if (args.markRecognized) updates.recognized_at = new Date().toISOString();
    const { error } = await supabase.from('milestones').update(updates).eq('id', args.id);
    if (error) throw error;
  };
}
