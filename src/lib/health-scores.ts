import type {
  Client, Project, Task, Approval, Invoice, Retainer,
  HealthScore, ClientHealthScore, ProjectHealthScore, PortfolioHealth,
  HealthAlert, HealthDimension
} from '@/lib/types';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function avg(nums: number[]): number {
  if (!nums.length) return 100;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function computeProjectHealth(
  project: Project,
  tasks: Task[],
  approvals: Approval[],
  invoices: Invoice[]
): ProjectHealthScore {
  const today = new Date();
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projectApprovals = approvals.filter(a => a.project === project.name);
  const projectInvoices = invoices.filter(i => i.project === project.name);

  // Delivery dimension
  const completionRate = project.totalTasks > 0 ? (project.doneTasks / project.totalTasks) * 100 : 100;
  const daysUntilDue = (new Date(project.dueDate).getTime() - today.getTime()) / 86400000;
  const schedulePenalty = daysUntilDue < 0 ? Math.min(50, Math.abs(daysUntilDue) * 2) : 0;
  const overdueTasks = projectTasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < today).length;
  const delivery = clamp(completionRate - schedulePenalty - overdueTasks * 5);

  // Financial dimension
  const budgetVariance = project.budget > 0 ? ((project.budget - project.spent) / project.budget) * 100 : 100;
  const overdueInvoices = projectInvoices.filter(i => i.status === 'overdue').length;
  const financial = clamp(budgetVariance - overdueInvoices * 15);

  // Engagement dimension
  const pendingApprovals = projectApprovals.filter(a => a.status === 'pending').length;
  const approvalPenalty = pendingApprovals > 3 ? 30 : pendingApprovals * 8;
  const engagement = clamp(90 - approvalPenalty);

  // Risk dimension (inverted — higher = less risk)
  const riskFactors = (daysUntilDue < 0 ? 2 : 0) + (overdueTasks > 2 ? 1 : 0) + (overdueInvoices > 0 ? 1 : 0);
  const risk = clamp(100 - riskFactors * 20);

  const dimensions: Record<HealthDimension, number> = { delivery, financial, engagement, risk };
  const overall = clamp(avg([delivery, financial, engagement, risk]));

  const alerts: HealthAlert[] = [];
  if (daysUntilDue < 0)
    alerts.push({ id: `p-${project.id}-overdue`, severity: 'critical', message: `${project.name} is past its due date`, entityType: 'project', entityId: project.id, link: '/app/projects' });
  if (overdueTasks > 2)
    alerts.push({ id: `p-${project.id}-tasks`, severity: 'warning', message: `${overdueTasks} overdue tasks in ${project.name}`, entityType: 'project', entityId: project.id, link: '/app/tasks' });
  if (overdueInvoices > 0)
    alerts.push({ id: `p-${project.id}-inv`, severity: 'warning', message: `Overdue invoice on ${project.name}`, entityType: 'project', entityId: project.id, link: '/app/billing' });

  const trend: HealthScore['trend'] = overall >= 75 ? 'stable' : overall >= 50 ? 'down' : 'down';

  return {
    overall, dimensions, trend, alerts, lastUpdated: new Date().toISOString(),
    projectId: project.id, projectName: project.name, clientName: project.client,
  };
}

export function computeClientHealth(
  client: Client,
  projects: Project[],
  invoices: Invoice[],
  retainers: Retainer[]
): ClientHealthScore {
  const clientProjects = projects.filter(p => p.clientId === client.id && p.status === 'active');
  const clientInvoices = invoices.filter(i => i.clientId === client.id);
  const clientRetainers = retainers.filter(r => r.clientId === client.id);

  // Delivery: average project completion rate
  const completionRates = clientProjects.map(p =>
    p.totalTasks > 0 ? (p.doneTasks / p.totalTasks) * 100 : 100
  );
  const delivery = clamp(avg(completionRates));

  // Financial: invoice payment health
  const totalInvoices = clientInvoices.length;
  const overdueInvoices = clientInvoices.filter(i => i.status === 'overdue').length;
  const paidInvoices = clientInvoices.filter(i => i.status === 'paid').length;
  const paymentRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 100;
  const financial = clamp(paymentRate - overdueInvoices * 20);

  // Engagement: retainer usage
  const activeRetainer = clientRetainers.find(r => r.status === 'active');
  const retainerUsage = activeRetainer ? (activeRetainer.hoursUsed / activeRetainer.hoursIncluded) * 100 : 50;
  const engagement = clamp(100 - Math.abs(retainerUsage - 70)); // Ideal usage ~70%

  // Risk
  const riskFactors = (overdueInvoices > 0 ? 2 : 0) + (clientProjects.some(p => new Date(p.dueDate) < new Date()) ? 2 : 0);
  const risk = clamp(100 - riskFactors * 15);

  const dimensions: Record<HealthDimension, number> = { delivery, financial, engagement, risk };
  const overall = clamp(avg([delivery, financial, engagement, risk]));

  const alerts: HealthAlert[] = [];
  if (overdueInvoices > 0)
    alerts.push({ id: `c-${client.id}-inv`, severity: 'critical', message: `${client.company} has ${overdueInvoices} overdue invoice(s)`, entityType: 'client', entityId: client.id, link: '/app/billing' });
  if (clientProjects.some(p => new Date(p.dueDate) < new Date()))
    alerts.push({ id: `c-${client.id}-proj`, severity: 'warning', message: `${client.company} has overdue projects`, entityType: 'client', entityId: client.id, link: '/app/projects' });

  const trend: HealthScore['trend'] = overall >= 75 ? 'stable' : 'down';

  return {
    overall, dimensions, trend, alerts, lastUpdated: new Date().toISOString(),
    clientId: client.id, clientName: client.company,
  };
}

export function computePortfolioHealth(
  clients: Client[],
  projects: Project[],
  tasks: Task[],
  approvals: Approval[],
  invoices: Invoice[],
  retainers: Retainer[]
): PortfolioHealth {
  const clientScores = clients
    .filter(c => c.status === 'active' || c.status === 'onboarding')
    .map(c => computeClientHealth(c, projects, invoices, retainers));

  const projectScores = projects
    .filter(p => p.status === 'active')
    .map(p => computeProjectHealth(p, tasks, approvals, invoices));

  const overall = clamp(avg(clientScores.map(c => c.overall)));
  const allAlerts = [...clientScores.flatMap(c => c.alerts), ...projectScores.flatMap(p => p.alerts)];

  const healthy = clientScores.filter(c => c.overall >= 75).length;
  const atRisk = clientScores.filter(c => c.overall >= 50 && c.overall < 75).length;
  const critical = clientScores.filter(c => c.overall < 50).length;

  const prevOverall = overall - 3; // Simulated trend
  const trend: PortfolioHealth['trend'] = overall > prevOverall ? 'up' : overall < prevOverall ? 'down' : 'stable';

  return { overall, trend, clients: clientScores, projects: projectScores, summary: { healthy, atRisk, critical }, alerts: allAlerts };
}
