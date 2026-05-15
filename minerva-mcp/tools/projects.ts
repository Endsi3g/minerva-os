import { convexQuery, convexMutation } from '../convex-client.js';

export const projectsTools = [
  {
    name: 'list_projects',
    description: 'List all projects with health score, status, and due dates.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['active', 'completed', 'on_hold', 'cancelled'], description: 'Filter by status' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found.' };

      const projects = await convexQuery('projects:list', { workspaceId }) as any[];
      const filtered = args.status ? projects?.filter((p: any) => p.status === args.status) : projects;
      return { projects: filtered ?? [], total: filtered?.length ?? 0 };
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project in Minerva OS.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Project name (required)' },
        clientId: { type: 'string', description: 'Client ID to associate the project with' },
        dueDate: { type: 'string', description: 'Due date in ISO format (YYYY-MM-DD)' },
        budget: { type: 'number', description: 'Project budget in USD' },
        description: { type: 'string', description: 'Project description' },
      },
      required: ['name'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaces = await convexQuery('workspaces:list', {}) as any[];
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) return { error: 'No workspace found.' };

      const now = new Date();
      const dueDate = args.dueDate as string ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const id = await convexMutation('projects:create', {
        workspaceId,
        name: args.name,
        ...(args.clientId ? { clientId: args.clientId } : {}),
        dueDate,
        ...(args.budget ? { budget: args.budget } : {}),
        ...(args.description ? { description: args.description } : {}),
        status: 'active',
      });
      return { success: true, id, name: args.name };
    },
  },
];
