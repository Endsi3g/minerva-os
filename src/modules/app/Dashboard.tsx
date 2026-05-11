'use client';
import { useRouter } from 'next/navigation';
import { FolderKanban, CheckSquare, ClipboardCheck, DollarSign, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_PROJECTS, MOCK_INVOICES, MOCK_APPROVALS, MOCK_LEADS } from '@/lib/mock-data';

/* ── Risk flag computation ───────────────────────────────────────────────── */

interface RiskFlag {
  id: string;
  message: string;
  link: string;
  severity: 'high' | 'medium';
}

function computeRiskFlags(): RiskFlag[] {
  const today = new Date();
  const flags: RiskFlag[] = [];

  // Projects past due date
  MOCK_PROJECTS.forEach(p => {
    if (p.status === 'active' && new Date(p.dueDate) < today) {
      flags.push({
        id: `proj-${p.id}`,
        message: `"${p.name}" is past its due date`,
        link: '/app/projects',
        severity: 'high',
      });
    }
  });

  // Overdue invoices
  const overdueInvoices = MOCK_INVOICES.filter(i => i.status === 'overdue');
  if (overdueInvoices.length > 0) {
    flags.push({
      id: 'invoices-overdue',
      message: `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} overdue`,
      link: '/app/billing',
      severity: 'high',
    });
  }

  // Approvals pending > 5 days
  MOCK_APPROVALS.forEach(a => {
    if (a.status === 'pending') {
      const days = Math.floor((today.getTime() - new Date(a.submittedDate).getTime()) / (1000 * 60 * 60 * 24));
      if (days > 5) {
        flags.push({
          id: `approval-${a.id}`,
          message: `"${a.name}" has been pending for ${days} days`,
          link: '/app/approvals',
          severity: 'medium',
        });
      }
    }
  });

  // Pipeline deals stale > 14 days
  MOCK_LEADS.forEach(l => {
    if (!['won', 'lost'].includes(l.stage) && l.daysInStage > 14) {
      flags.push({
        id: `lead-${l.id}`,
        message: `${l.company} stale in "${l.stage.replace('_', ' ')}" for ${l.daysInStage} days`,
        link: '/app/pipeline',
        severity: 'medium',
      });
    }
  });

  return flags;
}

/* ── Components ──────────────────────────────────────────────────────────── */

function ActivityFeed({ emptyLabel }: { emptyLabel: string }) {
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

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuth();
  const d = t.app.dashboard;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? d.greetingMorning : hour < 18 ? d.greetingAfternoon : d.greetingEvening;
  const displayName = user?.name ?? 'Uprising Studio';

  const kpis = [
    { label: d.kpis.activeProjects,    value: '12',   delta: '+2 this month',        icon: FolderKanban,   color: 'text-sage' },
    { label: d.kpis.openTasks,         value: '48',   delta: '6 due today',          icon: CheckSquare,    color: 'text-warm' },
    { label: d.kpis.pendingApprovals,  value: '5',    delta: '2 urgent',             icon: ClipboardCheck, color: 'text-ember' },
    { label: d.kpis.revenueMtd,        value: '$42k', delta: '+18% vs last month',   icon: DollarSign,     color: 'text-silver' },
  ];

  const quickActions = [
    { label: d.newProject,   to: '/app/projects' },
    { label: d.addClient,    to: '/app/clients' },
    { label: d.addDeal,      to: '/app/pipeline' },
    { label: d.sendInvoice,  to: '/app/billing' },
  ];

  const allFlags = computeRiskFlags();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const flags = allFlags.filter(f => !dismissed.includes(f.id));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-ivory">{greeting}, {displayName}</h1>
        <p className="text-sm text-fog mt-1">{d.subtitle}</p>
      </div>

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
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-fog">{kpi.label}</CardTitle>
                <kpi.icon size={14} className={kpi.color} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-ivory">{kpi.value}</p>
              <p className="text-xs text-fog mt-1">{kpi.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity feed + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-ivory">{d.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed emptyLabel={d.activityEmpty} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-ivory">{d.quickActions}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => router.push(action.to)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg text-silver hover:bg-dusk hover:text-ivory transition-colors"
              >
                {action.label}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
