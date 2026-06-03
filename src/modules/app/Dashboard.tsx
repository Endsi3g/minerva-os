'use client';
import { useRouter } from 'next/navigation';
import { FolderKanban, CheckSquare, ClipboardCheck, DollarSign, AlertTriangle, X, ChevronRight, Flame, RefreshCw, Sparkles, Loader2, GitPullRequest } from 'lucide-react';
import { GettingStartedChecklist } from '@/components/minerva/GettingStartedChecklist';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useProjects, useInvoices, useApprovals, useDeals, useTasks, useActivity, useWorkflowRuns, useHandoffs } from '@/lib/hooks/useSupabase';
import { AgentSuggestions } from '@/components/agents/AgentSuggestions';
import { motion } from 'motion/react';
import type { Translations } from '@/i18n';
import { ShiftCard } from '@/components/ui/shift-card';
import { Expandable, ExpandableTrigger, ExpandableContent } from '@/components/ui/expandable';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { TextAnimate } from '@/components/ui/text-animate';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';

/* ── Risk flag computation ───────────────────────────────────────────────── */

interface RiskFlag {
  id: string;
  message: string;
  link: string;
  severity: 'high' | 'medium';
}

function computeRiskFlags(t: Translations, data: { projects: any[], invoices: any[], approvals: any[], deals: any[] }): RiskFlag[] {
  const today = new Date();
  const flags: RiskFlag[] = [];
  const r = t.app.common.risks;

  data.projects.forEach(p => {
    if (p.status === 'active' && new Date(p.dueDate) < today) {
      flags.push({
        id: `proj-${p._id}`,
        message: r.pastDue.replace('{{name}}', p.name),
        link: '/app/projects',
        severity: 'high',
      });
    }
  });

  const overdueInvoices = data.invoices.filter(i => i.status === 'overdue');
  if (overdueInvoices.length > 0) {
    flags.push({
      id: 'invoices-overdue',
      message: (overdueInvoices.length > 1 ? r.invoicesOverduePlural : r.invoicesOverdue)
        .replace('{{count}}', String(overdueInvoices.length)),
      link: '/app/billing',
      severity: 'high',
    });
  }

  data.approvals.forEach(a => {
    if (a.status === 'pending') {
      const days = Math.floor((today.getTime() - new Date(a.submittedDate).getTime()) / (1000 * 60 * 60 * 24));
      if (days > 5) {
        flags.push({
          id: `approval-${a._id}`,
          message: r.pendingLong.replace('{{name}}', a.name).replace('{{days}}', String(days)),
          link: '/app/approvals',
          severity: 'medium',
        });
      }
    }
  });

  data.deals.forEach(l => {
    if (!['won', 'lost'].includes(l.stage)) {
      const daysInStage = Math.floor((today.getTime() - new Date(l.lastContact).getTime()) / (1000 * 60 * 60 * 24));
      if (daysInStage > 14) {
        flags.push({
          id: `lead-${l._id}`,
          message: r.staleLead
            .replace('{{company}}', l.company)
            .replace('{{stage}}', t.app.pipeline.stages[l.stage as keyof typeof t.app.pipeline.stages] || l.stage)
            .replace('{{days}}', String(daysInStage)),
          link: '/app/pipeline',
          severity: 'medium',
        });
      }
    }
  });

  return flags;
}

/* ── Activity Feed ────────────────────────────────────────────────────────── */

function ActivityFeed({ emptyLabel, workspaceId }: { emptyLabel: string, workspaceId: any }) {
  const activity = useActivity(workspaceId);

  if (activity === null) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-7 w-7 rounded-full shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <p className="text-center text-xs text-fog pt-4">{emptyLabel}</p>
    );
  }

  return (
    <div className="space-y-4">
      {activity.map((a: any) => (
        <div key={a._id} className="flex items-start gap-3">
          <div className="h-7 w-7 rounded-full bg-dusk border border-white/5 flex items-center justify-center shrink-0 text-[10px] text-silver font-medium mt-0.5">
            {a.user[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-silver leading-relaxed">
              <span className="font-medium text-ivory">{a.user}</span> {a.action} <span className="font-medium text-ivory">{a.targetName}</span>
            </p>
            <p className="text-[10px] text-fog mt-0.5">
              {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── AI Daily Briefing ────────────────────────────────────────────────────── */

function DailyBriefing({ context, labels }: {
  context: string;
  labels: { title: string; loading: string; error: string; refresh: string };
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(false);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Generate a concise daily briefing for this agency workspace. Highlight the top 3 priorities for today, any risks, and one positive trend. Be direct and actionable.' }],
          context,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setContent(data.content);
    } catch {
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    if (context) load();
  }, [context, load]);

  return (
    <Expandable expanded={expanded} onToggle={() => setExpanded(!expanded)}>
      <div
        className="rounded-md p-4 border border-border relative group overflow-hidden transition-all duration-300 bg-card shadow-none"
      >
        <TextureOverlay texture="dots" opacity={0.12} />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <ExpandableTrigger className="flex items-center gap-2 flex-1 text-left focus:outline-none select-none">
            <Sparkles size={13} className="text-sage" />
            <span className="text-xs font-medium text-sage uppercase tracking-widest">{labels.title}</span>
            <span className="text-[9px] text-fog lowercase bg-sage/5 border border-sage/10 px-1.5 py-0.5 rounded-full ml-2">
              {expanded ? 'Click to collapse' : 'Click to expand'}
            </span>
          </ExpandableTrigger>
          <button
            onClick={(e) => {
              e.stopPropagation();
              load();
            }}
            disabled={loading}
            className="text-fog hover:text-silver transition-colors relative z-20"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="relative z-10">
          {loading && !content && (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
              <p className="text-[11px] text-fog mt-2">{labels.loading}</p>
            </div>
          )}
          {err && !loading && (
            <p className="text-[11px] text-fog">{labels.error}</p>
          )}
          {content && !loading && (
            <>
              {/* Collapsed view snippet */}
              {!expanded && (
                <ExpandableTrigger className="text-left w-full focus:outline-none">
                  <p className="text-xs text-silver leading-relaxed line-clamp-2 cursor-pointer hover:text-ivory transition-colors">
                    {content}
                  </p>
                </ExpandableTrigger>
              )}

              {/* Expanded full details */}
              <ExpandableContent preset="fade">
                <p className="text-xs text-silver leading-relaxed whitespace-pre-wrap mt-2 border-t border-white/5 pt-3">
                  {content}
                </p>
              </ExpandableContent>
            </>
          )}
        </div>
      </div>
    </Expandable>
  );
}

/* ── Firefighter View ─────────────────────────────────────────────────────── */

interface AuditFinding {
  title: string;
  description: string;
  severity: 'high' | 'medium';
  impact: string;
}

interface AuditResult {
  healthScore: number;
  findings: AuditFinding[];
  recommendations: string;
}

function FirefighterView({ flags, dismissed, onDismiss, onNavigate, labels, workspaceId }: {
  flags: RiskFlag[];
  dismissed: string[];
  onDismiss: (id: string) => void;
  onNavigate: (link: string) => void;
  labels: { allClear: string; allClearSub: string };
  workspaceId: string;
}) {
  const active = flags.filter(f => !dismissed.includes(f.id));
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const runAudit = async () => {
    if (!workspaceId || auditing) return;
    setAuditing(true);
    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAuditResult(data);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setAuditing(false);
    }
  };

  const high = active.filter(f => f.severity === 'high');
  const medium = active.filter(f => f.severity === 'medium');

  return (
    <div className="space-y-6">
      {/* Strategic Audit Trigger */}
      <div className="rounded-md border border-border bg-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-none">
        <div>
          <h3 className="text-sm font-semibold text-ivory flex items-center gap-2">
            <Sparkles size={14} className="text-sage animate-pulse" />
            AI Strategic Audit
          </h3>
          <p className="text-xs text-fog mt-0.5">
            Run a deep operational audit of projects, financial logs, and backlog capacity.
          </p>
        </div>
        <Button 
          onClick={runAudit} 
          disabled={auditing || !workspaceId}
          size="sm"
          className="shrink-0 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-all px-4 h-9 text-xs font-semibold"
        >
          {auditing ? (
            <>
              <Loader2 size={13} className="mr-1.5 animate-spin" />
              Auditing...
            </>
          ) : (
            <>
              <Sparkles size={13} className="mr-1.5" />
              Run Strategic Audit
            </>
          )}
        </Button>
      </div>

      {/* Auditing State */}
      {auditing && (
        <div className="rounded-xl border border-white/5 bg-midnight/20 p-8 flex flex-col items-center justify-center text-center gap-3">
          <Loader2 size={24} className="animate-spin text-sage" />
          <p className="text-xs text-silver italic animate-pulse">Hermes is reviewing project budget consumption, timeline health, and client receivables...</p>
        </div>
      )}

      {/* Audit Results View */}
      {auditResult && !auditing && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          {/* Health Score Gauge */}
          <div className="bg-card border border-border p-5 rounded-md flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-mono text-sage bg-sage/10 px-1.5 py-0.5 rounded-full">AUDIT REPORT</span>
            </div>
            
            <div className="relative h-24 w-24 flex items-center justify-center mb-3">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/5"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{ strokeDasharray: `${auditResult.healthScore} 100` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-sage"
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="text-2xl font-bold font-mono text-ivory tracking-tighter">{auditResult.healthScore}</span>
            </div>
            <p className="text-[10px] text-fog uppercase tracking-widest font-medium">Workspace Health Score</p>
          </div>

          {/* Strategic Findings list */}
          <div className="lg:col-span-2 bg-card border border-border p-5 rounded-md flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-ivory uppercase tracking-wider mb-3">Strategic Findings</h4>
              {auditResult.findings.length === 0 ? (
                <p className="text-xs text-fog italic py-4">No strategic issues detected. Your workspace operational margins are well protected.</p>
              ) : (
                <div className="space-y-3">
                  {auditResult.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0",
                        f.severity === 'high' ? "text-ember bg-ember/10" : "text-warm bg-warm/10"
                      )}>
                        {f.severity}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-ivory">{f.title}</p>
                        <p className="text-[11px] text-silver leading-relaxed">{f.description}</p>
                        <p className="text-[10px] text-fog italic"><span className="text-warm font-semibold">Impact:</span> {f.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations Brief */}
            {auditResult.recommendations && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] text-fog uppercase tracking-widest font-medium mb-1 flex items-center gap-1">
                  <Sparkles size={10} className="text-warm" />
                  Hermes Executive Recommendations
                </p>
                <p className="text-xs text-silver leading-relaxed italic">
                  "{auditResult.recommendations}"
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Static Alerts view */}
      {!auditing && (
        <>
          {active.length === 0 && !auditResult ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-sage/10 flex items-center justify-center">
                <Flame size={20} className="text-sage" />
              </div>
              <p className="text-sm text-silver font-medium">{labels.allClear}</p>
              <p className="text-xs text-fog">{labels.allClearSub}</p>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {high.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-ember uppercase tracking-widest font-medium">Critical Alerts · {high.length}</p>
                  {high.map(flag => (
                    <FlagCard key={flag.id} flag={flag} onDismiss={onDismiss} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
              {medium.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-warm uppercase tracking-widest font-medium">Attention Required · {medium.length}</p>
                  {medium.map(flag => (
                    <FlagCard key={flag.id} flag={flag} onDismiss={onDismiss} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FlagCard({ flag, onDismiss, onNavigate }: {
  flag: RiskFlag;
  onDismiss: (id: string) => void;
  onNavigate: (link: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
        flag.severity === 'high'
          ? 'bg-ember/5 border-ember/20 text-ember'
          : 'bg-warm/5 border-warm/15 text-warm'
      )}
    >
      <AlertTriangle size={13} className="shrink-0" />
      <button
        className="flex-1 text-left hover:opacity-80 transition-opacity"
        onClick={() => onNavigate(flag.link)}
      >
        {flag.message}
      </button>
      <button
        onClick={() => onDismiss(flag.id)}
        className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 bg-white/5" />
        <Skeleton className="h-4 w-48 bg-white/5" />
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-4 border-b border-white/5 pb-2">
        <Skeleton className="h-4 w-16 bg-white/5" />
        <Skeleton className="h-4 w-24 bg-white/5" />
      </div>

      {/* Daily Briefing skeleton */}
      <div className="rounded-xl p-4 border border-white/5 bg-card space-y-3">
        <Skeleton className="h-4 w-28 bg-white/5" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full bg-white/5" />
          <Skeleton className="h-3 w-5/6 bg-white/5" />
          <Skeleton className="h-3 w-4/5 bg-white/5" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-card p-4 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20 bg-white/5" />
              <Skeleton className="h-4 w-4 bg-white/5" />
            </div>
            <Skeleton className="h-7 w-16 bg-white/5" />
            <Skeleton className="h-3 w-24 bg-white/5" />
          </div>
        ))}
      </div>

      {/* Grid skeleton for Activity feed & Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-card p-5 space-y-4">
          <Skeleton className="h-4 w-28 bg-white/5" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-7 w-7 rounded-full bg-white/5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-3/4 bg-white/5" />
                  <Skeleton className="h-2 w-1/4 bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="rounded-xl border border-white/5 bg-card p-5 space-y-4">
          <Skeleton className="h-4 w-24 bg-white/5" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuth();

  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?._id;

  useEffect(() => {
    if (workspaces !== null && workspaces.length === 0) {
      router.replace('/onboarding/discover');
    }
  }, [workspaces, router]);

  const projects = useProjects(workspaceId);
  const invoices = useInvoices(workspaceId);
  const approvals = useApprovals(workspaceId);
  const deals = useDeals(workspaceId);
  const tasks = useTasks(workspaceId);
  const workflowRuns = useWorkflowRuns(workspaceId ?? null, 50);
  const handoffs = useHandoffs(workspaceId ?? null);

  const isLoading = workspaces === null || projects === null || invoices === null || approvals === null || deals === null || tasks === null;

  const d = t.app.dashboard;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? d.greetingMorning : hour < 18 ? d.greetingAfternoon : d.greetingEvening;
  const displayName = user?.name ?? 'Uprising Studio';

  const activeProjectsCount = projects ? projects.filter((p: any) => p.status === 'active').length : 0;
  const openTasksCount = tasks ? tasks.filter((tsk: any) => tsk.status !== 'done').length : 0;
  const pendingApprovalsCount = approvals ? approvals.filter((a: any) => a.status === 'pending').length : 0;
  const revenueMtd = invoices
    ? invoices
        .filter((i: any) => i.status === 'paid' && new Date(i.date).getMonth() === new Date().getMonth())
        .reduce((acc: any, i: any) => acc + i.amount, 0)
    : 0;

  const activeWorkflowRunsCount = workflowRuns ? workflowRuns.filter((r: any) => r.status === 'running').length : 0;
  const pendingHandoffsCount = handoffs ? handoffs.filter((h: any) => h.status === 'pending').length : 0;

  const kpis = [
    { label: d.kpis.activeProjects, numericValue: activeProjectsCount, format: (n: number) => String(Math.round(n)), delta: d.kpis.activeProjectsDelta, icon: FolderKanban, color: 'text-sage', spotlight: 'spotlight-sage' },
    { label: d.kpis.openTasks, numericValue: openTasksCount, format: (n: number) => String(Math.round(n)), delta: d.kpis.openTasksDelta, icon: CheckSquare, color: 'text-warm', spotlight: 'spotlight-amber' },
    { label: d.kpis.pendingApprovals, numericValue: pendingApprovalsCount, format: (n: number) => String(Math.round(n)), delta: d.kpis.pendingApprovalsDelta, icon: ClipboardCheck, color: 'text-ember', spotlight: 'spotlight-rose' },
    { label: d.kpis.revenueMtd, numericValue: revenueMtd / 1000, format: (n: number) => `$${n.toFixed(1)}k`, delta: d.kpis.revenueMtdDelta, icon: DollarSign, color: 'text-silver', spotlight: 'spotlight-amber' },
    { label: 'Active Workflows', numericValue: activeWorkflowRunsCount, format: (n: number) => String(Math.round(n)), delta: `${pendingHandoffsCount} handoffs pending`, icon: GitPullRequest, color: 'text-sage', spotlight: 'spotlight-sage' },
  ];

  const quickActions = [
    { label: d.newProject, to: '/app/projects' },
    { label: d.addClient, to: '/app/clients' },
    { label: d.addDeal, to: '/app/pipeline' },
    { label: d.sendInvoice, to: '/app/billing' },
  ];

  const allFlags = computeRiskFlags(t, {
    projects: projects || [],
    invoices: invoices || [],
    approvals: approvals || [],
    deals: deals || []
  });
  const [dismissed, setDismissed] = useState<string[]>([]);
  const activeFlags = allFlags.filter(f => !dismissed.includes(f.id));

  const briefingContext = workspaceId
    ? `Active projects: ${activeProjectsCount}. Open tasks: ${openTasksCount}. Pending approvals: ${pendingApprovalsCount}. Revenue MTD: $${(revenueMtd / 1000).toFixed(1)}k. Active risk flags: ${activeFlags.length} (${activeFlags.filter(f => f.severity === 'high').length} critical, ${activeFlags.filter(f => f.severity === 'medium').length} medium).`
    : '';

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 w-full px-4">
      {/* Premium Dashboard Banner */}
      <motion.div
        className="relative h-48 sm:h-56 w-full rounded-md overflow-hidden border border-border group"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Background Video with smooth zoom-in on hover */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          src="/dashboard-banner.mp4"
        />
        {/* Dark Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent z-10" />
        <div className="absolute inset-0 bg-radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, rgba(10, 13, 20, 0.6) 100%) z-10" />

        {/* Content over the banner */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 z-20 flex flex-col justify-end h-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-1.5"
          >
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#7FA38A] bg-[#7FA38A]/10 border border-[#7FA38A]/20 px-2.5 py-0.5 rounded-full backdrop-blur-md self-start inline-block">
              Uprising Studio
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif italic">
              Workspace Core
            </h2>
          </motion.div>
        </div>
      </motion.div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <TextAnimate text={greeting + ', ' + displayName} type="calmInUp" className="text-3xl font-bold text-ivory font-serif italic" />
        <p className="text-sm text-silver mt-1">{d.subtitle}</p>
      </motion.div>

      <DirectionAwareTabs tabs={[
        {
          id: 0,
          label: d.tabOverview,
          content: (
            <div className="space-y-6 pt-4">
              {/* Getting Started checklist — shown until all 5 steps complete */}
              <GettingStartedChecklist />

              {/* AI Daily Briefing */}
              {workspaceId && (
                <DailyBriefing
                  context={briefingContext}
                  labels={{
                     title: d.briefingTitle,
                     loading: d.briefingLoading,
                     error: d.briefingError,
                     refresh: d.briefingRefresh,
                  }}
                />
              )}

              {/* Agent Suggestions */}
              {workspaceId && <AgentSuggestions workspaceId={workspaceId} />}

              {/* Inline risk flags (compact) */}
              {activeFlags.length > 0 && (
                <div className="space-y-2">
                  {activeFlags.slice(0, 3).map(flag => (
                    <FlagCard
                      key={flag.id}
                      flag={flag}
                      onDismiss={id => setDismissed(prev => [...prev, id])}
                      onNavigate={link => router.push(link)}
                    />
                  ))}
                  {activeFlags.length > 3 && (
                    <p className="text-xs text-fog pl-1">+{activeFlags.length - 3} more alerts &middot; see Firefighter tab</p>
                  )}
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {kpis.map((kpi, index) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <ShiftCard
                      className={cn("border border-border rounded-md shadow-card", kpi.spotlight)}
                      topContent={
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] sm:text-xs font-bold text-fog uppercase tracking-wider">{kpi.label}</span>
                          <kpi.icon size={14} className={cn(kpi.color, "opacity-70")} />
                        </div>
                      }
                      middleContent={
                        <div className="w-full text-left">
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-ivory tracking-tight truncate">
                            <AnimatedNumber value={kpi.numericValue} format={kpi.format} stiffness={80} damping={18} mass={0.5} />
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-silver mt-1 flex items-center gap-1 font-medium">
                            <span className="text-sage">{kpi.delta.split(' ')[0]}</span>
                            <span className="truncate">{kpi.delta.split(' ').slice(1).join(' ')}</span>
                          </p>
                        </div>
                      }
                    />
                  </motion.div>
                ))}
              </div>

              {/* Activity feed + quick actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border border-border bg-card rounded-md shadow-none">
                  <CardHeader>
                    <CardTitle><TextAnimate text={d.recentActivity} type="fadeIn" className="text-sm font-bold text-ivory" /></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActivityFeed emptyLabel={d.activityEmpty} workspaceId={workspaceId} />
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card rounded-md shadow-none">
                  <CardHeader>
                    <CardTitle><TextAnimate text={d.quickActions} type="fadeIn" className="text-sm font-bold text-ivory" /></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {quickActions.map(action => (
                      <button
                        key={action.label}
                        onClick={() => router.push(action.to)}
                        className="w-full text-left text-xs py-3 border-b border-border text-silver hover:text-ivory transition-all duration-200 flex items-center justify-between group cursor-pointer"
                      >
                        {action.label}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ),
        },
        {
          id: 1,
          label: (
            <span className="flex items-center gap-1.5">
              <Flame size={11} className={activeFlags.length > 0 ? 'text-ember' : 'text-fog'} />
              {d.tabFirefighter}
              {activeFlags.length > 0 && (
                <span className="px-1.5 py-0.5 bg-ember/15 text-ember text-[9px] rounded-full">
                  {activeFlags.length}
                </span>
              )}
            </span>
          ),
          content: (
            <div className="pt-4">
              <FirefighterView
                flags={allFlags}
                dismissed={dismissed}
                onDismiss={id => setDismissed(prev => [...prev, id])}
                onNavigate={link => router.push(link)}
                labels={{ allClear: d.allClear, allClearSub: d.allClearSub }}
                workspaceId={workspaceId}
              />
            </div>
          ),
        },
      ]} />
    </div>
  );
}
