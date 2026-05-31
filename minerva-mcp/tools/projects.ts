import { supabaseSelect, supabaseInsert, getWorkspaceId } from '../supabase-client.js';

export const projectsTools = [
  {
    name: 'get_project_detail',
    description: 'Get full details for a single project including its tasks and milestones.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Project UUID' },
      },
      required: ['id'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const projects = await supabaseSelect('projects', { id: `eq.${args.id}`, workspace_id: `eq.${workspaceId}`, limit: '1' }) as any[];
      const project = projects[0];
      if (!project) return { error: 'Project not found.' };

      const [tasks, milestones] = await Promise.all([
        supabaseSelect('tasks', { project_id: `eq.${args.id}`, order: 'created_at.asc' }),
        supabaseSelect('milestones', { project_id: `eq.${args.id}`, order: 'due_date.asc' }),
      ]);

      return { project, tasks, milestones };
    },
  },
  {
    name: 'list_projects',
    description: 'List all projects with health score, status, and due dates.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['active', 'completed', 'on_hold'], description: 'Filter by status' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const params: Record<string, string> = { workspace_id: `eq.${workspaceId}`, order: 'due_date.asc' };
      if (args.status) params.status = `eq.${args.status}`;
      const projects = await supabaseSelect('projects', params) as any[];
      return { projects: projects ?? [], total: projects?.length ?? 0 };
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project in Minerva OS.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Project name (required)' },
        clientName: { type: 'string', description: 'Client name for this project' },
        dueDate: { type: 'string', description: 'Due date in ISO format (YYYY-MM-DD)' },
        budget: { type: 'number', description: 'Project budget in USD' },
        description: { type: 'string', description: 'Project description' },
      },
      required: ['name'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const now = new Date();
      const dueDate = args.dueDate as string ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const record = await supabaseInsert('projects', {
        workspace_id: workspaceId,
        name: args.name,
        client_name: args.clientName ?? '',
        due_date: dueDate,
        budget: args.budget ?? 0,
        description: args.description ?? '',
        status: 'active',
      }) as any;
      return { success: true, id: record?.id, name: args.name };
    },
  },
];
