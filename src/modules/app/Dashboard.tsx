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
import { useWorkspaces, useProjects, useInvoices, useApprovals, useTasks } from '@/lib/hooks/useSupabase';
import { TextAnimate } from '@/components/ui/text-animate';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse px-4 py-6 max-w-[1400px] mx-auto">
      <Skeleton className="h-16 w-full rounded-xl bg-secondary/60" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-xl bg-secondary/60" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-64 rounded-xl bg-secondary/60" />
        <Skeleton className="h-64 rounded-xl bg-secondary/60" />
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

  const isLoading = workspaces === null || projects === null || invoices === null || approvals === null || tasks === null;

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

  if (isLoading) return <DashboardSkeleton />;

  const zones = [
    {
      key: 'blocking',
      label: 'Blocking',
      icon: AlertTriangle,
      color: 'text-rose',
      bg: 'bg-rose/5',
      border: 'border-rose/15',
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
      color: 'text-amber',
      bg: 'bg-amber/5',
      border: 'border-amber/15',
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
      color: 'text-silver',
      bg: 'bg-silver/5',
      border: 'border-silver/15',
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
      color: 'text-sage',
      bg: 'bg-sage/5',
      border: 'border-sage/15',
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
          <TextAnimate text={greeting + ', ' + displayName} type="calmInUp" className="text-2xl font-serif text-ivory tracking-tight" />
          <p className="text-xs text-fog">
            {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''} · {(invoices ?? []).filter((i: any) => i.status !== 'paid').length} open invoice{(invoices ?? []).filter((i: any) => i.status !== 'paid').length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => { setActiveAgentType('proposal'); setAiSheetOpen(true); }}
          className="rounded-full bg-ivory text-obsidian hover:bg-ivory/90 text-xs font-semibold px-4 h-9 flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Sparkles size={13} className="text-emerald-600 animate-pulse" />
          Ask Hermes
        </Button>
      </div>

      {/* 4-Zone Operating Review */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map(zone => (
          <div
            key={zone.key}
            className={cn('rounded-xl border p-4 space-y-3', zone.bg, zone.border)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <zone.icon size={13} className={zone.color} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fog">{zone.label}</span>
              </div>
              {zone.count > 0 && (
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', zone.color, zone.bg)}>
                  {zone.count}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {zone.items.length === 0 ? (
                <p className="text-[11px] text-fog italic">{zone.emptyLabel}</p>
              ) : (
                zone.items.slice(0, 3).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(item.route)}
                    className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-white/4 transition-colors group"
                  >
                    <ArrowRight size={10} className={cn('shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5', zone.color)} />
                    <span className="text-[11px] text-silver group-hover:text-ivory transition-colors leading-tight">{item.label}</span>
                  </button>
                ))
              )}
              {zone.items.length > 3 && (
                <button onClick={() => router.push(zone.items[0].route)} className="text-[10px] text-fog hover:text-silver transition-colors pl-4">
                  +{zone.items.length - 3} more
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* AI Agent Shortcuts */}
        <div className="lg:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-fog mb-3">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { type: 'proposal' as const, label: 'Proposal Copilot', desc: 'Draft scopes & pricing', icon: FileText, color: 'text-amber' },
              { type: 'callprep' as const, label: 'Call Prepper',     desc: 'Brief before a client call', icon: Bot, color: 'text-sage' },
              { type: 'audit' as const,    label: 'SLA Risk Audit',   desc: 'Surface contract risks', icon: AlertTriangle, color: 'text-rose' },
            ].map(agent => (
              <button
                key={agent.type}
                onClick={() => { setActiveAgentType(agent.type); setAiSheetOpen(true); }}
                className="bg-midnight border border-border hover:border-white/12 rounded-xl p-4 text-left transition-all hover:scale-[1.01] flex flex-col justify-between h-24 cursor-pointer relative overflow-hidden group shadow-sm"
              >
                <agent.icon size={14} className={agent.color} />
                <div>
                  <h4 className="text-xs font-semibold text-ivory leading-tight">{agent.label}</h4>
                  <p className="text-[10px] text-fog mt-0.5">{agent.desc}</p>
                </div>
                <Zap size={10} className="absolute top-3 right-3 text-fog/40" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Margin + Portfolio */}
        <div className="space-y-4">
          {/* Margin */}
          <Card className="bg-midnight border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-fog">Agency Margin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold font-mono text-sage leading-none">{projectMargin}%</p>
                <p className="text-[10px] text-fog">{marginTarget}% target</p>
              </div>
              <div className="w-full bg-secondary/60 h-2 rounded-full overflow-hidden">
                <div className="bg-sage h-full rounded-full transition-all duration-700" style={{ width: `${projectMargin}%` }} />
              </div>
              {projectMargin < marginTarget && (
                <div className="flex items-start gap-1.5 text-[10px] text-amber">
                  <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                  <span>Below target — review budget burn</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio */}
          <Card className="bg-midnight border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-fog">Portfolio</CardTitle>
              <button onClick={() => router.push('/app/clients')} className="text-[9px] text-sage hover:underline font-semibold">
                View all
              </button>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeProjects.length === 0 ? (
                <p className="text-[11px] text-fog italic">No active projects</p>
              ) : (
                activeProjects.slice(0, 4).map((p: any) => {
                  const isOverdue = p.dueDate && p.dueDate < today;
                  return (
                    <div
                      key={p._id}
                      onClick={() => router.push('/app/delivery')}
                      className="flex items-center justify-between p-2 bg-white/2 border border-border rounded-lg cursor-pointer hover:bg-white/4 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ivory truncate">{p.name}</p>
                        <p className="text-[10px] text-fog truncate">{p.clientName}</p>
                      </div>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-2', isOverdue ? 'text-rose bg-rose/10' : 'text-sage bg-sage/10')}>
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
        <SheetContent side="right" className="w-full sm:w-[480px] bg-midnight border-border p-6 flex flex-col h-full gap-6">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="text-lg font-serif text-ivory flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-600 animate-pulse" />
              Hermes AI Agent
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {activeAgentType === 'proposal' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-amber/20 bg-amber/5">
                  <h4 className="text-xs font-semibold text-ivory">Proposal Copilot</h4>
                  <p className="text-[11px] text-silver mt-1 leading-relaxed">Draft a proposal scope and pricing from a brief.</p>
                </div>
                <Button onClick={() => { setAiSheetOpen(false); router.push('/app/clients?tab=proposals'); }} className="w-full bg-ivory text-obsidian hover:bg-ivory/90 font-semibold rounded-xl">
                  Open Proposal Builder
                </Button>
              </div>
            )}
            {activeAgentType === 'callprep' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-sage/20 bg-sage/5">
                  <h4 className="text-xs font-semibold text-ivory">Call Prepper</h4>
                  <p className="text-[11px] text-silver mt-1 leading-relaxed">Generate a briefing before a client call.</p>
                </div>
                <Button onClick={() => { setAiSheetOpen(false); toast.success('Briefing generated.'); }} className="w-full bg-ivory text-obsidian hover:bg-ivory/90 font-semibold rounded-xl">
                  Generate Digest
                </Button>
              </div>
            )}
            {activeAgentType === 'audit' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-rose/20 bg-rose/5">
                  <h4 className="text-xs font-semibold text-ivory">SLA Risk Audit</h4>
                  <p className="text-[11px] text-silver mt-1 leading-relaxed">Surface contract risks, delays and billing gaps.</p>
                </div>
                <Button onClick={() => { setAiSheetOpen(false); router.push('/app/intelligence'); }} className="w-full bg-ivory text-obsidian hover:bg-ivory/90 font-semibold rounded-xl">
                  View Intelligence Hub
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <Button variant="ghost" onClick={() => setAiSheetOpen(false)} className="w-full text-fog hover:text-silver">
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
