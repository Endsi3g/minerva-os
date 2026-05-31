import { supabaseSelect, supabasePatch, getWorkspaceId } from '../supabase-client.js';

export const approvalsTools = [
  {
    name: 'list_approvals',
    description: 'List approval requests (deliverables awaiting client sign-off), optionally filtered by status.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'revisions_requested', 'rejected'], description: 'Filter by status' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const params: Record<string, string> = { workspace_id: `eq.${workspaceId}`, order: 'created_at.desc' };
      if (args.status) params.status = `eq.${args.status}`;
      const approvals = await supabaseSelect('approvals', params) as any[];
      const pendingCount = approvals.filter((a: any) => a.status === 'pending').length;
      return { approvals: approvals ?? [], total: approvals?.length ?? 0, pendingCount };
    },
  },
  {
    name: 'update_approval_status',
    description: 'Approve, reject, or request revisions on a deliverable.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Approval UUID' },
        status: { type: 'string', enum: ['approved', 'revisions_requested', 'rejected'], description: 'New status' },
        feedback: { type: 'string', description: 'Optional feedback or revision notes' },
      },
      required: ['id', 'status'],
    },
    async handler(args: Record<string, unknown>) {
      const updates: Record<string, unknown> = { status: args.status };
      if (args.feedback) updates.feedback = args.feedback;
      const updated = await supabasePatch('approvals', { id: args.id as string }, updates);
      return { success: true, approval: updated };
    },
  },
];
