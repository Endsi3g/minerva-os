'use client';
import { useRouter } from 'next/navigation';
import { FolderKanban, CheckSquare, ClipboardCheck, DollarSign, AlertTriangle, X, ChevronRight, Flame, RefreshCw, Sparkles } from 'lucide-react';
import { GettingStartedChecklist } from '@/components/minerva/GettingStartedChecklist';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useProjects, useInvoices, useApprovals, useDeals, useTasks, useActivity } from '@/lib/hooks/useSupabase';
import { AgentSuggestions } from '@/components/agents/AgentSuggestions';
import { motion } from 'framer-motion';
import type { Translations } from '@/i18n';

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

  if (activity.length === 0) {
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
        <p className="text-center text-xs text-fog pt-4">{emptyLabel}</p>
      </div>
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
    <div
      className="rounded-xl p-4 border"
      style={{ background: 'linear-gradient(135deg, #111522 0%, #141926 100%)', borderColor: 'rgba(127,163,138,0.15)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-sage" />
          <span className="text-xs font-medium text-sage uppercase tracking-widest">{labels.title}</span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-fog hover:text-silver transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
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
        <p className="text-xs text-silver leading-relaxed whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
}

/* ── Firefighter View ─────────────────────────────────────────────────────── */

function FirefighterView({ flags, dismissed, onDismiss, onNavigate, labels }: {
  flags: RiskFlag[];
  dismissed: string[];
  onDismiss: (id: string) => void;
  onNavigate: (link: string) => void;
  labels: { allClear: string; allClearSub: string };
}) {
  const active = flags.filter(f => !dismissed.includes(f.id));

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <div className="h-12 w-12 rounded-full bg-sage/10 flex items-center justify-center">
          <Flame size={20} className="text-sage" />
        </div>
        <p className="text-sm text-silver font-medium">{labels.allClear}</p>
        <p className="text-xs text-fog">{labels.allClearSub}</p>
      </div>
    );
  }

  const high = active.filter(f => f.severity === 'high');
  const medium = active.filter(f => f.severity === 'medium');

  return (
    <div className="space-y-6">
      {high.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-ember uppercase tracking-widest font-medium">Critical · {high.length}</p>
          {high.map(flag => (
            <FlagCard key={flag.id} flag={flag} onDismiss={onDismiss} onNavigate={onNavigate} />
          ))}
        </div>
      )}
      {medium.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-warm uppercase tracking-widest font-medium">Attention · {medium.length}</p>
          {medium.map(flag => (
            <FlagCard key={flag.id} flag={flag} onDismiss={onDismiss} onNavigate={onNavigate} />
          ))}
        </div>
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

type Tab = 'overview' | 'firefighter';

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  const workspaces = useWorkspaces();
  const workspaceId = workspaces[0]?._id;

  const projects = useProjects(workspaceId);
  const invoices = useInvoices(workspaceId);
  const approvals = useApprovals(workspaceId);
  const deals = useDeals(workspaceId);
  const tasks = useTasks(workspaceId);

  const d = t.app.dashboard;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? d.greetingMorning : hour < 18 ? d.greetingAfternoon : d.greetingEvening;
  const displayName = user?.name ?? 'Uprising Studio';

  const activeProjectsCount = projects.filter((p: any) => p.status === 'active').length;
  const openTasksCount = tasks.filter((tsk: any) => tsk.status !== 'done').length;
  const pendingApprovalsCount = approvals.filter((a: any) => a.status === 'pending').length;
  const revenueMtd = invoices
    .filter((i: any) => i.status === 'paid' && new Date(i.date).getMonth() === new Date().getMonth())
    .reduce((acc: any, i: any) => acc + i.amount, 0);

  const kpis = [
    { label: d.kpis.activeProjects, value: String(activeProjectsCount), delta: d.kpis.activeProjectsDelta, icon: FolderKanban, color: 'text-sage' },
    { label: d.kpis.openTasks, value: String(openTasksCount), delta: d.kpis.openTasksDelta, icon: CheckSquare, color: 'text-warm' },
    { label: d.kpis.pendingApprovals, value: String(pendingApprovalsCount), delta: d.kpis.pendingApprovalsDelta, icon: ClipboardCheck, color: 'text-ember' },
    { label: d.kpis.revenueMtd, value: `$${(revenueMtd / 1000).toFixed(1)}k`, delta: d.kpis.revenueMtdDelta, icon: DollarSign, color: 'text-silver' },
  ];

  const quickActions = [
    { label: d.newProject, to: '/app/projects' },
    { label: d.addClient, to: '/app/clients' },
    { label: d.addDeal, to: '/app/pipeline' },
    { label: d.sendInvoice, to: '/app/billing' },
  ];

  const allFlags = computeRiskFlags(t, { projects, invoices, approvals, deals });
  const [dismissed, setDismissed] = useState<string[]>([]);
  const activeFlags = allFlags.filter(f => !dismissed.includes(f.id));

  const briefingContext = workspaceId
    ? `Active projects: ${activeProjectsCount}. Open tasks: ${openTasksCount}. Pending approvals: ${pendingApprovalsCount}. Revenue MTD: $${(revenueMtd / 1000).toFixed(1)}k. Active risk flags: ${activeFlags.length} (${activeFlags.filter(f => f.severity === 'high').length} critical, ${activeFlags.filter(f => f.severity === 'medium').length} medium).`
    : '';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-ivory font-serif italic">
          {greeting}, {displayName}
        </h1>
        <p className="text-sm text-silver mt-1">{d.subtitle}</p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-white/5 pb-0">
        {([['overview', d.tabOverview], ['firefighter', d.tabFirefighter]] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-sage text-sage'
                : 'border-transparent text-fog hover:text-silver'
            )}
          >
            {key === 'firefighter' && (
              <Flame size={11} className={cn(activeFlags.length > 0 ? 'text-ember' : 'text-fog')} />
            )}
            {label}
            {key === 'firefighter' && activeFlags.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 bg-ember/15 text-ember text-[9px] rounded-full">
                {activeFlags.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
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
                <button
                  onClick={() => setTab('firefighter')}
                  className="text-xs text-fog hover:text-silver transition-colors pl-1"
                >
                  +{activeFlags.length - 3} more alerts — view all
                </button>
              )}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Card className="glass-card border-white/10 bg-midnight">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-bold text-fog uppercase tracking-wider">{kpi.label}</CardTitle>
                      <kpi.icon size={14} className={cn(kpi.color, "opacity-70")} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-ivory">{kpi.value}</p>
                    <p className="text-[10px] text-silver mt-1 flex items-center gap-1 font-medium">
                      <span className="text-sage">{kpi.delta.split(' ')[0]}</span>
                      {kpi.delta.split(' ').slice(1).join(' ')}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Activity feed + quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 glass-card border-white/10 bg-midnight">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-ivory">{d.recentActivity}</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed emptyLabel={d.activityEmpty} workspaceId={workspaceId} />
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10 bg-midnight">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-ivory">{d.quickActions}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.to)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg text-silver hover:bg-white/5 hover:text-ivory transition-all duration-300 flex items-center justify-between group"
                  >
                    {action.label}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}


      {tab === 'firefighter' && (
        <FirefighterView
          flags={allFlags}
          dismissed={dismissed}
          onDismiss={id => setDismissed(prev => [...prev, id])}
          onNavigate={link => router.push(link)}
          labels={{ allClear: d.allClear, allClearSub: d.allClearSub }}
        />
      )}
    </div>
  );
}
