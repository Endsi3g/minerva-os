import { supabaseSelect, getWorkspaceId } from '../supabase-client.js';

export const billingTools = [
  {
    name: 'list_invoices',
    description: 'List invoices with amounts, statuses, and due dates.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['draft', 'pending', 'overdue', 'paid'], description: 'Filter by status' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const params: Record<string, string> = { workspace_id: `eq.${workspaceId}`, order: 'date.desc' };
      if (args.status) params.status = `eq.${args.status}`;
      const invoices = await supabaseSelect('invoices', params) as any[];
      const total = invoices?.reduce((s: number, i: any) => s + Number(i.amount), 0) ?? 0;
      return { invoices: invoices ?? [], total, count: invoices?.length ?? 0 };
    },
  },
  {
    name: 'get_billing_summary',
    description: 'Get billing summary: outstanding, overdue, collected MTD, active retainers.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] },
    async handler(_args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const [invoices, retainers] = await Promise.all([
        supabaseSelect('invoices', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('retainers', { workspace_id: `eq.${workspaceId}` }),
      ]) as [any[], any[]];

      const now = new Date();
      return {
        outstanding: invoices?.filter((i: any) => ['pending', 'overdue'].includes(i.status)).reduce((s: number, i: any) => s + Number(i.amount), 0) ?? 0,
        overdue: invoices?.filter((i: any) => i.status === 'overdue').length ?? 0,
        collectedMtd: invoices?.filter((i: any) => i.status === 'paid' && new Date(i.date).getMonth() === now.getMonth()).reduce((s: number, i: any) => s + Number(i.amount), 0) ?? 0,
        activeRetainers: retainers?.filter((r: any) => r.status === 'active').length ?? 0,
      };
    },
  },
];
