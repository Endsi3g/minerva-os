import { supabaseSelect, supabaseInsert, getWorkspaceId } from '../supabase-client.js';

export const tasksTools = [
  {
    name: 'list_tasks',
    description: 'List tasks, optionally filtered by status or priority.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'], description: 'Filter by status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Filter by priority' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const params: Record<string, string> = { workspace_id: `eq.${workspaceId}`, order: 'due_date.asc' };
      if (args.status) params.status = `eq.${args.status}`;
      if (args.priority) params.priority = `eq.${args.priority}`;
      const tasks = await supabaseSelect('tasks', params) as any[];
      return { tasks: tasks ?? [], total: tasks?.length ?? 0 };
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Task title (required)' },
        projectId: { type: 'string', description: 'Project ID' },
        assignee: { type: 'string', description: 'Assignee name or email' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        dueDate: { type: 'string', description: 'Due date ISO string (YYYY-MM-DD)' },
      },
      required: ['title'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const now = new Date();
      const dueDate = args.dueDate as string ?? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const record = await supabaseInsert('tasks', {
        workspace_id: workspaceId,
        title: args.title,
        project_id: args.projectId ?? null,
        assignee: args.assignee ?? '',
        priority: args.priority ?? 'medium',
        due_date: dueDate,
        status: 'todo',
      }) as any;
      return { success: true, id: record?.id, title: args.title };
    },
  },
];
