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
];
