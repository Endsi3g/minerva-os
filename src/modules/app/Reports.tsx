import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useLang } from '@/i18n';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useMemo } from 'react';

/* ── Palette ─────────────────────────────────────────────────────────────── */

const SAGE   = '#7FA38A';
const WARM   = '#B89B6A';
const EMBER  = '#A86A6A';
const SILVER = '#B8BDC7';
const FOG    = 'rgba(138,144,153,0.5)';
const GRID   = 'rgba(255,255,255,0.04)';
const TEXT   = '#8A9099';

/* ── Custom Tooltip ──────────────────────────────────────────────────────── */

interface PayloadItem { name?: string; value?: number | string; color?: string; }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: PayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{
        backgroundColor: 'rgba(17,21,34,0.96)',
        border: '1px solid rgba(255,255,255,0.10)',
        color: '#F5F1E8',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color ?? SILVER }}>
          {entry.name}: <span className="font-semibold">{
            typeof entry.value === 'number' && String(entry.name).includes('$')
              ? `$${entry.value.toLocaleString()}`
              : entry.value
          }</span>
        </p>
      ))}
    </div>
  );
}

/* ── Section wrapper ─────────────────────────────────────────────────────── */

function ReportSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-ivory">{title}</h3>
        {subtitle && <p className="text-xs text-fog mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function Reports() {
  const { t, lang } = useLang();
  const r = t.app.reports;

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const clients = useQuery(api.clients.list as any, workspaceId ? { workspaceId } : "skip") ?? [];
  const deals = useQuery(api.deals.list as any, workspaceId ? { workspaceId } : "skip") ?? [];
  const tasks = useQuery(api.tasks.get as any, workspaceId ? { workspaceId } : "skip") ?? [];
  const approvals = useQuery(api.approvals.list as any, workspaceId ? { workspaceId } : "skip") ?? [];
  const invoices = useQuery(api.invoices.list, workspaceId ? { workspaceId } : "skip") ?? [];

  const STAGE_ORDER = ['new_lead', 'qualified', 'proposal', 'negotiation', 'won'] as const;

  // Data transforms
  const revenueData = useMemo(() => clients
    .map((c: any) => ({
      name: c.company.split(' ')[0],
      value: invoices
        .filter((i: any) => i.clientId === c._id && i.status === 'paid')
        .reduce((sum: number, i: any) => sum + i.amount, 0),
    }))
    .filter((c: any) => c.value > 0)
    .slice(0, 5), [clients, invoices]);

  const teamData = useMemo(() => {
    const assignees = [...new Set(tasks.map((t: any) => t.assignee))];
    return assignees.map((a: any) => ({
      name: a,
      done: tasks.filter((t: any) => t.assignee === a && t.status === 'done').length,
      open: tasks.filter((t: any) => t.assignee === a && t.status !== 'done').length,
    })).sort((a: any, b: any) => (b.done + b.open) - (a.done + a.open));
  }, [tasks]);

  const funnelData = useMemo(() => STAGE_ORDER.map((stage: any) => ({
    name: t.app.pipeline.stages[stage as keyof typeof t.app.pipeline.stages] || stage,
    count: deals.filter((l: any) => l.stage === stage).length,
    value: deals.filter((l: any) => l.stage === stage).reduce((s: number, l: any) => s + l.value, 0),
  })), [deals, t]);

  // Quick stats
  const totalPending  = approvals.filter((a: any) => a.status === 'pending').length;
  const totalApproved = approvals.filter((a: any) => a.status === 'approved').length;
  const wonDeals = deals.filter((l: any) => l.stage === 'won');
  const totalPipeline = deals.reduce((s: number, l: any) => s + l.value, 0);
  const conversionRate = deals.length > 0
    ? Math.round((wonDeals.length / deals.length) * 100)
    : 0;

  const cycleData = [
    { name: 'Design',   avg: 3.2 },
    { name: 'Copy',     avg: 5.8 },
    { name: 'Video',    avg: 4.1 },
    { name: 'Document', avg: 2.4 },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{r.title}</h1>
          <p className="text-sm text-fog mt-0.5">{r.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-3 py-1.5 rounded-full border text-fog"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: r.kpis.pipelineValue,    value: `$${(totalPipeline / 1000).toFixed(0)}k`, color: 'text-silver' },
          { label: r.kpis.winRate,          value: `${conversionRate}%`,                     color: 'text-sage' },
          { label: r.kpis.pendingApprovals, value: String(totalPending),                     color: totalPending > 0 ? 'text-warm' : 'text-sage' },
          { label: r.kpis.approvalsResolved,value: String(totalApproved),                    color: 'text-sage' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-xs text-fog mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue by client */}
        <ReportSection title={r.revenue.title} subtitle={r.revenue.subtitle}>
          {revenueData.length === 0 ? (
            <p className="text-sm text-fog text-center py-16">
              {r.revenue.empty}
            </p>
          ) : null}
          <ResponsiveContainer width="100%" height={revenueData.length === 0 ? 0 : 220}>
            <BarChart data={revenueData} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis
                dataKey="name"
                tick={{ fill: TEXT, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: TEXT, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" name={r.revenue.label} radius={[4, 4, 0, 0]}>
                {revenueData.map((_: any, i: number) => (
                  <Cell key={i} fill={i === 0 ? SAGE : `rgba(127,163,138,${0.7 - i * 0.1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportSection>

        {/* Pipeline funnel */}
        <ReportSection title={r.funnel.title} subtitle={r.funnel.subtitle}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis
                dataKey="name"
                tick={{ fill: TEXT, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: TEXT, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={24}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" name={r.funnel.label} radius={[4, 4, 0, 0]}>
                {funnelData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.name === (t.app.pipeline.stages.won || 'Won') ? SAGE : entry.name === (t.app.pipeline.stages.negotiation || 'Negotiation') ? WARM : FOG}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportSection>

        {/* Team utilisation */}
        <ReportSection title={r.team.title} subtitle={r.team.subtitle}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={teamData} layout="vertical" barCategoryGap="25%">
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis
                type="number"
                tick={{ fill: TEXT, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: TEXT, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="done" name={r.team.labels.completed} stackId="a" fill={SAGE}   radius={[0, 0, 0, 0]} />
              <Bar dataKey="open" name={r.team.labels.open}      stackId="a" fill={SILVER} radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            {[{ color: SAGE, label: r.team.labels.completed }, { color: SILVER, label: r.team.labels.open }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-[11px] text-fog">{l.label}</span>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* Approval cycle time */}
        <ReportSection title={r.cycle.title} subtitle={r.cycle.subtitle}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cycleData} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis
                dataKey="name"
                tick={{ fill: TEXT, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: TEXT, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                unit="d"
                width={28}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="avg" name={r.cycle.label} radius={[4, 4, 0, 0]}>
                {cycleData.map((entry, i) => (
                  <Cell key={i} fill={entry.avg > 5 ? EMBER : entry.avg > 3 ? WARM : SAGE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-fog mt-2">{r.cycle.target}</p>
        </ReportSection>

      </div>
    </>
  );
}
