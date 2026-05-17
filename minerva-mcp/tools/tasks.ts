import { convexQuery, convexMutation } from '../convex-client.js';

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
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found.' };

      const tasks = await convexQuery('tasks:get', { workspaceId }) as any[];
      let filtered = tasks ?? [];
      if (args.status) filtered = filtered.filter((t: any) => t.status === args.status);
      if (args.priority) filtered = filtered.filter((t: any) => t.priority === args.priority);
      return { tasks: filtered, total: filtered.length };
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
        dueDate: { type: 'string', description: 'Due date ISO string' },
      },
      required: ['title'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found.' };

      const now = new Date();
      const dueDate = args.dueDate as string ?? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const id = await convexMutation('tasks:add', {
        workspaceId,
        title: args.title,
        ...(args.projectId ? { projectId: args.projectId } : {}),
        ...(args.assignee ? { assignee: args.assignee } : {}),
        priority: args.priority ?? 'medium',
        dueDate,
        status: 'todo',
      });
      return { success: true, id, title: args.title };
    },
  },
];
