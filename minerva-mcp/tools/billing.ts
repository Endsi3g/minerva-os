import { convexQuery } from '../convex-client.js';

export const billingTools = [
  {
    name: 'list_invoices',
    description: 'List invoices with amounts, statuses, and due dates.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['draft', 'sent', 'overdue', 'paid', 'cancelled'], description: 'Filter by status' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found.' };

      const invoices = await convexQuery('invoices:list', { workspaceId }) as any[];
      const filtered = args.status ? invoices?.filter((i: any) => i.status === args.status) : invoices;
      const total = filtered?.reduce((s: number, i: any) => s + i.amount, 0) ?? 0;
      return { invoices: filtered ?? [], total, count: filtered?.length ?? 0 };
    },
  },
  {
    name: 'get_billing_summary',
    description: 'Get billing summary: outstanding, overdue, collected MTD, active retainers.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] },
    async handler(_args: Record<string, unknown>) {
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found.' };

      const [invoices, retainers] = await Promise.all([
        convexQuery('invoices:list', { workspaceId }),
        convexQuery('retainers:list', { workspaceId }),
      ]) as [any[], any[]];

      const now = new Date();
      return {
        outstanding: invoices?.filter((i: any) => ['sent', 'overdue'].includes(i.status)).reduce((s: number, i: any) => s + i.amount, 0) ?? 0,
        overdue: invoices?.filter((i: any) => i.status === 'overdue').length ?? 0,
        collectedMtd: invoices?.filter((i: any) => i.status === 'paid' && new Date(i.date).getMonth() === now.getMonth()).reduce((s: number, i: any) => s + i.amount, 0) ?? 0,
        activeRetainers: retainers?.filter((r: any) => r.status === 'active').length ?? 0,
      };
    },
  },
];
