'use client';
import { useState } from 'react';
import { TrendingUp, AlertTriangle, Plus, ChevronDown, ChevronUp, DollarSign, Clock, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { TextAnimate } from '@/components/ui/text-animate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';
import { useLang } from '@/i18n';
import {
  useWorkspaces,
  useProjectFinancials,
  useCashForecast,
  usePortfolioClients,
  useBillingDisputes,
  useEstimationTemplates,
  useAddBillingDispute,
  useUpdateBillingDispute,
} from '@/lib/hooks/useSupabase';
import { useAuth } from '@/contexts/AuthContext';
import type { BillingDispute } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, currency = true) {
  if (currency) return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(n);
}

function marginColor(m: number) {
  if (m >= 40) return 'text-sage';
  if (m >= 20) return 'text-amber';
  return 'text-rose';
}

function marginBg(m: number) {
  if (m >= 40) return '#7FA38A';
  if (m >= 20) return '#B89B6A';
  return '#A86A6A';
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KPIProps { label: string; value: string; sub?: string; icon: React.ElementType; spotlight: string }

function KPICard({ label, value, sub, icon: Icon, spotlight }: KPIProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-white/8 bg-midnight p-5', spotlight)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-fog mb-1">{label}</p>
          <p className="text-2xl font-semibold text-ivory">{value}</p>
          {sub && <p className="text-xs text-silver mt-0.5">{sub}</p>}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-fog">
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

// ── Forecast Bar ─────────────────────────────────────────────────────────────

function ForecastBar({ label, invoiced, milestones, max }: { label: string; invoiced: number; milestones: number; max: number }) {
  const total = invoiced + milestones;
  const invW = max > 0 ? (invoiced / max) * 100 : 0;
  const msW = max > 0 ? (milestones / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-silver">{label}</span>
        <span className="text-ivory font-medium">{fmt(total)}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-white/5 gap-px">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${invW}%`, backgroundColor: '#7FA38A' }} />
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${msW}%`, backgroundColor: '#B89B6A' }} />
      </div>
      <div className="flex gap-3 text-[10px] text-fog">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-sage" />{fmt(invoiced)} invoiced</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber" />{fmt(milestones)} milestones</span>
      </div>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { t } = useLang();
  const p = t.app.profitability;
  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id ?? null;
  const financials = useProjectFinancials(workspaceId);
  const forecast = useCashForecast(workspaceId);

  const totalRevenue = (financials ?? []).reduce((s, f) => s + f.recognizedRevenue, 0);
  const avgMargin = (financials ?? []).length > 0
    ? (financials ?? []).reduce((s, f) => s + f.margin, 0) / financials!.length
    : 0;
  const cashNext30 = forecast?.[0]?.expectedRevenue ?? 0;
  const scopeFlagged = (financials ?? []).filter(f => f.scopeFlagged).length;

  const maxForecast = Math.max(...(forecast ?? []).map(b => b.expectedRevenue), 1);

  return (
    <div className="space-y-6">
      {scopeFlagged > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-sm text-amber">
          <AlertTriangle size={15} />
          {p.scopeAlert.replace('{{count}}', String(scopeFlagged))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label={p.kpi.totalRevenue} value={fmt(totalRevenue)} icon={DollarSign} spotlight="spotlight-sage" />
        <KPICard label={p.kpi.avgMargin} value={`${fmt(avgMargin, false)}%`} icon={TrendingUp} spotlight="spotlight-amber" />
        <KPICard label={p.kpi.cashNext30} value={fmt(cashNext30)} icon={Clock} spotlight="spotlight-sage" />
        <KPICard label={p.kpi.openDisputes} value="—" icon={AlertTriangle} spotlight="" />
      </div>

      <div className="rounded-xl border border-border bg-midnight p-5 space-y-4">
        <h3 className="text-sm font-medium text-ivory">{p.forecast.title}</h3>
        {forecast === null ? (
          <div className="h-20 animate-pulse bg-white/5 rounded-lg" />
        ) : (
          <div className="space-y-4">
            <ForecastBar label={p.forecast.next30} invoiced={forecast[0]?.invoicedAmount ?? 0} milestones={forecast[0]?.milestoneRevenue ?? 0} max={maxForecast} />
            <ForecastBar label={p.forecast.next60} invoiced={forecast[1]?.invoicedAmount ?? 0} milestones={forecast[1]?.milestoneRevenue ?? 0} max={maxForecast} />
            <ForecastBar label={p.forecast.next90} invoiced={forecast[2]?.invoicedAmount ?? 0} milestones={forecast[2]?.milestoneRevenue ?? 0} max={maxForecast} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Project Row ───────────────────────────────────────────────────────────────

function ProjectFinancialRow({ fin }: { fin: any }) {
  const { t } = useLang();
  const p = t.app.profitability.project;
  const [open, setOpen] = useState(false);

  const budgetUsedPct = fin.budget > 0 ? Math.min((fin.loggedCost / fin.budget) * 100, 100) : 0;
  const hoursUsedPct = fin.estimatedHours > 0 ? Math.min((fin.loggedHours / fin.estimatedHours) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-midnight overflow-hidden">
      <button
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/3 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-ivory truncate">{fin.projectName}</span>
            <span className="text-xs text-fog">{fin.clientName}</span>
            {fin.scopeFlagged && (
              <Badge className="text-[10px] px-1.5 py-0 border-amber/40 bg-amber/10 text-amber">
                <AlertTriangle size={9} className="mr-0.5" />
                {p.scopeFlagged}
              </Badge>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
          <div>
            <p className="text-[10px] text-fog">{p.budget}</p>
            <p className="text-xs text-silver">{fmt(fin.budget)}</p>
          </div>
          <div>
            <p className="text-[10px] text-fog">{p.spent}</p>
            <p className="text-xs text-silver">{fmt(fin.loggedCost)}</p>
          </div>
          <div>
            <p className="text-[10px] text-fog">{p.margin}</p>
            <p className={cn('text-xs font-medium', marginColor(fin.margin))}>{fmt(fin.margin, false)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-fog">{p.recognizedRevenue}</p>
            <p className="text-xs text-silver">{fmt(fin.recognizedRevenue)}</p>
          </div>
        </div>

        <div className="text-fog shrink-0">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5 px-4 pb-4 pt-3 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-fog">{p.budget} usage</span>
                  <span className="text-silver">{fmt(fin.loggedCost)} / {fmt(fin.budget)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${budgetUsedPct}%`, backgroundColor: marginBg(100 - budgetUsedPct) }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-fog">{p.hours}</span>
                  <span className="text-silver">{fmt(fin.loggedHours, false)}h / {fmt(fin.estimatedHours, false)}h</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${hoursUsedPct}%`, backgroundColor: '#7FA38A' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Projects Tab ─────────────────────────────────────────────────────────────

function ProjectsTab() {
  const { t } = useLang();
  const p = t.app.profitability;
  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id ?? null;
  const financials = useProjectFinancials(workspaceId);

  if (financials === null) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (financials.length === 0) {
    return (
      <div className="py-16 text-center text-fog text-sm">{p.noProjects}</div>
    );
  }

  return (
    <div className="space-y-2">
      {financials.map(fin => (
        <ProjectFinancialRow key={fin.projectId} fin={fin} />
      ))}
    </div>
  );
}

// ── Portfolio Tab ─────────────────────────────────────────────────────────────

function PortfolioTab() {
  const { t } = useLang();
  const p = t.app.profitability.portfolio;
  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id ?? null;
  const portfolio = usePortfolioClients(workspaceId);

  if (portfolio === null) {
    return <div className="h-32 rounded-xl bg-white/5 animate-pulse" />;
  }

  return (
    <div className="rounded-xl border border-border bg-midnight overflow-hidden">
      <div className="grid grid-cols-5 gap-4 px-4 py-2.5 border-b border-white/5">
        {[p.client, p.totalBudget, p.revenue, p.projects, p.avgMargin].map(h => (
          <span key={h} className="text-[10px] text-fog uppercase tracking-wider">{h}</span>
        ))}
      </div>
      {portfolio.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-fog">No client data yet.</div>
      ) : (
        portfolio.map(c => (
          <div key={c.clientId} className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
            <span className="text-sm text-silver truncate">{c.clientName}</span>
            <span className="text-sm text-silver">{fmt(c.totalBudget)}</span>
            <span className="text-sm text-silver">{fmt(c.totalRevenue)}</span>
            <span className="text-sm text-silver">{c.activeProjects}</span>
            <span className={cn('text-sm font-medium', marginColor(c.avgMargin))}>{fmt(c.avgMargin, false)}%</span>
          </div>
        ))
      )}
    </div>
  );
}

// ── Disputes Tab ─────────────────────────────────────────────────────────────

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  open: 'border-rose/40 bg-rose/10 text-rose',
  under_review: 'border-amber/40 bg-amber/10 text-amber',
  resolved: 'border-sage/40 bg-sage/10 text-sage',
  dismissed: 'border-white/20 bg-white/5 text-fog',
};

function DisputeCard({ dispute, onResolve, onDismiss }: { dispute: BillingDispute; onResolve: (id: string) => void; onDismiss: (id: string) => void }) {
  const { t } = useLang();
  const p = t.app.profitability.disputes;
  return (
    <div className="rounded-xl border border-border bg-midnight p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ivory">{dispute.title}</p>
          {dispute.description && <p className="text-xs text-fog mt-0.5 line-clamp-2">{dispute.description}</p>}
        </div>
        <Badge className={cn('text-[10px] shrink-0', DISPUTE_STATUS_COLORS[dispute.status])}>
          {p.status[dispute.status as keyof typeof p.status]}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-fog">{p.amount}: <span className="text-silver font-medium">{fmt(dispute.amountDisputed)}</span></span>
        {dispute.status === 'open' && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="h-7 text-xs text-fog hover:text-silver" onClick={() => onDismiss(dispute.id)}>
              {p.dismiss}
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => onResolve(dispute.id)}>
              {p.resolve}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface NewDisputeForm {
  title: string;
  description: string;
  amountDisputed: string;
}

const EMPTY_DISPUTE: NewDisputeForm = { title: '', description: '', amountDisputed: '' };

function DisputesTab() {
  const { t } = useLang();
  const p = t.app.profitability.disputes;
  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id ?? null;
  const { user } = useAuth();
  const disputes = useBillingDisputes(workspaceId);
  const addDispute = useAddBillingDispute();
  const updateDispute = useUpdateBillingDispute();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewDisputeForm>(EMPTY_DISPUTE);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.title.trim() || !workspaceId) return;
    setSaving(true);
    try {
      await addDispute({
        workspaceId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        amountDisputed: parseFloat(form.amountDisputed) || 0,
        createdBy: user?.id,
      });
      setSheetOpen(false);
      setForm(EMPTY_DISPUTE);
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(id: string) {
    await updateDispute({ id, status: 'resolved', resolvedBy: user?.id });
  }

  async function handleDismiss(id: string) {
    await updateDispute({ id, status: 'dismissed', resolvedBy: user?.id });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-fog">{(disputes ?? []).length} disputes</span>
        <Button size="sm" onClick={() => { setForm(EMPTY_DISPUTE); setSheetOpen(true); }}>
          <Plus size={14} />
          {p.newDispute}
        </Button>
      </div>

      {disputes === null ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
      ) : disputes.length === 0 ? (
        <div className="py-16 text-center text-fog text-sm">{t.app.profitability.noDisputes}</div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <DisputeCard key={d.id} dispute={d} onResolve={handleResolve} onDismiss={handleDismiss} />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-96 p-6 flex flex-col gap-5">
          <SheetHeader>
            <SheetTitle>{p.newDispute}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>{p.form.title}</Label>
              <Input placeholder={p.form.titlePlaceholder} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{p.form.description}</Label>
              <Textarea placeholder={p.form.descriptionPlaceholder} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>{p.form.amount}</Label>
              <Input type="number" placeholder="0.00" value={form.amountDisputed} onChange={e => setForm(f => ({ ...f, amountDisputed: e.target.value }))} />
            </div>
          </div>
          <Button className="w-full" disabled={!form.title.trim() || saving} onClick={handleSave}>
            {p.form.save}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Estimation Templates Tab ──────────────────────────────────────────────────

function EstimationCard({ tpl }: { tpl: any }) {
  const { t } = useLang();
  const p = t.app.profitability.estimation;
  const revenue = tpl.estimatedHours * tpl.sellRate;
  const cost = tpl.estimatedHours * tpl.costRate;
  const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-midnight p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-ivory">{tpl.name}</p>
            {tpl.isBuiltin && (
              <Badge className="text-[10px] px-1.5 border-amber/30 bg-amber/8 text-amber">{p.builtIn}</Badge>
            )}
          </div>
          <p className="text-xs text-fog mt-0.5">{tpl.serviceType} · {tpl.estimatedHours}{p.hours}</p>
        </div>
        <Button size="sm" variant="ghost" className="shrink-0 text-xs h-7 border border-white/12 hover:bg-white/5">
          {p.useTemplate}
        </Button>
      </div>
      <div className="flex gap-4 text-[11px]">
        <span className="text-fog">{p.sellRate}: <span className="text-silver">{fmt(tpl.sellRate)}/h</span></span>
        <span className="text-fog">{p.costRate}: <span className="text-silver">{fmt(tpl.costRate)}/h</span></span>
        <span className="text-fog">{p.margin}: <span className={cn('font-medium', marginColor(margin))}>{fmt(margin, false)}%</span></span>
      </div>
      {tpl.lineItems?.length > 0 && (
        <div className="border-t border-white/5 pt-2.5 space-y-1">
          {tpl.lineItems.map((li: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="text-fog truncate">{li.label}</span>
              <span className="text-silver shrink-0 ml-2">{li.hours}{p.hours}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function Profitability() {
  const { t } = useLang();
  const p = t.app.profitability;
  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id ?? null;
  const financials = useProjectFinancials(workspaceId);
  const templates = useEstimationTemplates(workspaceId);

  const projectCount = financials?.length ?? 0;
  const avgMargin = (financials ?? []).length > 0
    ? (financials ?? []).reduce((s, f) => s + f.margin, 0) / financials!.length
    : 0;

  const tabs = [
    {
      id: 0,
      label: p.tabOverview,
      content: <OverviewTab />,
    },
    {
      id: 1,
      label: p.tabProjects,
      content: <ProjectsTab />,
    },
    {
      id: 2,
      label: p.tabPortfolio,
      content: <PortfolioTab />,
    },
    {
      id: 3,
      label: p.tabDisputes,
      content: <DisputesTab />,
    },
  ];

  return (
    <>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <TextAnimate text={p.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
          <p className="text-sm text-fog mt-0.5">
            {p.subtitle
              .replace('{{projects}}', String(projectCount))
              .replace('{{margin}}', fmt(avgMargin, false))}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="ghost" className="text-xs border border-white/12 h-8" onClick={() => {
            if (workspaceId) {
              fetch('/api/finance/scope-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceId }),
              }).catch(() => null);
            }
          }}>
            <Target size={13} className="mr-1.5" />
            Check scope
          </Button>
        </div>
      </div>

      <DirectionAwareTabs tabs={tabs} />

      {templates !== null && templates.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-ivory mb-3">{p.estimation.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => (
              <EstimationCard key={tpl.id} tpl={tpl} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
