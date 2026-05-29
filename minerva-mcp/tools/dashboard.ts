import { supabaseSelect, supabaseInsert, getWorkspaceId } from '../supabase-client.js';

export const dashboardTools = [
  {
    name: 'get_dashboard_metrics',
    description: 'Get the Minerva OS dashboard KPIs: active projects, open tasks, pending approvals, revenue month-to-date, and pipeline value.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    async handler(_args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found. Connect a live Supabase backend.' };

      const wf = `workspace_id=eq.${workspaceId}`;
      const [projects, tasks, approvals, invoices, deals] = await Promise.all([
        supabaseSelect('projects', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('tasks', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('approvals', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('invoices', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('deals', { workspace_id: `eq.${workspaceId}` }),
      ]) as [any[], any[], any[], any[], any[]];

      const now = new Date();
      return {
        activeProjects: projects?.filter((p: any) => p.status === 'active').length ?? 0,
        openTasks: tasks?.filter((t: any) => t.status !== 'done').length ?? 0,
        pendingApprovals: approvals?.filter((a: any) => a.status === 'pending').length ?? 0,
        revenueMtd: invoices
          ?.filter((i: any) => i.status === 'paid' && new Date(i.date).getMonth() === now.getMonth())
          .reduce((sum: number, i: any) => sum + Number(i.amount), 0) ?? 0,
        pipelineValue: deals?.reduce((sum: number, d: any) => sum + Number(d.value), 0) ?? 0,
        overdueInvoices: invoices?.filter((i: any) => i.status === 'overdue').length ?? 0,
        _workspaceId: wf,
      };
    },
  },
];
