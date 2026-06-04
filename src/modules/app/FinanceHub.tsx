'use client';
import { useState, useEffect, useMemo } from 'react';
import { useLang } from '@/i18n';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';
import { supabase } from '@/lib/supabase';
import { useWorkspaces, useInvoices, useRetainers } from '@/lib/hooks/useSupabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, ChevronRight } from 'lucide-react';
import Billing from './Billing';
import Expenses from './Expenses';
import Profitability from './Profitability';
import Finance from './Finance';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function marginColor(pct: number) {
  if (pct >= 40) return '#7FA38A';
  if (pct >= 20) return '#B89B6A';
  return '#A86A6A';
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-[14px] border p-5 flex flex-col gap-1"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <p className="text-[11px] text-fog">{label}</p>
      <p className="text-xl font-semibold text-ivory leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-fog mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── FinanceOverview ─────────────────────────────────────────────────────── */

function FinanceOverview({ onViewAllOverdue }: { onViewAllOverdue: () => void }) {
  const { t } = useLang();
  const ov = t.app.financeHub.overview;

  const workspaces = useWorkspaces();
  const workspaceId = (workspaces as any[])?.[0]?._id ?? null;

  const allInvoices: any[] | null = useInvoices(workspaceId);
  const retainers: any[] | null = useRetainers(workspaceId);

  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    supabase.from('expenses').select('*').eq('workspace_id', workspaceId).then(({ data }) => {
      if (active && data) setExpenses(data);
    });
    return () => { active = false; };
  }, [workspaceId]);

  const today = new Date();
  const thisMonth = today.toISOString().slice(0, 7);

  const mrr = useMemo(() => {
    if (!retainers) return 0;
    return (retainers as any[])
      .filter((r: any) => r.status === 'active')
      .reduce((s: number, r: any) => s + (r.monthlyValue ?? r.monthly_value ?? 0), 0);
  }, [retainers]);

  const collected = useMemo(() => {
    if (!allInvoices) return 0;
    return allInvoices
      .filter((i: any) => i.status === 'paid' && (i.paidDate ?? i.paid_date ?? '').startsWith(thisMonth))
      .reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
  }, [allInvoices, thisMonth]);

  const outstanding = useMemo(() => {
    if (!allInvoices) return 0;
    return allInvoices
      .filter((i: any) => i.status === 'sent' || i.status === 'overdue')
      .reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
  }, [allInvoices]);

  const expensesTotal = useMemo(() => {
    return expenses
      .filter((e: any) => (e.date ?? e.created_at ?? '').startsWith(thisMonth))
      .reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
  }, [expenses, thisMonth]);

  const marginPct = collected > 0 ? Math.round(((collected - expensesTotal) / collected) * 100) : 0;

  // 6-month cash flow data
  const cashflowData = useMemo(() => {
    const months: { label: string; key: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      months.push({
        label: d.toLocaleDateString([], { month: 'short' }),
        key,
        revenue: 0,
      });
    }
    if (allInvoices) {
      allInvoices
        .filter((i: any) => i.status === 'paid')
        .forEach((i: any) => {
          const pd = (i.paidDate ?? i.paid_date ?? '').slice(0, 7);
          const m = months.find(m => m.key === pd);
          if (m) m.revenue += i.amount ?? 0;
        });
    }
    return months;
  }, [allInvoices, today]);

  // Overdue invoices
  const overdueInvoices = useMemo(() => {
    if (!allInvoices) return [];
    const todayStr = today.toISOString().slice(0, 10);
    return allInvoices
      .filter((i: any) => {
        const due = i.dueDate ?? i.due_date ?? '';
        return due < todayStr && i.status !== 'paid';
      })
      .slice(0, 3);
  }, [allInvoices, today]);

  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div className="space-y-6 pt-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={ov.mrr} value={fmt(mrr)} />
        <KpiCard label={ov.collected} value={fmt(collected)} />
        <KpiCard label={ov.outstanding} value={fmt(outstanding)} />
        <KpiCard label={ov.expenses} value={fmt(expensesTotal)} />
      </div>

      {/* Net Margin pill */}
      {collected > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-fog">{ov.margin}</span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${marginColor(marginPct)}20`, color: marginColor(marginPct) }}
          >
            {marginPct}%
          </span>
        </div>
      )}

      {/* Cash Flow Chart */}
      <div
        className="rounded-[14px] border p-5"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs font-medium text-silver mb-4">{ov.cashflow}</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={cashflowData} barSize={24}>
            <XAxis dataKey="label" tick={{ fill: '#8A9099', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#F5F1E8' }}
              formatter={(v) => [fmt(Number(v ?? 0)), '']}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {cashflowData.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.key === thisMonth ? '#7FA38A' : 'rgba(255,255,255,0.10)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Overdue Alerts */}
      <div
        className="rounded-[14px] border p-5"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-silver">{ov.overdueTitle}</p>
          {overdueInvoices.length > 0 && (
            <button
              onClick={onViewAllOverdue}
              className="text-[11px] text-fog hover:text-silver transition-colors flex items-center gap-0.5"
            >
              {ov.viewAll} <ChevronRight size={11} />
            </button>
          )}
        </div>
        {overdueInvoices.length === 0 ? (
          <p className="text-xs text-fog">{ov.noOverdue}</p>
        ) : (
          <div className="space-y-2">
            {overdueInvoices.map((inv: any) => {
              const dueDate = inv.dueDate ?? inv.due_date ?? '';
              const daysOverdue = dueDate
                ? Math.max(0, Math.floor((new Date(todayStr).getTime() - new Date(dueDate).getTime()) / 86400000))
                : 0;
              return (
                <div key={inv._id ?? inv.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle size={13} style={{ color: '#A86A6A', flexShrink: 0 }} />
                    <span className="text-xs text-silver truncate">{inv.client ?? inv.clientName ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-ivory">{fmt(inv.amount ?? 0)}</span>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(168,106,106,0.15)', color: '#A86A6A' }}
                    >
                      {daysOverdue}d overdue
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── FinanceHub ───────────────────────────────────────────────────────────── */

export default function FinanceHub() {
  const { t } = useLang();
  const h = t.app.financeHub;
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: h.tabs.overview,     content: <FinanceOverview onViewAllOverdue={() => setActiveTab(1)} /> },
    { id: 1, label: h.tabs.billing,      content: <Billing /> },
    { id: 2, label: h.tabs.expenses,     content: <Expenses /> },
    { id: 3, label: h.tabs.profitability, content: <Profitability /> },
    { id: 4, label: h.tabs.ledger,       content: <Finance /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold text-ivory"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {h.title}
        </h1>
        <p className="text-sm text-fog mt-1">{h.subtitle}</p>
      </div>
      <DirectionAwareTabs tabs={tabs} className="w-full" activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
