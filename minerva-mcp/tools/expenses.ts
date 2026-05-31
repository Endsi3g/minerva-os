import { supabaseSelect, supabaseInsert, supabasePatch, getWorkspaceId } from '../supabase-client.js';

export const expensesTools = [
  {
    name: 'list_expenses',
    description: 'List expense submissions, optionally filtered by status.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'], description: 'Filter by status' },
      },
      required: [],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const params: Record<string, string> = { workspace_id: `eq.${workspaceId}`, order: 'date.desc' };
      if (args.status) params.status = `eq.${args.status}`;
      const expenses = await supabaseSelect('expenses', params) as any[];
      const total = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
      const pendingTotal = expenses.filter((e: any) => e.status === 'pending').reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { expenses: expenses ?? [], total, pendingTotal };
    },
  },
  {
    name: 'create_expense',
    description: 'Submit a new expense for approval.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        amount: { type: 'number', description: 'Expense amount in USD (required)' },
        description: { type: 'string', description: 'What the expense is for (required)' },
        category: { type: 'string', enum: ['travel', 'meals', 'software', 'hardware', 'marketing', 'office', 'other'], default: 'other' },
        date: { type: 'string', description: 'Expense date in YYYY-MM-DD format (defaults to today)' },
      },
      required: ['amount', 'description'],
    },
    async handler(args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const record = await supabaseInsert('expenses', {
        workspace_id: workspaceId,
        amount: args.amount,
        description: args.description,
        category: args.category ?? 'other',
        date: args.date ?? new Date().toISOString().split('T')[0],
        status: 'pending',
      }) as any;
      return { success: true, id: record?.id };
    },
  },
  {
    name: 'update_expense_status',
    description: 'Approve or reject an expense submission.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Expense UUID' },
        status: { type: 'string', enum: ['approved', 'rejected'], description: 'New status' },
      },
      required: ['id', 'status'],
    },
    async handler(args: Record<string, unknown>) {
      const updated = await supabasePatch('expenses', { id: args.id as string }, { status: args.status });
      return { success: true, expense: updated };
    },
  },
];
