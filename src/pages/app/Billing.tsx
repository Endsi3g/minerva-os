import { useState } from 'react';
import { Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MOCK_INVOICES, MOCK_RETAINERS } from '@/lib/mock-data';
import type { Invoice, InvoiceStatus } from '@/lib/types';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; class: string }> = {
  draft:     { label: 'Draft',     class: 'text-fog bg-fog/10 border-fog/20'       },
  sent:      { label: 'Sent',      class: 'text-warm bg-warm/10 border-warm/20'    },
  overdue:   { label: 'Overdue',   class: 'text-ember bg-ember/10 border-ember/20' },
  paid:      { label: 'Paid',      class: 'text-sage bg-sage/10 border-sage/20'    },
  cancelled: { label: 'Cancelled', class: 'text-fog bg-fog/5 border-fog/15'        },
};

type StatusFilter = InvoiceStatus | 'all';

const FILTER_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'sent',    label: 'Sent' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'draft',   label: 'Draft' },
  { id: 'paid',    label: 'Paid' },
];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[invoice.status];

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
          <p className="text-sm font-semibold text-ivory tabular-nums">{invoice.number}</p>
        </div>

        {/* Client + project */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ivory truncate">{invoice.client}</p>
          <p className="text-[11px] text-fog truncate">{invoice.project}</p>
        </div>

        {/* Status */}
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0', sc.class)}>
          {sc.label}
        </span>

        {/* Dates */}
        <div className="hidden md:block text-right shrink-0">
          <p className="text-xs text-fog">
            {invoice.status === 'paid' && invoice.paidDate
              ? `Paid ${new Date(invoice.paidDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
              : `Due ${new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          </p>
        </div>

        {/* Amount */}
        <p className="text-sm font-semibold text-ivory tabular-nums shrink-0 w-20 text-right">
          {fmt(invoice.amount)}
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
                    <th className="text-left py-1.5 font-medium">Description</th>
                    <th className="text-right py-1.5 font-medium w-12">Qty</th>
                    <th className="text-right py-1.5 font-medium w-24">Unit price</th>
                    <th className="text-right py-1.5 font-medium w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="py-1.5 text-silver">{item.description}</td>
                      <td className="py-1.5 text-right text-fog tabular-nums">{item.qty}</td>
                      <td className="py-1.5 text-right text-fog tabular-nums">{fmt(item.unitPrice)}</td>
                      <td className="py-1.5 text-right text-silver tabular-nums font-medium">{fmt(item.qty * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <td colSpan={3} className="pt-2 text-right text-fog font-medium">Total</td>
                    <td className="pt-2 text-right text-ivory font-semibold tabular-nums">{fmt(invoice.amount)}</td>
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
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery]   = useState('');

  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const paidMTD     = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const overdue     = invoices.filter(i => i.status === 'overdue').length;

  const visible = invoices.filter(i => {
    const matchFilter = filter === 'all' || i.status === filter;
    const matchQuery  = query === '' ||
      i.number.toLowerCase().includes(query.toLowerCase()) ||
      i.client.toLowerCase().includes(query.toLowerCase()) ||
      i.project.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">Billing</h1>
          <p className="text-sm text-fog mt-0.5">{invoices.length} invoices · {MOCK_RETAINERS.filter(r => r.status === 'active').length} active retainers</p>
        </div>
        <Button size="sm">
          <Plus size={14} />
          New invoice
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Outstanding',   value: fmt(outstanding), color: outstanding > 0 ? 'text-warm'  : 'text-sage', sub: 'sent + overdue' },
          { label: 'Overdue',       value: String(overdue),  color: overdue > 0      ? 'text-ember' : 'text-sage', sub: overdue > 0 ? 'need follow-up' : 'none' },
          { label: 'Collected',     value: fmt(paidMTD),     color: 'text-sage',   sub: 'total paid' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={cn('text-2xl font-semibold tabular-nums', s.color)}>{s.value}</p>
            <p className="text-xs text-fog mt-1">{s.label}</p>
            <p className="text-[10px] text-fog/60 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Retainers */}
      {MOCK_RETAINERS.filter(r => r.status === 'active').length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-ivory mb-3">Active Retainers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MOCK_RETAINERS.filter(r => r.status === 'active').map(ret => {
              const pct = ret.hoursIncluded > 0 ? Math.round((ret.hoursUsed / ret.hoursIncluded) * 100) : 0;
              const barColor = pct >= 100 ? '#A86A6A' : pct >= 80 ? '#B89B6A' : '#7FA38A';
              return (
                <div key={ret.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-ivory">{ret.client}</p>
                      <p className="text-[10px] text-fog capitalize">{ret.cycle} · renews {new Date(ret.renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <p className="text-sm font-semibold text-ivory tabular-nums">{fmt(ret.amount)}</p>
                  </div>
                  {/* Hours bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-fog mb-1">
                      <span>Hours</span>
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
              placeholder="Search invoices..."
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
            <p className="text-sm text-fog text-center py-10">No invoices match this filter.</p>
          )}
          {visible.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)}
        </div>
      </section>
    </>
  );
}
