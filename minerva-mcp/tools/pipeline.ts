import { supabaseSelect, supabaseInsert, supabasePatch, getWorkspaceId } from '../supabase-client.js';

export const pipelineTools = [
  {
    name: 'update_deal_stage',
    description: 'Move a pipeline deal to a new stage.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Deal UUID' },
        stage: { type: 'string', enum: ['new_lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], description: 'New stage' },
      },
      required: ['id', 'stage'],
    },
    async handler(args: Record<string, unknown>) {
      const updated = await supabasePatch('deals', { id: args.id as string }, { stage: args.stage });
      return { success: true, deal: updated };
    },
  },
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
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const deals = await supabaseSelect('deals', { workspace_id: `eq.${workspaceId}`, order: 'created_at.desc' }) as any[];
      const filtered = args.stage ? deals?.filter((d: any) => d.stage === args.stage) : deals;

      const byStage: Record<string, any[]> = {};
      for (const deal of (deals ?? [])) {
        if (!byStage[deal.stage]) byStage[deal.stage] = [];
        byStage[deal.stage].push(deal);
      }
      return { deals: filtered ?? [], byStage, totalValue: deals?.reduce((s: number, d: any) => s + Number(d.value), 0) ?? 0 };
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
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const record = await supabaseInsert('deals', {
        workspace_id: workspaceId,
        company: args.company,
        contact: args.contact ?? '',
        email: args.email ?? '',
        value: (args.value as number) ?? 0,
        stage: args.stage ?? 'new_lead',
        last_contact: new Date().toISOString(),
      }) as any;
      return { success: true, id: record?.id, company: args.company };
    },
  },
];
