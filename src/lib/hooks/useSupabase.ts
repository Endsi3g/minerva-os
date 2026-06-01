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
      const { data, error } = await supabase.from('workspaces').select('*');
      if (!error && data) {
        setWorkspaces(data.map(w => ({ _id: w.id, id: w.id, name: w.name, slug: w.slug })));
      } else {
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
    if (!workspaceId) { return; }
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
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (active && !error && data) {
        setClients(data.map(mapClient));
      } else if (error) {
        setClients([]);
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
      channel.unsubscribe();
    };
  }, [workspaceId]);

  return clients;
}

export function useProjects(workspaceId: string | undefined | null) {
  const [projects, setProjects] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) { return; }
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: false });

      if (active && !error && data) {
        setProjects(data.map(mapProject));
      } else if (error) {
        setProjects([]);
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
      channel.unsubscribe();
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
    if (!workspaceId) { return; }
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
        } else if (error) {
          setTasks([]);
        }
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
      channel.unsubscribe();
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
    if (!workspaceId) { return; }
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
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (active && !error && data) {
        setDeals(data.map(mapDeal));
      } else if (error) {
        setDeals([]);
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
      channel.unsubscribe();
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
    if (!workspaceId) { return; }
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
        } else if (error) {
          setInvoices([]);
        }
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
      channel.unsubscribe();
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
      return;
    }

    let active = true;

    async function fetchRetainers() {
      const { data, error } = await supabase
        .from('retainers')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (active) {
        if (!error && data) {
          setRetainers(data.map(mapRetainer));
        } else if (error) {
          setRetainers([]);
        }
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
      channel.unsubscribe();
    };
  }, [workspaceId]);

  return retainers;
}

export function useFinances(workspaceId: string | undefined | null) {
  const [finances, setFinances] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    let active = true;

    async function fetchFinances() {
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: false });

      if (active) {
        if (!error && data) {
          setFinances(data.map(mapFinance));
        } else if (error) {
          setFinances([]);
        }
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
      channel.unsubscribe();
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

    let active = true;

    async function fetchApprovals() {
      let query = supabase.from('approvals').select('*');
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (active) {
        if (!error && data) {
          setApprovals(data.map(mapApproval));
        } else if (error) {
          setApprovals([]);
        }
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
      channel.unsubscribe();
    };
  }, [workspaceId]);

  return approvals;
}

export function useActivity(workspaceId: string | undefined | null) {
  const [activity, setActivity] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    let active = true;

    async function fetchActivity() {
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (active) {
        if (!error && data) {
          setActivity(data.map(mapActivity));
        } else if (error) {
          setActivity([]);
        }
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
      channel.unsubscribe();
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
      channel.unsubscribe();
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
