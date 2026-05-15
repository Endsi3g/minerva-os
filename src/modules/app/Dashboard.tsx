'use client';
import { useRouter } from 'next/navigation';
import { FolderKanban, CheckSquare, ClipboardCheck, DollarSign, AlertTriangle, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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

  // Projects past due date
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

  // Overdue invoices
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

  // Approvals pending > 5 days
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

  // Pipeline deals stale > 14 days
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

/* ── Components ──────────────────────────────────────────────────────────── */

function ActivityFeed({ emptyLabel, workspaceId }: { emptyLabel: string, workspaceId: any }) {
  const activity = useQuery(api.activity.list, workspaceId ? { workspaceId } : "skip") ?? [];

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

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuth();
  
  // Get first workspace for now
  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const projects = useQuery(api.projects.list as any, workspaceId ? { workspaceId } : "skip") ?? [];
  const invoices = useQuery(api.invoices.list, workspaceId ? { workspaceId } : "skip") ?? [];
  const approvals = useQuery(api.approvals.list as any) ?? [];
  const deals = useQuery(api.deals.list as any, workspaceId ? { workspaceId } : "skip") ?? [];
  const tasks = useQuery(api.tasks.get as any, workspaceId ? { workspaceId } : "skip") ?? [];
  

  const d = t.app.dashboard;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? d.greetingMorning : hour < 18 ? d.greetingAfternoon : d.greetingEvening;
  const displayName = user?.name ?? 'Uprising Studio';

  const activeProjectsCount = projects.filter((p: any) => p.status === 'active').length;
  const openTasksCount = tasks.filter((t: any) => t.status !== 'done').length;
  const pendingApprovalsCount = approvals.filter((a: any) => a.status === 'pending').length;
  const revenueMtd = invoices
    .filter((i: any) => i.status === 'paid' && new Date(i.date).getMonth() === new Date().getMonth())
    .reduce((acc: any, i: any) => acc + i.amount, 0);

  const kpis = [
    { 
      label: d.kpis.activeProjects,    
      value: String(activeProjectsCount),   
      delta: d.kpis.activeProjectsDelta,        
      icon: FolderKanban,   
      color: 'text-sage' 
    },
    { 
      label: d.kpis.openTasks,         
      value: String(openTasksCount),   
      delta: d.kpis.openTasksDelta,          
      icon: CheckSquare,    
      color: 'text-warm' 
    },
    { 
      label: d.kpis.pendingApprovals,  
      value: String(pendingApprovalsCount),    
      delta: d.kpis.pendingApprovalsDelta,             
      icon: ClipboardCheck, 
      color: 'text-ember' 
    },
    { 
      label: d.kpis.revenueMtd,        
      value: `$${(revenueMtd / 1000).toFixed(1)}k`, 
      delta: d.kpis.revenueMtdDelta,   
      icon: DollarSign,     
      color: 'text-silver' 
    },
  ];

  const quickActions = [
    { label: d.newProject,   to: '/app/projects' },
    { label: d.addClient,    to: '/app/clients' },
    { label: d.addDeal,      to: '/app/pipeline' },
    { label: d.sendInvoice,  to: '/app/billing' },
  ];

  const allFlags = computeRiskFlags(t, { projects, invoices, approvals, deals });
  const [dismissed, setDismissed] = useState<string[]>([]);
  const flags = allFlags.filter(f => !dismissed.includes(f.id));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-near-black dark:text-parchment font-serif italic">
          {greeting}, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{d.subtitle}</p>
      </motion.div>

      {/* Agent Suggestions Section */}
      {workspaceId && <AgentSuggestions workspaceId={workspaceId} />}

      {/* Risk flags */}
      {flags.length > 0 && (
        <div className="space-y-2">
          {flags.map(flag => (
            <div
              key={flag.id}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm',
                flag.severity === 'high'
                  ? 'bg-ember/5 border-ember/20 text-ember'
                  : 'bg-warm/5 border-warm/15 text-warm'
              )}
            >
              <AlertTriangle size={13} className="shrink-0" />
              <button
                className="flex-1 text-left hover:opacity-80 transition-opacity"
                onClick={() => router.push(flag.link)}
              >
                {flag.message}
              </button>
              <button
                onClick={() => setDismissed(d => [...d, flag.id])}
                className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          ))}
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
            <Card className="glass-card antigravity-float border-clay/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</CardTitle>
                  <kpi.icon size={14} className={cn(kpi.color, "opacity-70")} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-near-black dark:text-parchment">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                  <span className="text-terracotta">{kpi.delta.split(' ')[0]}</span>
                  {kpi.delta.split(' ').slice(1).join(' ')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Activity feed + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-card border-clay/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-near-black dark:text-parchment">{d.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed emptyLabel={d.activityEmpty} workspaceId={workspaceId} />
          </CardContent>
        </Card>

        <Card className="glass-card border-clay/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-near-black dark:text-parchment">{d.quickActions}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => router.push(action.to)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg text-muted-foreground hover:bg-terracotta/5 hover:text-terracotta transition-all duration-300 flex items-center justify-between group"
              >
                {action.label}
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
