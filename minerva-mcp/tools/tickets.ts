import { supabaseSelect, supabaseInsert, supabasePatch, getWorkspaceId } from '../supabase-client.js';

export const ticketsTools = [
  {
    name: 'list_tickets',
    description: 'List support tickets, optionally filtered by status or priority.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'], description: 'Filter by status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Filter by priority' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const params: Record<string, string> = { workspace_id: `eq.${workspaceId}`, order: 'created_at.desc' };
      if (args.status) params.status = `eq.${args.status}`;
      if (args.priority) params.priority = `eq.${args.priority}`;
      const tickets = await supabaseSelect('tickets', params) as any[];
      const openCount = tickets.filter((t: any) => t.status === 'open').length;
      return { tickets: tickets ?? [], total: tickets?.length ?? 0, openCount };
    },
  },
  {
    name: 'get_ticket_detail',
    description: 'Get full details for a single support ticket including its notes/activity.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Ticket UUID' },
      },
      required: ['id'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const tickets = await supabaseSelect('tickets', { id: `eq.${args.id}`, workspace_id: `eq.${workspaceId}`, limit: '1' }) as any[];
      const ticket = tickets[0];
      if (!ticket) return { error: 'Ticket not found.' };

      let client = null;
      if (ticket.client_id) {
        const clients = await supabaseSelect('clients', { id: `eq.${ticket.client_id}`, limit: '1' }) as any[];
        client = clients[0] ?? null;
      }

      return { ticket, client };
    },
  },
  {
    name: 'create_ticket',
    description: 'Create a new support ticket.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        subject: { type: 'string', description: 'Short summary of the issue (required)' },
        description: { type: 'string', description: 'Full description of the issue' },
        clientId: { type: 'string', description: 'Client UUID this ticket is linked to' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        category: { type: 'string', enum: ['Bug', 'Feature', 'Question', 'Billing', 'Other'], default: 'Question' },
      },
      required: ['subject'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const record = await supabaseInsert('tickets', {
        workspace_id: workspaceId,
        subject: args.subject,
        description: args.description ?? '',
        client_id: args.clientId ?? null,
        priority: args.priority ?? 'medium',
        category: args.category ?? 'Question',
        status: 'open',
      }) as any;
      return { success: true, id: record?.id, subject: args.subject };
    },
  },
  {
    name: 'update_ticket_status',
    description: 'Update the status of a support ticket.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Ticket UUID' },
        status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'], description: 'New status' },
      },
      required: ['id', 'status'],
    },
    async handler(args: Record<string, unknown>) {
      const updated = await supabasePatch('tickets', { id: args.id as string }, { status: args.status });
      return { success: true, ticket: updated };
    },
  },
];
