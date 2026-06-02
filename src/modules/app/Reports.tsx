import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { TextAnimate } from '@/components/ui/text-animate';

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

type ReportTab = 'overview' | 'profitability' | 'time';

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function Reports() {
  const { t, lang } = useLang();
  const r = t.app.reports;
  const [tab, setTab] = useState<ReportTab>('overview');

  const [clients, setClients] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const wsRes = await supabase.from('workspaces').select('id').limit(1);
      const wid = wsRes.data?.[0]?.id;
      if (!wid) return;
      const [cRes, dRes, tRes, aRes, iRes, teRes, eRes] = await Promise.all([
        supabase.from('clients').select('*').eq('workspace_id', wid),
        supabase.from('deals').select('*').eq('workspace_id', wid),
        supabase.from('tasks').select('*').eq('workspace_id', wid),
        supabase.from('approvals').select('*').eq('workspace_id', wid),
        supabase.from('invoices').select('*').eq('workspace_id', wid),
        supabase.from('time_entries').select('*').eq('workspace_id', wid),
        supabase.from('expenses').select('*').eq('workspace_id', wid),
      ]);
      setClients((cRes.data ?? []).map((c: any) => ({ ...c, _id: c.id })));
      setDeals((dRes.data ?? []).map((d: any) => ({ ...d, _id: d.id })));
      setTasks((tRes.data ?? []).map((t: any) => ({ ...t, _id: t.id })));
      setApprovals((aRes.data ?? []).map((a: any) => ({ ...a, _id: a.id })));
      setInvoices((iRes.data ?? []).map((i: any) => ({ ...i, _id: i.id, clientId: i.client_id, amount: Number(i.amount) })));
      setTimeEntries((teRes.data ?? []).map((e: any) => ({ ...e, _id: e.id, startTime: new Date(e.start_time).getTime(), clientId: e.client_id })));
      setExpenses((eRes.data ?? []).map((e: any) => ({ ...e, _id: e.id, clientId: e.client_id })));
    }
    load();
  }, []);

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

  // Profitability per client
  const profitabilityData = useMemo(() => clients.map((c: any) => {
    const revenue = invoices.filter((i: any) => i.clientId === c._id && i.status === 'paid').reduce((s: number, i: any) => s + i.amount, 0);
    const laborCost = (timeEntries as any[]).filter((e: any) => e.clientId === c._id || e.billable).reduce((s: number, e: any) => s + (e.duration / 60) * (e.hourlyRate ?? 75), 0);
    const expenseCost = (expenses as any[]).filter((e: any) => e.clientId === c._id && e.status === 'approved').reduce((s: number, e: any) => s + e.amount, 0);
    const margin = revenue - laborCost - expenseCost;
    const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;
    return { name: c.company.split(' ')[0], revenue, laborCost, expenseCost, margin, marginPct };
  }).filter((d: any) => d.revenue > 0 || d.laborCost > 0), [clients, invoices, timeEntries, expenses]);

  // Time tracking summary (last 30 days)
  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentEntries = (timeEntries as any[]).filter((e: any) => e.startTime >= cutoff30);
  const totalHours = recentEntries.reduce((s: number, e: any) => s + e.duration, 0) / 60;
  const billableHours = recentEntries.filter((e: any) => e.billable).reduce((s: number, e: any) => s + e.duration, 0) / 60;
  const billableRate = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <TextAnimate text={r.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
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

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-white/5 mb-6">
        {([
          ['overview', 'Overview'],
          ['profitability', 'Profitability'],
          ['time', 'Time & Hours'],
        ] as [ReportTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === key ? 'border-sage text-sage' : 'border-transparent text-fog hover:text-silver'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (<>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {(([
          { label: r.kpis.pipelineValue,    numericValue: totalPipeline / 1000, format: (n: number) => '$' + n.toFixed(0) + 'k', color: 'text-silver' },
          { label: r.kpis.winRate,          numericValue: conversionRate,       format: (n: number) => Math.round(n) + '%',      color: 'text-sage' },
          { label: r.kpis.pendingApprovals, numericValue: totalPending,                                                          color: totalPending > 0 ? 'text-warm' : 'text-sage' },
          { label: r.kpis.approvalsResolved,numericValue: totalApproved,                                                         color: 'text-sage' },
        ] as Array<{ label: string; numericValue: number; format?: (n: number) => string; color: string }>).map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-semibold tabular-nums ${s.color}`}>
              <AnimatedNumber value={s.numericValue} format={s.format ?? ((n) => String(Math.round(n)))} stiffness={80} damping={18} mass={0.5} />
            </p>
            <p className="text-xs text-fog mt-1">{s.label}</p>
          </div>
        )))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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

      </>)} {/* end overview tab */}

      {tab === 'profitability' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Revenue', value: fmtCurrency(profitabilityData.reduce((s: number, d: any) => s + d.revenue, 0)), color: 'text-ivory' },
              { label: 'Total Labor Cost', value: fmtCurrency(profitabilityData.reduce((s: number, d: any) => s + d.laborCost, 0)), color: 'text-warm' },
              { label: 'Gross Margin', value: fmtCurrency(profitabilityData.reduce((s: number, d: any) => s + d.margin, 0)), color: profitabilityData.reduce((s: number, d: any) => s + d.margin, 0) >= 0 ? 'text-sage' : 'text-ember' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4 border border-border bg-card">
                <p className={cn('text-xl font-semibold tabular-nums', s.color)}>{s.value}</p>
                <p className="text-xs text-fog mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Per-client profitability table */}
          <ReportSection title="Profitability by Client" subtitle="Revenue vs labor + expenses">
            {profitabilityData.length === 0 ? (
              <p className="text-sm text-fog text-center py-10">Add invoices and time entries to see profitability data.</p>
            ) : (
              <div className="overflow-x-auto">
              <div className="min-w-[420px] space-y-2">
                <div className="grid grid-cols-5 gap-2 text-[10px] text-fog uppercase tracking-widest px-1 pb-2 border-b border-white/5">
                  <span className="col-span-2">Client</span>
                  <span className="text-right">Revenue</span>
                  <span className="text-right">Costs</span>
                  <span className="text-right">Margin</span>
                </div>
                {profitabilityData.map((d: any) => (
                  <div key={d.name} className="grid grid-cols-5 gap-2 text-xs items-center py-1.5 border-b border-white/[0.03]">
                    <span className="col-span-2 text-silver">{d.name}</span>
                    <span className="text-right text-ivory tabular-nums">{fmtCurrency(d.revenue)}</span>
                    <span className="text-right text-warm tabular-nums">{fmtCurrency(d.laborCost + d.expenseCost)}</span>
                    <div className="text-right">
                      <span className={cn('tabular-nums font-medium', d.margin >= 0 ? 'text-sage' : 'text-ember')}>
                        {fmtCurrency(d.margin)}
                      </span>
                      <span className={cn('text-[10px] ml-1', d.marginPct >= 50 ? 'text-sage' : d.marginPct >= 20 ? 'text-warm' : 'text-ember')}>
                        {d.marginPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            )}
          </ReportSection>
        </div>
      )}

      {tab === 'time' && (
        <div className="space-y-4">
          {/* Time KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total hours (30d)', value: `${totalHours.toFixed(1)}h`, color: 'text-ivory' },
              { label: 'Billable hours', value: `${billableHours.toFixed(1)}h`, color: 'text-sage' },
              { label: 'Billable rate', value: `${billableRate}%`, color: billableRate >= 70 ? 'text-sage' : billableRate >= 50 ? 'text-warm' : 'text-ember' },
              { label: 'Entries (30d)', value: String(recentEntries.length), color: 'text-silver' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-xl p-4 border border-border bg-card">
                <p className={cn('text-xl font-semibold tabular-nums', kpi.color)}>{kpi.value}</p>
                <p className="text-xs text-fog mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          <ReportSection title="Hours by Project (last 30 days)" subtitle="Billable vs non-billable breakdown">
            {recentEntries.length === 0 ? (
              <p className="text-sm text-fog text-center py-10">No time entries in the last 30 days. Start tracking time to see data here.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentEntries.slice(0, 20).map((e: any) => (
                  <div key={e._id} className="flex items-center gap-3 py-1.5 border-b border-white/[0.03]">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ivory truncate">{e.description || 'Untitled'}</p>
                      <p className="text-[10px] text-fog">{new Date(e.startTime).toLocaleDateString()}</p>
                    </div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', e.billable ? 'text-sage bg-sage/10' : 'text-fog bg-fog/10')}>
                      {e.billable ? 'Billable' : 'Non-bill'}
                    </span>
                    <span className="text-xs text-silver tabular-nums font-mono w-12 text-right">
                      {(e.duration / 60).toFixed(1)}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ReportSection>

          {/* Export */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                const rows = [['Date', 'Description', 'Duration (h)', 'Billable', 'Rate'], ...recentEntries.map((e: any) => [new Date(e.startTime).toLocaleDateString(), e.description, (e.duration / 60).toFixed(2), e.billable ? 'Yes' : 'No', e.hourlyRate ?? ''])];
                const csv = rows.map(r => r.join(',')).join('\n');
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'time-report.csv'; a.click();
              }}
              className="flex items-center gap-1.5 text-xs text-fog hover:text-silver transition-colors"
            >
              <Download size={12} />
              Export CSV
            </button>
          </div>
        </div>
      )}
    </>
  );
}
