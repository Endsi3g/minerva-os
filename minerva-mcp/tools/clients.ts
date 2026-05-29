import { supabaseSelect, supabaseInsert, getWorkspaceId } from '../supabase-client.js';

export const clientsTools = [
  {
    name: 'list_clients',
    description: 'List all clients in Minerva OS with their status, contact, and monthly value.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['active', 'onboarding', 'inactive', 'lead'], description: 'Filter by status' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const params: Record<string, string> = { workspace_id: `eq.${workspaceId}`, order: 'company.asc' };
      if (args.status) params.status = `eq.${args.status}`;
      const clients = await supabaseSelect('clients', params) as any[];
      return { clients: clients ?? [], total: clients?.length ?? 0 };
    },
  },
  {
    name: 'create_client',
    description: 'Create a new client in Minerva OS.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        company: { type: 'string', description: 'Company name (required)' },
        contact: { type: 'string', description: 'Primary contact name' },
        email: { type: 'string', description: 'Contact email' },
        status: { type: 'string', enum: ['active', 'onboarding', 'inactive', 'lead'], default: 'onboarding' },
        monthlyValue: { type: 'number', description: 'Monthly retainer value in USD' },
      },
      required: ['company'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const record = await supabaseInsert('clients', {
        workspace_id: workspaceId,
        company: args.company,
        contact: args.contact ?? '',
        email: args.email ?? '',
        status: args.status ?? 'onboarding',
        monthly_value: args.monthlyValue ?? 0,
      }) as any;
      return { success: true, id: record?.id, company: args.company };
    },
  },
];
