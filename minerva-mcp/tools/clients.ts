import { convexQuery, convexMutation } from '../convex-client.js';

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
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found.' };

      const clients = await convexQuery('clients:list', { workspaceId }) as any[];
      const filtered = args.status ? clients?.filter((c: any) => c.status === args.status) : clients;
      return { clients: filtered ?? [], total: filtered?.length ?? 0 };
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
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found.' };

      const id = await convexMutation('clients:add', {
        workspaceId,
        company: args.company,
        contact: args.contact ?? '',
        email: args.email ?? '',
        status: args.status ?? 'onboarding',
        ...(args.monthlyValue ? { monthlyValue: args.monthlyValue } : {}),
      });
      return { success: true, id, company: args.company };
    },
  },
];
