import { supabaseSelect, getWorkspaceId } from '../supabase-client.js';

export const reportsTools = [
  {
    name: 'get_reports_summary',
    description: 'Get analytics summary: pipeline win rate, total pipeline value, approval stats, and top clients by revenue.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] },
    async handler(_args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const [deals, approvals, invoices, clients] = await Promise.all([
        supabaseSelect('deals', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('approvals', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('invoices', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('clients', { workspace_id: `eq.${workspaceId}` }),
      ]) as [any[], any[], any[], any[]];

      const wonDeals = deals?.filter((d: any) => d.stage === 'won') ?? [];
      const winRate = deals?.length ? Math.round((wonDeals.length / deals.length) * 100) : 0;

      const topClients = (clients ?? [])
        .map((c: any) => ({
          company: c.company,
          revenue: (invoices ?? []).filter((i: any) => i.client_id === c.id && i.status === 'paid').reduce((s: number, i: any) => s + Number(i.amount), 0),
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        pipelineValue: deals?.reduce((s: number, d: any) => s + Number(d.value), 0) ?? 0,
        winRate,
        pendingApprovals: approvals?.filter((a: any) => a.status === 'pending').length ?? 0,
        approvedTotal: approvals?.filter((a: any) => a.status === 'approved').length ?? 0,
        topClientsByRevenue: topClients,
      };
    },
  },
  {
    name: 'list_agent_suggestions',
    description: 'List pending AI agent suggestions awaiting human approval.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] },
    async handler(_args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const suggestions = await supabaseSelect('agent_suggestions', {
        workspace_id: `eq.${workspaceId}`,
        status: 'eq.pending',
        order: 'created_at.desc',
      });
      return { suggestions: suggestions ?? [] };
    },
  },
  {
    name: 'get_risk_flags',
    description: 'Get active risk flags: overdue projects, overdue invoices, stalled approvals.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] },
    async handler(_args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const [projects, invoices, approvals] = await Promise.all([
        supabaseSelect('projects', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('invoices', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('approvals', { workspace_id: `eq.${workspaceId}` }),
      ]) as [any[], any[], any[]];

      const today = new Date();
      const flags: Array<{ type: string; severity: string; message: string }> = [];

      (projects ?? []).forEach((p: any) => {
        if (p.status === 'active' && new Date(p.due_date) < today) {
          flags.push({ type: 'project_overdue', severity: 'high', message: `Project "${p.name}" is past due date` });
        }
      });

      const overdueInvoices = (invoices ?? []).filter((i: any) => i.status === 'overdue');
      if (overdueInvoices.length > 0) {
        flags.push({ type: 'invoices_overdue', severity: 'high', message: `${overdueInvoices.length} invoice(s) overdue` });
      }

      (approvals ?? []).forEach((a: any) => {
        if (a.status === 'pending') {
          const days = Math.floor((today.getTime() - new Date(a.submitted_date).getTime()) / 86400000);
          if (days > 5) flags.push({ type: 'approval_stalled', severity: 'medium', message: `Approval "${a.name}" pending for ${days} days` });
        }
      });

      return { flags, count: flags.length };
    },
  },
  {
    name: 'sla_audit',
    description: 'Run SLA risk audit across active contracts. Returns violations grouped by severity (critical, high, medium, low) with clause details.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspace_id: { type: 'string', description: 'Optional workspace ID override' },
      },
      required: [],
    },
    async handler(_args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const [contracts, projects, invoices] = await Promise.all([
        supabaseSelect('contracts', { workspace_id: `eq.${workspaceId}` }).catch(() => [] as any[]),
        supabaseSelect('projects', { workspace_id: `eq.${workspaceId}`, status: 'eq.active' }),
        supabaseSelect('invoices', { workspace_id: `eq.${workspaceId}`, status: 'eq.overdue' }),
      ]) as [any[], any[], any[]];

      const today = new Date();
      const violations: Array<{ severity: string; contract: string; client: string; clause: string; detail: string }> = [];

      (projects ?? []).forEach((p: any) => {
        if (p.due_date && new Date(p.due_date) < today) {
          violations.push({ severity: 'critical', contract: 'Project Agreement', client: p.client_name ?? p.client ?? '', clause: 'Deliverable deadline', detail: `Project "${p.name}" is past due date.` });
        }
      });

      (invoices ?? []).forEach((i: any) => {
        violations.push({ severity: 'high', contract: 'Service Agreement', client: i.client ?? '', clause: 'Payment terms', detail: `Invoice ${i.invoice_number ?? i.id} is overdue.` });
      });

      (contracts ?? []).forEach((c: any) => {
        if (c.expires_at) {
          const daysLeft = Math.ceil((new Date(c.expires_at).getTime() - today.getTime()) / 86400000);
          if (daysLeft < 30 && daysLeft >= 0) {
            violations.push({ severity: 'high', contract: c.name ?? 'Contract', client: c.client_name ?? '', clause: 'Renewal notice', detail: `Contract expires in ${daysLeft} days.` });
          }
        }
      });

      const grouped = { critical: violations.filter(v => v.severity === 'critical'), high: violations.filter(v => v.severity === 'high'), medium: violations.filter(v => v.severity === 'medium'), low: violations.filter(v => v.severity === 'low') };
      const healthScore = violations.length === 0 ? 100 : grouped.critical.length > 0 ? 42 : grouped.high.length > 0 ? 61 : 78;

      return { healthScore, totalViolations: violations.length, violations: grouped };
    },
  },
  {
    name: 'list_contracts',
    description: 'List all contracts for the workspace with status, client, expiry dates, and key clauses.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['active', 'expired', 'draft', 'all'], description: 'Filter by contract status' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const statusFilter = (args.status as string) ?? 'all';
      const query: Record<string, string> = { workspace_id: `eq.${workspaceId}` };
      if (statusFilter !== 'all') query.status = `eq.${statusFilter}`;

      const contracts = await supabaseSelect('contracts', query).catch(() => [] as any[]) as any[];

      return {
        count: contracts.length,
        contracts: (contracts ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          client: c.client_name ?? '',
          status: c.status,
          startDate: c.start_date,
          expiresAt: c.expires_at,
          value: c.value,
          notes: c.notes,
        })),
      };
    },
  },
];
