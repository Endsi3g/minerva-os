import { convexQuery } from '../convex-client.js';

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
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found. Connect to a live Convex backend.' };

      const [projects, tasks, approvals, invoices, deals] = await Promise.all([
        convexQuery('projects:list', { workspaceId }),
        convexQuery('tasks:get', { workspaceId }),
        convexQuery('approvals:list', {}),
        convexQuery('invoices:list', { workspaceId }),
        convexQuery('deals:list', { workspaceId }),
      ]) as [any[], any[], any[], any[], any[]];

      const now = new Date();
      return {
        activeProjects: projects?.filter((p: any) => p.status === 'active').length ?? 0,
        openTasks: tasks?.filter((t: any) => t.status !== 'done').length ?? 0,
        pendingApprovals: approvals?.filter((a: any) => a.status === 'pending').length ?? 0,
        revenueMtd: invoices
          ?.filter((i: any) => i.status === 'paid' && new Date(i.date).getMonth() === now.getMonth())
          .reduce((sum: number, i: any) => sum + i.amount, 0) ?? 0,
        pipelineValue: deals?.reduce((sum: number, d: any) => sum + d.value, 0) ?? 0,
        overdueInvoices: invoices?.filter((i: any) => i.status === 'overdue').length ?? 0,
      };
    },
  },
];
