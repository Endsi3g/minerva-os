import { useState, useMemo } from 'react';
import { Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLang } from '@/i18n';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function fmt(n: number, lang: string) {
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 0 
  }).format(n);
}

function InvoiceRow({ invoice, t, lang, clients }: { invoice: Doc<"invoices">; t: any; lang: string, clients: Doc<"clients">[] }) {
  const [expanded, setExpanded] = useState(false);
  const b = t.app.billing;
  const common = t.app.common;
  
  const client = clients.find(c => c._id === invoice.clientId);

  const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
    draft:     { label: common.status.draft,     class: 'text-fog bg-fog/10 border-fog/20'       },
    sent:      { label: common.status.pending,   class: 'text-warm bg-warm/10 border-warm/20'    },
    overdue:   { label: common.status.overdue,   class: 'text-ember bg-ember/10 border-ember/20' },
    paid:      { label: common.status.paid,      class: 'text-sage bg-sage/10 border-sage/20'    },
    cancelled: { label: common.status.rejected, class: 'text-fog bg-fog/5 border-fog/15'        },
  };

  const sc = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;

  return (
    <div
      className="rounded-xl border overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/[0.015]"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Number */}
        <div className="w-32 shrink-0">
          <p className="text-sm font-semibold text-ivory tabular-nums">{invoice.invoiceNumber}</p>
        </div>

        {/* Client + project */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ivory truncate">{client?.company || '...'}</p>
        </div>

        {/* Status */}
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0', sc.class)}>
          {sc.label}
        </span>

        {/* Dates */}
        <div className="hidden md:block text-right shrink-0">
          <p className="text-xs text-fog">
            {invoice.status === 'paid'
              ? `${b.invoices.paid} ${new Date(invoice.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}`
              : `${b.invoices.due} ${new Date(invoice.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}`}
          </p>
        </div>

        {/* Amount */}
        <p className="text-sm font-semibold text-ivory tabular-nums shrink-0 w-20 text-right">
          {fmt(invoice.amount, lang)}
        </p>

        {/* Expand toggle */}
        <div className="text-fog shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Line items */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-fog uppercase tracking-wider">
                    <th className="text-left py-1.5 font-medium">{b.table.description}</th>
                    <th className="text-right py-1.5 font-medium w-12">{b.table.qty}</th>
                    <th className="text-right py-1.5 font-medium w-24">{b.table.unitPrice}</th>
                    <th className="text-right py-1.5 font-medium w-24">{b.table.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: any, i: number) => (
                    <tr key={i} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="py-1.5 text-silver">{item.description}</td>
                      <td className="py-1.5 text-right text-fog tabular-nums">{item.quantity}</td>
                      <td className="py-1.5 text-right text-fog tabular-nums">{fmt(item.price, lang)}</td>
                      <td className="py-1.5 text-right text-silver tabular-nums font-medium">{fmt(item.quantity * item.price, lang)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <td colSpan={3} className="pt-2 text-right text-fog font-medium">Total</td>
                    <td className="pt-2 text-right text-ivory font-semibold tabular-nums">{fmt(invoice.amount, lang)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Billing() {
  const { t, lang } = useLang();
  const b = t.app.billing;

  const invoices = useQuery(api.invoices.list) ?? [];
  const retainersRaw = useQuery(api.retainers.list) ?? [];
  const clients = useQuery(api.clients.list) ?? [];

  const createInvoice = useMutation(api.invoices.create);

  const [filter, setFilter] = useState<string | 'all'>('all');
  const [query, setQuery]   = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({
    clientId: '' as Id<"clients"> | '',
    amount: '',
    description: '',
  });

  const workspaces = useQuery(api.workspaces.list) ?? [];
  const workspaceId = workspaces[0]?._id;

  const FILTER_TABS = useMemo(() => [
    { id: 'all' as const,     label: t.app.tasks.filters.all },
    { id: 'sent' as const,    label: t.app.common.status.pending },
    { id: 'overdue' as const, label: t.app.common.status.overdue },
    { id: 'draft' as const,   label: t.app.common.status.draft },
    { id: 'paid' as const,    label: t.app.common.status.paid },
  ], [t]);

  const outstanding = invoices.filter((i: any) => i.status === 'sent' || i.status === 'overdue').reduce((s: any, i: any) => s + i.amount, 0);
  const revenue = invoices.filter((inv: any) => inv.status === 'paid').reduce((s: any, i: any) => s + i.amount, 0);
  const overdueCount = invoices.filter((i: any) => i.status === 'overdue').length;

  const retainers = useMemo(() => retainersRaw.map((r: any) => {
    const client = clients.find((c: any) => c._id === r.clientId);
    return {
      ...r,
      clientName: client?.company || '...',
    };
  }), [retainersRaw, clients]);

  const activeRetainers = retainers.filter((r: any) => r.status === 'active');

  const visible = invoices.filter((i: any) => {
    const matchFilter = filter === 'all' || i.status === filter;
    const matchQuery  = query === '' ||
      i.invoiceNumber.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  async function handleAdd() {
    if (!form.clientId || !form.amount) return;
    
    const amountNum = parseFloat(form.amount);
    const tps = amountNum * 0.05;
    const tvq = amountNum * 0.09975;

    await createInvoice({
      workspaceId,
      clientId: form.clientId as Id<"clients">,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      amount: amountNum,
      status: 'sent',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{
        description: form.description || 'Consulting Services',
        quantity: 1,
        price: amountNum,
      }],
      tps,
      tvq,
    });

    setSheetOpen(false);
    setForm({ clientId: '', amount: '', description: '' });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{b.title}</h1>
          <p className="text-sm text-fog mt-0.5">
            {b.stats
              .replace('invoices', String(invoices.length))
              .replace('active retainers', String(activeRetainers.length))}
          </p>
        </div>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          <Plus size={14} />
          {b.newInvoice}
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: b.summary.outstanding,   value: fmt(outstanding, lang), color: outstanding > 0 ? 'text-warm'  : 'text-sage', sub: b.summary.outstandingSub },
          { label: b.summary.overdue,       value: String(overdueCount),  color: overdueCount > 0      ? 'text-ember' : 'text-sage', sub: overdueCount > 0 ? b.summary.overdueSub : b.summary.overdueNone },
          { label: b.summary.collected,     value: fmt(revenue, lang),     color: 'text-sage',   sub: b.summary.collectedSub },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={cn('text-2xl font-semibold tabular-nums', s.color)}>{s.value}</p>
            <p className="text-xs text-fog mt-1">{s.label}</p>
            <p className="text-[10px] text-fog/60 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Retainers */}
      {activeRetainers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-ivory mb-3">{b.retainers.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeRetainers.map((ret: any) => {
              const pct = ret.hoursIncluded > 0 ? Math.round((ret.hoursUsed / ret.hoursIncluded) * 100) : 0;
              const barColor = pct >= 100 ? '#A86A6A' : pct >= 80 ? '#B89B6A' : '#7FA38A';
              return (
                <div key={ret._id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-ivory">{ret.clientName}</p>
                      <p className="text-[10px] text-fog capitalize">
                        {ret.cycle} · {b.retainers.renews} {new Date(ret.renewalDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-ivory tabular-nums">{fmt(ret.amount, lang)}</p>
                  </div>
                  {/* Hours bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-fog mb-1">
                      <span>{b.retainers.hours}</span>
                      <span>{ret.hoursUsed} / {ret.hoursIncluded}h</span>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden bg-dusk">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                  {ret.notes && <p className="text-[11px] text-fog/60 mt-2 leading-relaxed">{ret.notes}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Invoices */}
      <section>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Filters */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border w-fit">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  filter === tab.id ? 'bg-dusk text-ivory' : 'text-fog hover:text-silver'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
            <input
              type="text"
              placeholder={b.invoices.searchPlaceholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs text-ivory placeholder:text-fog outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {visible.length === 0 && (
            <p className="text-sm text-fog text-center py-10">{b.invoices.empty}</p>
          )}
          {visible.map(inv => <InvoiceRow key={inv._id} invoice={inv} t={t} lang={lang} clients={clients} />)}
        </div>
      </section>

      {/* New Invoice Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>{b.newInvoice}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label>{b.table.client}</Label>
              <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v as Id<"clients"> }))}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>{c.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{b.table.total}</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={form.amount} 
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} 
              />
            </div>
            <div className="space-y-1.5">
              <Label>{b.table.description}</Label>
              <Input 
                placeholder="Service description" 
                value={form.description} 
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
              />
            </div>
          </div>

          <Button className="w-full" onClick={handleAdd}>{t.app.common.add}</Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
