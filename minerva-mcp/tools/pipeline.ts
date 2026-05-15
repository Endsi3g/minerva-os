import { convexQuery, convexMutation } from '../convex-client.js';

export const pipelineTools = [
  {
    name: 'list_deals',
    description: 'List all pipeline deals grouped by stage (new_lead, qualified, proposal, negotiation, won, lost).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        stage: { type: 'string', enum: ['new_lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], description: 'Filter by stage' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found.' };

      const deals = await convexQuery('deals:list', { workspaceId }) as any[];
      const filtered = args.stage ? deals?.filter((d: any) => d.stage === args.stage) : deals;

      const byStage: Record<string, any[]> = {};
      for (const deal of (deals ?? [])) {
        if (!byStage[deal.stage]) byStage[deal.stage] = [];
        byStage[deal.stage].push(deal);
      }
      return { deals: filtered ?? [], byStage, totalValue: deals?.reduce((s: number, d: any) => s + d.value, 0) ?? 0 };
    },
  },
  {
    name: 'create_deal',
    description: 'Create a new pipeline deal.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        company: { type: 'string', description: 'Company / prospect name (required)' },
        contact: { type: 'string', description: 'Contact name' },
        email: { type: 'string', description: 'Contact email' },
        value: { type: 'number', description: 'Deal value in USD' },
        stage: { type: 'string', enum: ['new_lead', 'qualified', 'proposal', 'negotiation'], default: 'new_lead' },
      },
      required: ['company'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found.' };

      const id = await convexMutation('deals:add', {
        workspaceId,
        company: args.company,
        contact: args.contact ?? '',
        email: args.email ?? '',
        value: (args.value as number) ?? 0,
        stage: args.stage ?? 'new_lead',
      });
      return { success: true, id, company: args.company };
    },
  },
];
