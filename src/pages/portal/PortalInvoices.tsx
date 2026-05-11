import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Download, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalData } from './usePortalData';
import type { InvoiceStatus } from '@/lib/types';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; class: string }> = {
  draft:     { label: 'Draft',    class: 'text-[#8A9099] bg-[#8A9099]/10 border-[#8A9099]/20' },
  sent:      { label: 'Due',      class: 'text-[#B89B6A] bg-[#B89B6A]/10 border-[#B89B6A]/20' },
  overdue:   { label: 'Overdue',  class: 'text-[#A86A6A] bg-[#A86A6A]/10 border-[#A86A6A]/20' },
  paid:      { label: 'Paid',     class: 'text-[#7FA38A] bg-[#7FA38A]/10 border-[#7FA38A]/20' },
  cancelled: { label: 'Cancelled',class: 'text-[#8A9099] bg-[#8A9099]/10 border-[#8A9099]/15' },
};

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function PortalInvoices() {
  const { isValid, invoices } = usePortalData();

  if (!isValid) return <Navigate to="/" replace />;

  const outstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + i.amount, 0);
  const paid = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-normal"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}
        >
          Invoices
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A9099' }}>
          Your billing history with Uprising Studio.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Outstanding', value: outstanding > 0 ? fmt(outstanding, 'USD') : '—', sub: 'awaiting payment', color: outstanding > 0 ? '#B89B6A' : '#7FA38A' },
          { label: 'Total paid',  value: fmt(paid, 'USD'),   sub: 'all time',           color: '#7FA38A' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-[16px] border p-5"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-2xl font-semibold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: '#F5F1E8' }}>{s.label}</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#8A9099' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      <div className="space-y-2">
        {invoices.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: '#8A9099' }}>No invoices yet.</p>
        )}
        {invoices.map((invoice, i) => {
          const sc = STATUS_CONFIG[invoice.status];
          return (
            <motion.div
              key={invoice.id}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 12 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="flex items-center gap-4 px-5 py-4 rounded-[14px] border transition-colors duration-200 hover:border-white/10"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {/* Number + project */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold tabular-nums" style={{ color: '#F5F1E8' }}>{invoice.number}</p>
                  <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', sc.class)}>{sc.label}</span>
                </div>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: '#8A9099' }}>
                  {invoice.project} · Issued {new Date(invoice.issuedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Due date */}
              <div className="hidden sm:block text-right shrink-0">
                <p className="text-xs" style={{ color: '#8A9099' }}>
                  {invoice.status === 'paid' && invoice.paidDate
                    ? `Paid ${new Date(invoice.paidDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                    : `Due ${new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                </p>
              </div>

              {/* Amount */}
              <p className="text-sm font-semibold tabular-nums shrink-0" style={{ color: '#F5F1E8' }}>
                {fmt(invoice.amount, invoice.currency)}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: 'rgba(127,163,138,0.10)',
                      border: '1px solid rgba(127,163,138,0.22)',
                      color: '#7FA38A',
                    }}
                  >
                    <CreditCard size={12} />
                    Pay
                  </button>
                )}
                <button
                  className="p-1.5 rounded-lg transition-colors duration-200 hover:bg-white/5"
                  title="Download PDF"
                  aria-label="Download invoice"
                >
                  <Download size={13} style={{ color: '#8A9099' }} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
