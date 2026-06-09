import { supabaseSelect, getWorkspaceId } from '../supabase-client.js';

export const dashboardTools = [
  {
    name: 'get_dashboard_metrics',
    description: 'Get the Minerva OS dashboard KPIs: active projects, open tasks, pending approvals, revenue month-to-date, and pipeline value.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    async handler(_args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found. Connect a live Supabase backend.' };

      const wf = `workspace_id=eq.${workspaceId}`;
      const [projects, tasks, approvals, invoices, deals] = await Promise.all([
        supabaseSelect('projects', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('tasks', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('approvals', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('invoices', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('deals', { workspace_id: `eq.${workspaceId}` }),
      ]) as [any[], any[], any[], any[], any[]];

      const now = new Date();
      return {
        activeProjects: projects?.filter((p: any) => p.status === 'active').length ?? 0,
        openTasks: tasks?.filter((t: any) => t.status !== 'done').length ?? 0,
        pendingApprovals: approvals?.filter((a: any) => a.status === 'pending').length ?? 0,
        revenueMtd: invoices
          ?.filter((i: any) => i.status === 'paid' && new Date(i.date).getMonth() === now.getMonth())
          .reduce((sum: number, i: any) => sum + Number(i.amount), 0) ?? 0,
        pipelineValue: deals?.reduce((sum: number, d: any) => sum + Number(d.value), 0) ?? 0,
        overdueInvoices: invoices?.filter((i: any) => i.status === 'overdue').length ?? 0,
        _workspaceId: wf,
      };
    },
  },
  {
    name: 'list_workspaces',
    description: 'List all consolidated workspaces configured in the agency database.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    async handler(_args: Record<string, unknown>) {
      const workspaces = await supabaseSelect('workspaces', { order: 'created_at.desc' });
      return { workspaces: workspaces ?? [], count: workspaces?.length ?? 0 };
    },
  },
  {
    name: 'get_cockpit_metrics',
    description: 'Get comprehensive Cockpit intelligence metrics: portfolio health overall score, alerts, on-time delivery rate, revenue month-to-date, and recent wins.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    async handler(_args: Record<string, unknown>) {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) return { error: 'No workspace found.' };

      const [clients, projects, tasks, approvals, invoices, retainers] = await Promise.all([
        supabaseSelect('clients', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('projects', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('tasks', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('approvals', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('invoices', { workspace_id: `eq.${workspaceId}` }),
        supabaseSelect('retainers', { workspace_id: `eq.${workspaceId}` }),
      ]) as [any[], any[], any[], any[], any[], any[]];

      const today = new Date();
      const thisMonth = today.toISOString().slice(0, 7); // YYYY-MM

      // 1. On-time delivery rate
      const doneTasks = tasks?.filter((t: any) => t.status === 'done') ?? [];
      const onTimeRate = doneTasks.length
        ? Math.round((doneTasks.filter((t: any) => new Date(t.due_date) >= today).length / doneTasks.length) * 100)
        : 100;

      // 2. Average approval age
      const pendingApprovalsList = approvals?.filter((a: any) => a.status === 'pending') ?? [];
      const avgApprovalDays = pendingApprovalsList.length
        ? Math.round(
            pendingApprovalsList.reduce(
              (sum: number, a: any) =>
                sum + Math.floor((today.getTime() - new Date(a.submitted_date).getTime()) / 86400000),
              0
            ) / pendingApprovalsList.length
          )
        : 0;

      // 3. Revenue paid this month
      const revenueThisMonth = invoices
        ?.filter((i: any) => i.status === 'paid' && i.paid_date?.startsWith(thisMonth))
        .reduce((sum: number, i: any) => sum + Number(i.amount), 0) ?? 0;

      // 4. Portfolio Health Score calculation
      const activeProjectsList = projects?.filter((p: any) => p.status === 'active') ?? [];
      const projectHealths = activeProjectsList.map((p: any) => {
        const projectTasks = tasks?.filter((t: any) => t.project_id === p.id) ?? [];
        const projectApprovals = approvals?.filter((a: any) => a.project_id === p.id) ?? [];
        const projectInvoices = invoices?.filter((i: any) => i.client_id === p.client_id) ?? [];

        // Delivery
        const totalTasks = projectTasks.length;
        const pDoneTasks = projectTasks.filter((t: any) => t.status === 'done').length;
        const completionRate = totalTasks > 0 ? (pDoneTasks / totalTasks) * 100 : 100;

        const daysUntilDue = (new Date(p.due_date).getTime() - today.getTime()) / 86400000;
        const schedulePenalty = daysUntilDue < 0 ? Math.min(50, Math.abs(daysUntilDue) * 2) : 0;
        const overdueTasksCount = projectTasks.filter((t: any) => t.status !== 'done' && new Date(t.due_date) < today).length;
        const delivery = Math.max(0, Math.min(100, Math.round(completionRate - schedulePenalty - overdueTasksCount * 5)));

        // Financial
        const overdueInvoicesCount = projectInvoices.filter((i: any) => i.status === 'overdue').length;
        const financial = Math.max(0, Math.min(100, 100 - overdueInvoicesCount * 15));

        // Engagement
        const pendingApprovalsCount = projectApprovals.filter((a: any) => a.status === 'pending').length;
        const engagement = Math.max(0, Math.min(100, 90 - (pendingApprovalsCount > 3 ? 30 : pendingApprovalsCount * 8)));

        // Risk
        const riskFactors = (daysUntilDue < 0 ? 2 : 0) + (overdueTasksCount > 2 ? 1 : 0) + (overdueInvoicesCount > 0 ? 1 : 0);
        const risk = Math.max(0, Math.min(100, 100 - riskFactors * 20));

        return (delivery + financial + engagement + risk) / 4;
      });

      const overallPortfolioHealth = projectHealths.length
        ? Math.round(projectHealths.reduce((sum: number, val: number) => sum + val, 0) / projectHealths.length)
        : 85; // Default healthy score

      // 5. Recent Wins (last 30 days)
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
      const recentWins: Array<{ type: string; name: string; date: string }> = [];
      invoices
        ?.filter((i: any) => i.status === 'paid' && i.paid_date && new Date(i.paid_date) >= thirtyDaysAgo)
        .slice(0, 3)
        .forEach((i: any) => recentWins.push({ type: 'invoice_paid', name: `INV-${i.invoice_number}`, date: i.paid_date }));
      projects
        ?.filter((p: any) => p.status === 'completed' && p.due_date && new Date(p.due_date) >= thirtyDaysAgo)
        .slice(0, 2)
        .forEach((p: any) => recentWins.push({ type: 'project_completed', name: p.name, date: p.due_date }));

      const sortedWins = recentWins.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      // 6. Active Alerts Count
      const alertsCount =
        activeProjectsList.filter((p: any) => new Date(p.due_date) < today).length +
        (invoices?.filter((i: any) => i.status === 'overdue').length ?? 0) +
        pendingApprovalsList.filter((a: any) => {
          const days = Math.floor((today.getTime() - new Date(a.submitted_date).getTime()) / 86400000);
          return days > 5;
        }).length;

      return {
        portfolioHealthScore: overallPortfolioHealth,
        onTimeDeliveryRate: onTimeRate,
        avgApprovalDays,
        pendingApprovalsCount: pendingApprovalsList.length,
        revenueThisMonth,
        recentWins: sortedWins,
        alertsCount,
      };
    },
  },
];
