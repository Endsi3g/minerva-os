import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { MOCK_CLIENTS, MOCK_LEADS, MOCK_TASKS, MOCK_APPROVALS } from '@/lib/mock-data';

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
      {payload.map((entry, i) => (
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

/* ── Data transforms ─────────────────────────────────────────────────────── */

// Revenue by active client (monthly value)
const revenueData = MOCK_CLIENTS
  .filter(c => c.monthlyValue > 0)
  .sort((a, b) => b.monthlyValue - a.monthlyValue)
  .map(c => ({ name: c.company.split(' ')[0], value: c.monthlyValue }));

// Pipeline funnel — lead count per stage
const STAGE_ORDER = ['new_lead', 'qualified', 'proposal', 'negotiation', 'won'] as const;
const STAGE_LABELS: Record<string, string> = {
  new_lead:    'New',
  qualified:   'Qualified',
  proposal:    'Proposal',
  negotiation: 'Negotiation',
  won:         'Won',
};
const funnelData = STAGE_ORDER.map(stage => ({
  name: STAGE_LABELS[stage],
  count: MOCK_LEADS.filter(l => l.stage === stage).length,
  value: MOCK_LEADS.filter(l => l.stage === stage).reduce((s, l) => s + l.value, 0),
}));

// Team task distribution
const assignees = [...new Set(MOCK_TASKS.map(t => t.assignee))];
const teamData = assignees.map(a => ({
  name: a,
  done: MOCK_TASKS.filter(t => t.assignee === a && t.status === 'done').length,
  open: MOCK_TASKS.filter(t => t.assignee === a && t.status !== 'done').length,
})).sort((a, b) => (b.done + b.open) - (a.done + a.open));

// Approval cycle time (days from submitted to resolved, for non-pending)
const cycleData = [
  { name: 'Design',   avg: 3.2 },
  { name: 'Copy',     avg: 5.8 },
  { name: 'Video',    avg: 4.1 },
  { name: 'Document', avg: 2.4 },
];

// Quick stats
const totalPending  = MOCK_APPROVALS.filter(a => a.status === 'pending').length;
const totalApproved = MOCK_APPROVALS.filter(a => a.status === 'approved').length;
const wonDeals = MOCK_LEADS.filter(l => l.stage === 'won');
const totalPipeline = MOCK_LEADS.reduce((s, l) => s + l.value, 0);
const conversionRate = MOCK_LEADS.length > 0
  ? Math.round((wonDeals.length / MOCK_LEADS.length) * 100)
  : 0;

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function Reports() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">Reports</h1>
          <p className="text-sm text-fog mt-0.5">Agency performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-3 py-1.5 rounded-full border text-fog"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            May 2026
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pipeline value',    value: `$${(totalPipeline / 1000).toFixed(0)}k`, color: 'text-silver' },
          { label: 'Win rate',          value: `${conversionRate}%`,                     color: 'text-sage' },
          { label: 'Pending approvals', value: String(totalPending),                     color: totalPending > 0 ? 'text-warm' : 'text-sage' },
          { label: 'Approvals resolved',value: String(totalApproved),                    color: 'text-sage' },
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
        <ReportSection title="Monthly Revenue by Client" subtitle="Active clients only">
          <ResponsiveContainer width="100%" height={220}>
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
              <Bar dataKey="value" name="$MRR" radius={[4, 4, 0, 0]}>
                {revenueData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? SAGE : `rgba(127,163,138,${0.7 - i * 0.1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportSection>

        {/* Pipeline funnel */}
        <ReportSection title="Pipeline Funnel" subtitle="Deal count by stage">
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
              <Bar dataKey="count" name="Deals" radius={[4, 4, 0, 0]}>
                {funnelData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.name === 'Won' ? SAGE : entry.name === 'Negotiation' ? WARM : FOG}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportSection>

        {/* Team utilisation */}
        <ReportSection title="Team Task Distribution" subtitle="Open vs completed tasks per team member">
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
              <Bar dataKey="done" name="Completed" stackId="a" fill={SAGE}   radius={[0, 0, 0, 0]} />
              <Bar dataKey="open" name="Open"      stackId="a" fill={SILVER} radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            {[{ color: SAGE, label: 'Completed' }, { color: SILVER, label: 'Open' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-[11px] text-fog">{l.label}</span>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* Approval cycle time */}
        <ReportSection title="Approval Cycle Time" subtitle="Average days from submission to resolution">
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
              <Bar dataKey="avg" name="Avg days" radius={[4, 4, 0, 0]}>
                {cycleData.map((entry, i) => (
                  <Cell key={i} fill={entry.avg > 5 ? EMBER : entry.avg > 3 ? WARM : SAGE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-fog mt-2">Target: under 3 days · Green = on track · Amber = approaching limit · Red = exceeded</p>
        </ReportSection>

      </div>
    </>
  );
}
