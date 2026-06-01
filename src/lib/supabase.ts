import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_CLIENTS,
  MOCK_LEADS,
  MOCK_APPROVALS,
  MOCK_INVOICES,
  MOCK_PROPOSALS
} from '@/lib/mock-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.DEMO_MODE === 'true';

let mockDb: Record<string, any[]> = {};

function initMockDb() {
  if (Object.keys(mockDb).length > 0) return;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    const saved = localStorage.getItem('minerva_mock_db');
    if (saved) {
      mockDb = JSON.parse(saved);
      return;
    }
  } catch {
    // Ignore
  }

  mockDb = {
    workspaces: [{ id: 'mock-workspace-123', name: 'Minerva OS Workspace', slug: 'minerva', owner_user_id: 'demo-user-01' }],
    user_profiles: [
      {
        id: 'demo-user-01',
        user_id: 'demo-user-01',
        email: 'demo@uprising.studio',
        name: 'Demo User',
        role: 'owner',
        workspace_id: 'mock-workspace-123'
      }
    ],
    time_entries: [],
    projects: MOCK_PROJECTS.map(p => ({
      id: p.id,
      workspace_id: 'mock-workspace-123',
      name: p.name,
      client_id: p.clientId,
      status: p.status,
      due_date: p.dueDate,
      budget: p.budget,
      spent: p.spent
    })),
    tasks: MOCK_TASKS.map(t => ({
      id: t.id,
      workspace_id: 'mock-workspace-123',
      project_id: t.projectId,
      title: t.title,
      assignee: t.assignee,
      due_date: t.dueDate,
      priority: t.priority,
      status: t.status
    })),
    tickets: [],
    services: [],
    packages: [],
    member_availability: [],
    clients: MOCK_CLIENTS.map(c => ({
      id: c.id,
      workspace_id: 'mock-workspace-123',
      company: c.company,
      industry: c.industry,
      contact_name: c.contact,
      email: c.email,
      monthly_value: c.monthlyValue,
      status: c.status
    })),
    deals: MOCK_LEADS.map(l => ({
      id: l.id,
      workspace_id: 'mock-workspace-123',
      company: l.company,
      contact_name: l.contact,
      email: l.email,
      value: l.value,
      probability: l.probability,
      stage: l.stage,
      owner: l.owner
    })),
    approvals: MOCK_APPROVALS.map(a => ({
      id: a.id,
      workspace_id: 'mock-workspace-123',
      name: a.name,
      type: a.type,
      project: a.project,
      client: a.client,
      submitted_by: a.submittedBy,
      submitted_date: a.submittedDate,
      status: a.status
    })),
    invoices: MOCK_INVOICES.map(i => ({
      id: i.id,
      workspace_id: 'mock-workspace-123',
      number: i.number,
      client: i.client,
      client_id: i.clientId,
      project: i.project,
      amount: i.amount,
      currency: i.currency,
      status: i.status,
      issued_date: i.issuedDate,
      due_date: i.dueDate,
      paid_date: i.paidDate
    })),
    expenses: [],
    proposals: MOCK_PROPOSALS.map(p => ({
      id: p.id,
      workspace_id: p.workspace_id,
      title: p.title,
      client_id: p.client_id,
      total_amount: p.total_amount,
      status: p.status,
      token: p.token,
      valid_until: p.valid_until,
      signed_by: p.signed_by,
      signed_at: p.signed_at
    })),
    nps_responses: [],
    knowledge_base: [],
    email_drafts: []
  };

  saveMockDb();
}

function saveMockDb() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('minerva_mock_db', JSON.stringify(mockDb));
  } catch {
    // Ignore
  }
}

function getMockUser() {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('minerva_mock_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

function setMockSession(user: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('minerva_mock_user', JSON.stringify(user));
    localStorage.setItem('minerva_mock_session', JSON.stringify({ user }));
    document.cookie = "minerva_mock_logged_in=true; path=/; max-age=31536000; SameSite=Lax";
    triggerAuthListeners('SIGNED_IN', { user });
  } catch {}
}

function clearMockSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('minerva_mock_user');
    localStorage.removeItem('minerva_mock_session');
    document.cookie = "minerva_mock_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    triggerAuthListeners('SIGNED_OUT', null);
  } catch {}
}

let authListeners: Array<(event: string, session: any) => void> = [];

function triggerAuthListeners(event: string, session: any) {
  authListeners.forEach(listener => {
    try {
      listener(event, session);
    } catch (e) {
      console.error(e);
    }
  });
}

class MockQueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private sortField: string | null = null;
  private sortAscending: boolean = true;
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private actionData: any = null;
  private rangeFrom?: number;
  private rangeTo?: number;

  constructor(table: string) {
    this.table = table;
    initMockDb();
  }

  select(columns?: string) {
    if (columns) {
      // keep reference
    }
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => {
      if (item[column] === value) return true;
      const camel = column.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (item[camel] === value) return true;
      const snake = column.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (item[snake] === value) return true;
      return false;
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item: any) => {
      if (item[column] !== value) return true;
      const camel = column.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (item[camel] !== value) return false;
      const snake = column.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (item[snake] !== value) return false;
      return true;
    });
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.sortField = column;
    this.sortAscending = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.actionData = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.actionData = data;
    return this;
  }

  or(expression: string) {
    this.filters.push((item: any) => {
      const parts = expression.split(',');
      for (const part of parts) {
        const match = part.match(/([^.]+)\.(ilike|eq)\.(.+)/);
        if (match) {
          const [, field, op, val] = match;
          const cleanVal = val.replace(/%/g, '').toLowerCase();
          const itemVal = String(item[field] || '').toLowerCase();
          if (op === 'ilike' && itemVal.includes(cleanVal)) {
            return true;
          }
          if (op === 'eq' && itemVal === cleanVal) {
            return true;
          }
        }
      }
      return false;
    });
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  async then(onfulfilled: (res: any) => void) {
    const list = mockDb[this.table] || [];
    let result: any = null;

    if (this.action === 'select') {
      let filtered = [...list];
      for (const filterFn of this.filters) {
        filtered = filtered.filter(filterFn);
      }
      if (this.sortField) {
        filtered.sort((a, b) => {
          const valA = a[this.sortField!];
          const valB = b[this.sortField!];
          if (valA < valB) return this.sortAscending ? -1 : 1;
          if (valA > valB) return this.sortAscending ? 1 : -1;
          return 0;
        });
      }
      const totalCount = filtered.length;
      if (this.rangeFrom !== undefined && this.rangeTo !== undefined) {
        filtered = filtered.slice(this.rangeFrom, this.rangeTo + 1);
      } else if (this.limitCount !== null) {
        filtered = filtered.slice(0, this.limitCount);
      }
      if (this.isSingle || this.isMaybeSingle) {
        result = filtered[0] || null;
      } else {
        result = filtered;
      }
      onfulfilled({ data: result, error: null, count: totalCount });
      return;
    } else if (this.action === 'insert') {
      const records = Array.isArray(this.actionData) ? this.actionData : [this.actionData];
      const newRecords = records.map(r => ({
        id: r.id || 'mock-id-' + Math.random().toString(36).substr(2, 9),
        ...r
      }));
      if (!mockDb[this.table]) {
        mockDb[this.table] = [];
      }
      mockDb[this.table].push(...newRecords);
      saveMockDb();
      result = Array.isArray(this.actionData) ? newRecords : newRecords[0];
    } else if (this.action === 'update') {
      if (!mockDb[this.table]) mockDb[this.table] = [];
      const updatedList = mockDb[this.table].map(item => {
        let matches = true;
        for (const filterFn of this.filters) {
          if (!filterFn(item)) matches = false;
        }
        if (matches) {
          return { ...item, ...this.actionData };
        }
        return item;
      });
      mockDb[this.table] = updatedList;
      saveMockDb();
      result = updatedList.filter(item => {
        let matches = true;
        for (const filterFn of this.filters) {
          if (!filterFn(item)) matches = false;
        }
        return matches;
      });
      if (this.isSingle || this.isMaybeSingle) {
        result = result[0] || null;
      }
    } else if (this.action === 'delete') {
      if (!mockDb[this.table]) mockDb[this.table] = [];
      const kept = mockDb[this.table].filter(item => {
        let matches = true;
        for (const filterFn of this.filters) {
          if (!filterFn(item)) matches = false;
        }
        return !matches;
      });
      mockDb[this.table] = kept;
      saveMockDb();
      result = [];
    }

    onfulfilled({ data: result, error: null });
  }
}

function createMockSupabaseClient() {
  return {
    auth: {
      getSession: async () => {
        const user = getMockUser();
        return { data: { session: user ? { user } : null }, error: null };
      },
      getUser: async () => {
        const user = getMockUser();
        return { data: { user }, error: null };
      },
      signInWithPassword: async ({ email }: { email: string }) => {
        const name = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
        const user = {
          id: 'demo-user-01',
          email,
          user_metadata: { name },
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          created_at: new Date().toISOString()
        };
        setMockSession(user);
        return { data: { user, session: { user } }, error: null };
      },
      signUp: async ({ email, options }: { email: string; options?: any }) => {
        const name = options?.data?.name || email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
        const user = {
          id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
          email,
          user_metadata: { name },
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          created_at: new Date().toISOString()
        };
        setMockSession(user);
        return { data: { user, session: { user } }, error: null };
      },
      signOut: async () => {
        clearMockSession();
        return { error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        authListeners.push(callback);
        const user = getMockUser();
        setTimeout(() => {
          callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
        }, 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners = authListeners.filter(l => l !== callback);
              }
            }
          }
        };
      }
    },
    from: (table: string) => {
      return new MockQueryBuilder(table);
    },
    channel: () => {
      return {
        on: function() { return this; },
        subscribe: () => ({})
      };
    },
    rpc: async (fnName: string, args: any) => {
      initMockDb();
      if (fnName === 'match_knowledge_base') {
        const list = mockDb['knowledge_base'] || [];
        const filtered = list.filter(item => !args.filter_workspace_id || item.workspace_id === args.filter_workspace_id);
        return { data: filtered.slice(0, args.match_count), error: null };
      }
      if (fnName === 'match_projects') {
        const list = mockDb['projects'] || [];
        const filtered = list.filter(item => !args.filter_workspace_id || item.workspace_id === args.filter_workspace_id);
        return {
          data: filtered.map(p => ({
            id: p.id,
            name: p.name,
            client_name: p.client_name || p.client || 'Client',
            status: p.status,
            similarity: 0.9
          })).slice(0, args.match_count),
          error: null
        };
      }
      return { data: [], error: null };
    }
  };
}

// createBrowserClient stores the session in cookies so the SSR middleware
// (updateSession) can read it server-side. Using createClient here would
// store the session in localStorage, invisible to the middleware, causing
// an auth redirect loop after login.
export const supabase = (isDemo ? (createMockSupabaseClient() as any) : createBrowserClient(supabaseUrl, supabasePublishableKey)) as SupabaseClient;
