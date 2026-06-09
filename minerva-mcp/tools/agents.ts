import { supabaseSelect, supabaseInsert, supabasePatch, getWorkspaceId } from '../supabase-client.js';

export const agentsTools = [
  {
    name: 'list_agents',
    description: 'List all custom AI agents configured in the workspace.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    async handler(_args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const agents = await supabaseSelect('agents', { workspace_id: `eq.${workspaceId}` });
      return { agents: agents ?? [], count: agents?.length ?? 0 };
    },
  },
  {
    name: 'update_agent_instructions',
    description: 'Update the system instructions / prompt for a custom AI agent.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agentId: { type: 'string', description: 'The UUID of the agent to update (required)' },
        instructions: { type: 'string', description: 'The new system instructions for the agent (required)' },
      },
      required: ['agentId', 'instructions'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const agentId = args.agentId as string;
      const instructions = args.instructions as string;

      // Update instructions
      const updated = await supabasePatch(
        'agents',
        { id: agentId, workspace_id: workspaceId },
        { instructions, updated_at: new Date().toISOString() }
      );

      // Fetch agent info to log in audit
      const agentRows = await supabaseSelect('agents', { id: `eq.${agentId}`, workspace_id: `eq.${workspaceId}` });
      const agentName = (agentRows?.[0] as any)?.name ?? 'Unknown Agent';

      // Log to agent_audit
      await supabaseInsert('agent_audit', {
        workspace_id: workspaceId,
        agent_id: agentId,
        action: 'update_agent_instructions',
        details: { agent_name: agentName, version: 'mcp_prompt_update' },
        timestamp: new Date().toISOString()
      });

      return { success: true, agentId, name: agentName, updated };
    },
  },
  {
    name: 'get_agent_audit_logs',
    description: 'Get recent execution and decision audit logs for the AI agents.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Number of logs to return (default: 20)' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const limit = args.limit as number ?? 20;

      const logs = await supabaseSelect('agent_audit', {
        workspace_id: `eq.${workspaceId}`,
        order: 'timestamp.desc',
        limit: String(limit),
      });

      return { logs: logs ?? [] };
    },
  },
];
