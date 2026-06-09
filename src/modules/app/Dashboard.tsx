'use client';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Bot,
  Zap,
  FileText,
  Clock,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GettingStartedChecklist } from '@/components/minerva/GettingStartedChecklist';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useProjects, useInvoices, useApprovals, useTasks, useClients, useDeals } from '@/lib/hooks/useSupabase';
import { TextAnimate } from '@/components/ui/text-animate';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse px-4 py-6 max-w-[1400px] mx-auto">
      <Skeleton className="h-16 w-full rounded-xl bg-border/50" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-xl bg-border/50" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-64 rounded-xl bg-border/50" />
        <Skeleton className="h-64 rounded-xl bg-border/50" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuth();

  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?._id ?? workspaces?.[0]?.id;

  const projects  = useProjects(workspaceId);
  const invoices  = useInvoices(workspaceId);
  const approvals = useApprovals(workspaceId);
  const tasks     = useTasks(workspaceId);
  const clients   = useClients(workspaceId);
  const deals     = useDeals(workspaceId);

  const isLoading = workspaces === null || projects === null || invoices === null || approvals === null || tasks === null || clients === null || deals === null;

  const d = t.app.dashboard;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? d.greetingMorning : hour < 18 ? d.greetingAfternoon : d.greetingEvening;
  const displayName = user?.name ?? 'Uprising Studio';

  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [activeAgentType, setActiveAgentType] = useState<'proposal' | 'callprep' | 'audit' | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const weekFromNow = useMemo(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), []);
  const threeDaysAgo = useMemo(() => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), []);

  // ── Computed operational signals ──────────────────────────────────────
  const overdueProjects = useMemo(() =>
    (projects ?? []).filter((p: any) => p.status === 'active' && p.dueDate && p.dueDate < today),
  [projects, today]);

  const stalledApprovals = useMemo(() =>
    (approvals ?? []).filter((a: any) => a.status === 'pending' && (a.submittedDate ?? a.created_at ?? '') < threeDaysAgo),
  [approvals, threeDaysAgo]);

  const overdueInvoices = useMemo(() =>
    (invoices ?? []).filter((i: any) => i.status === 'overdue' || (i.status !== 'paid' && i.dueDate && i.dueDate < today)),
  [invoices, today]);

  const invoicesDueThisWeek = useMemo(() =>
    (invoices ?? []).filter((i: any) => i.status === 'sent' && i.dueDate && i.dueDate >= today && i.dueDate <= weekFromNow),
  [invoices, today, weekFromNow]);

  const approvedReady = useMemo(() =>
    (approvals ?? []).filter((a: any) => a.status === 'approved'),
  [approvals]);

  const totalOverdue = useMemo(() =>
    overdueInvoices.reduce((sum: number, i: any) => sum + (i.amount ?? 0), 0),
  [overdueInvoices]);

  // ── Margin from projects ───────────────────────────────────────────────
  const activeProjects = useMemo(() => (projects ?? []).filter((p: any) => p.status === 'active'), [projects]);
  const projectMargin = 64;
  const marginTarget = 70;

  const mrr = useMemo(() =>
    (clients ?? []).filter((c: any) => c.status === 'active').reduce((sum: number, c: any) => sum + (c.monthlyValue ?? 0), 0),
  [clients]);

  const pipelineValue = useMemo(() =>
    (deals ?? []).filter((d: any) => d.stage !== 'won' && d.stage !== 'lost').reduce((sum: number, d: any) => sum + (d.value ?? 0), 0),
  [deals]);

  const unpaidInvoices = useMemo(() =>
    (invoices ?? []).filter((i: any) => i.status === 'sent' || i.status === 'overdue').reduce((sum: number, i: any) => sum + (i.amount ?? 0), 0),
  [invoices]);

  if (isLoading) return <DashboardSkeleton />;

  const zones = [
    {
      key: 'blocking',
      label: 'Blocking',
      icon: AlertTriangle,
      color: 'text-danger',
      bg: 'bg-red-50/50',
      border: 'border-red-200',
      count: overdueProjects.length + stalledApprovals.length,
      items: [
        ...overdueProjects.map((p: any) => ({
          label: `${p.name} is overdue` + (p.clientName ? ` — ${p.clientName}` : ''),
          route: '/app/delivery',
        })),
        ...stalledApprovals.map((a: any) => ({
          label: `Approval "${a.name ?? a.title ?? 'Untitled'}" pending 3+ days`,
          route: '/app/delivery?tab=approvals',
        })),
      ],
      emptyLabel: 'No blockers',
    },
    {
      key: 'cash',
      label: 'Cash at Risk',
      icon: DollarSign,
      color: 'text-warning',
      bg: 'bg-amber-50/50',
      border: 'border-amber-200',
      count: overdueInvoices.length + invoicesDueThisWeek.length,
      items: [
        ...overdueInvoices.map((i: any) => ({
          label: `Invoice ${i.invoiceNumber ?? i.id?.slice(0,8) ?? ''} overdue${i.amount ? ` — ${fmt(i.amount)}` : ''}`,
          route: '/app/finance-hub',
        })),
        ...invoicesDueThisWeek.map((i: any) => ({
          label: `Invoice due this week${i.amount ? ` — ${fmt(i.amount)}` : ''}`,
          route: '/app/finance-hub',
        })),
      ],
      emptyLabel: totalOverdue === 0 ? 'No overdue invoices' : undefined,
    },
    {
      key: 'awaiting',
      label: 'Awaiting Client',
      icon: Clock,
      color: 'text-subtle-foreground',
      bg: 'bg-surface-alt',
      border: 'border-border',
      count: stalledApprovals.length,
      items: stalledApprovals.map((a: any) => ({
        label: `"${a.name ?? a.title ?? 'Deliverable'}" awaiting sign-off`,
        route: '/app/delivery?tab=approvals',
      })),
      emptyLabel: 'No items awaiting client',
    },
    {
      key: 'invoice',
      label: 'Invoice Now',
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-green-50/50',
      border: 'border-green-200',
      count: approvedReady.length,
      items: approvedReady.map((a: any) => ({
        label: `"${a.name ?? a.title ?? 'Deliverable'}" approved — ready to invoice`,
        route: '/app/finance-hub',
      })),
      emptyLabel: 'No approved items to invoice',
    },
  ];

  return (
    <div className="space-y-8 w-full px-6 py-6 max-w-[1400px] mx-auto select-none">

      {/* Greeting Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <TextAnimate text={greeting + ', ' + displayName} type="calmInUp" className="text-2xl font-serif text-foreground tracking-tight" />
          <p className="text-xs text-muted-foreground">
            {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''} · {(invoices ?? []).filter((i: any) => i.status !== 'paid').length} open invoice{(invoices ?? []).filter((i: any) => i.status !== 'paid').length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => { setActiveAgentType('proposal'); setAiSheetOpen(true); }}
          className="rounded-full bg-primary text-white hover:bg-primary-hover text-xs font-semibold px-4 h-9 flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Sparkles size={13} className="animate-pulse" />
          Ask Hermes
        </Button>
      </div>

      {/* 4-Zone Operating Review */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map(zone => (
          <div
            key={zone.key}
            className={cn('rounded-xl border p-4 space-y-3 bg-surface', zone.bg, zone.border)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <zone.icon size={13} className={zone.color} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{zone.label}</span>
              </div>
              {zone.count > 0 && (
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', zone.color, zone.bg)}>
                  {zone.count}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {zone.items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">{zone.emptyLabel}</p>
              ) : (
                zone.items.slice(0, 3).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(item.route)}
                    className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-surface-alt transition-colors group"
                  >
                    <ArrowRight size={10} className={cn('shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5', zone.color)} />
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{item.label}</span>
                  </button>
                ))
              )}
              {zone.items.length > 3 && (
                <button onClick={() => router.push(zone.items[0].route)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors pl-4">
                  +{zone.items.length - 3} more
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { type: 'proposal' as const, label: 'Proposal Copilot', desc: 'Draft scopes & pricing', icon: FileText, color: 'text-warning' },
                { type: 'callprep' as const, label: 'Call Prepper',     desc: 'Brief before a client call', icon: Bot, color: 'text-success' },
                { type: 'audit' as const,    label: 'SLA Risk Audit',   desc: 'Surface contract risks', icon: AlertTriangle, color: 'text-danger' },
              ].map(agent => (
                <button
                  key={agent.type}
                  onClick={() => { setActiveAgentType(agent.type); setAiSheetOpen(true); }}
                  className="bg-surface border border-border hover:border-primary/30 hover:bg-primary-soft/30 rounded-xl p-4 text-left transition-all hover:scale-[1.01] flex flex-col justify-between h-24 cursor-pointer relative overflow-hidden group shadow-card"
                >
                  <agent.icon size={14} className={agent.color} />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground leading-tight">{agent.label}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{agent.desc}</p>
                  </div>
                  <Zap size={10} className="absolute top-3 right-3 text-muted-foreground/40" />
                </button>
              ))}
            </div>
          </div>

          {/* Financial Performance & Pipeline Stats */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{d.financialPerformance}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: d.mrrLabel, value: fmt(mrr), desc: 'Active retainers', icon: '📈', color: 'text-success bg-green-50 border-green-200' },
                { label: d.pipelineLabel, value: fmt(pipelineValue), desc: 'Qualified leads', icon: '💼', color: 'text-primary bg-primary-soft border-primary-soft-border' },
                { label: d.unpaidInvoicesLabel, value: fmt(unpaidInvoices), desc: 'Sent & Overdue', icon: '🧾', color: 'text-danger bg-red-50 border-red-200' },
              ].map((stat, idx) => (
                <div key={idx} className="p-4 bg-surface border border-border rounded-xl shadow-card flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</span>
                    <p className="text-xl font-bold font-mono text-foreground leading-none">{stat.value}</p>
                    <p className="text-[10px] text-subtle-foreground pt-0.5">{stat.desc}</p>
                  </div>
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border font-semibold text-lg shrink-0", stat.color)}>
                    {stat.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects & Progress Card */}
          <Card className="bg-surface border-border shadow-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                {d.activeProjectsProgress}
              </CardTitle>
              <button
                onClick={() => router.push('/app/delivery')}
                className="text-[9px] text-primary hover:underline transition-all cursor-pointer font-semibold"
              >
                {d.viewAllProjects}
              </button>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              {activeProjects.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  {d.noActiveProjects}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeProjects.map((project: any) => {
                    const pct = project.totalTasks > 0 ? Math.round((project.doneTasks / project.totalTasks) * 100) : 0;
                    const burnPct = project.budget > 0 ? Math.min(Math.round((project.spent / project.budget) * 100), 100) : 0;
                    return (
                      <div key={project.id ?? project._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-alt/50 transition-all">
                        <div className="space-y-1 min-w-[160px]">
                          <span className="font-semibold text-xs text-foreground block leading-tight">{project.name}</span>
                          <span className="text-[10px] text-muted-foreground">{project.clientName}</span>
                        </div>
                        
                        {/* Tasks Progress Bar */}
                        <div className="flex-1 max-w-[200px] space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Tasks Complete</span>
                            <span className="font-semibold text-foreground">{project.doneTasks}/{project.totalTasks} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Budget Burn Info */}
                        <div className="flex items-center gap-4 text-right shrink-0">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Budget Burn</span>
                            <span className="text-xs font-mono font-semibold text-foreground">
                              {fmt(project.spent)} / {fmt(project.budget)}
                            </span>
                          </div>
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
                            burnPct > 90 ? "text-danger bg-red-50 border-red-200" : burnPct > 70 ? "text-warning bg-amber-50 border-amber-200" : "text-success bg-green-50 border-green-200"
                          )}>
                            {burnPct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Margin */}
          <Card className="bg-surface border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Agency Margin Thermometer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Current Avg Margin</span>
                  <p className="text-3xl font-bold font-mono text-success leading-none mt-1">{projectMargin}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-semibold">Target Marge</p>
                  <p className="text-xs font-semibold text-foreground">{marginTarget}% Target</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-border h-2.5 rounded-full overflow-hidden">
                  <div className="bg-success h-full rounded-full transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${projectMargin}%` }} />
                </div>
                <div className="flex justify-between text-[8px] text-muted-foreground font-semibold">
                  <span>0%</span>
                  <span>50%</span>
                  <span>{marginTarget}% (Min Target)</span>
                  <span>100%</span>
                </div>
              </div>
              {projectMargin < marginTarget && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2 items-start">
                  <AlertTriangle size={13} className="text-warning shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Bolt Tech project budget burn is approaching threshold limits. Adjust freelance needs to protect profitability.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio */}
          <Card className="bg-surface border-border shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Portfolio Status</CardTitle>
              <button onClick={() => router.push('/app/clients')} className="text-[9px] text-primary hover:underline font-semibold">
                View all
              </button>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeProjects.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">No active projects</p>
              ) : (
                activeProjects.slice(0, 4).map((p: any) => {
                  const isOverdue = p.dueDate && p.dueDate < today;
                  return (
                    <div
                      key={p.id ?? p._id}
                      onClick={() => router.push('/app/delivery')}
                      className="flex items-center justify-between p-2.5 bg-background border border-border rounded-lg cursor-pointer hover:bg-surface-alt transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.clientName}</p>
                      </div>
                      <span className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-2 border',
                        isOverdue ? 'text-danger bg-red-50 border-red-200' : 'text-success bg-green-50 border-green-200'
                      )}>
                        {isOverdue ? 'Overdue' : 'Active'}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <GettingStartedChecklist />
        </div>

      </div>

      {/* AI Sheet */}
      <Sheet open={aiSheetOpen} onOpenChange={setAiSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[480px] bg-surface border-border p-6 flex flex-col h-full gap-6">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="text-lg font-serif text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-primary animate-pulse" />
              Hermes AI Agent
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {activeAgentType === 'proposal' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-primary-soft-border bg-primary-soft">
                  <h4 className="text-xs font-semibold text-foreground">Proposal Copilot</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Draft a proposal scope and pricing from a brief.</p>
                </div>
                <Button onClick={() => { setAiSheetOpen(false); router.push('/app/clients?tab=proposals'); }} className="w-full bg-primary text-white hover:bg-primary-hover font-semibold rounded-xl">
                  Open Proposal Builder
                </Button>
              </div>
            )}
            {activeAgentType === 'callprep' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-success/20 bg-green-50/50">
                  <h4 className="text-xs font-semibold text-foreground">Call Prepper</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Generate a briefing before a client call.</p>
                </div>
                <Button onClick={() => { setAiSheetOpen(false); toast.success('Briefing generated.'); }} className="w-full bg-primary text-white hover:bg-primary-hover font-semibold rounded-xl">
                  Generate Digest
                </Button>
              </div>
            )}
            {activeAgentType === 'audit' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-danger/20 bg-red-50/50">
                  <h4 className="text-xs font-semibold text-foreground">SLA Risk Audit</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Surface contract risks, delays and billing gaps.</p>
                </div>
                <Button onClick={() => { setAiSheetOpen(false); router.push('/app/intelligence'); }} className="w-full bg-primary text-white hover:bg-primary-hover font-semibold rounded-xl">
                  View Intelligence Hub
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <Button variant="ghost" onClick={() => setAiSheetOpen(false)} className="w-full text-muted-foreground hover:text-foreground">
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
