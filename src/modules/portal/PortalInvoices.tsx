'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, CreditCard, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalData } from './usePortalData';
import type { InvoiceStatus } from '@/lib/types';
import { toast } from 'sonner';
import { useLang } from '@/i18n';
import { InvoicePdf, downloadPdf } from '@/components/minerva/PdfExport';
import { CommentSection } from '@/components/minerva/CommentSection';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; class: string }> = {
  draft:     { label: 'Draft',     class: 'text-muted-foreground bg-muted border-border' },
  sent:      { label: 'Due',       class: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' },
  overdue:   { label: 'Overdue',   class: 'text-red-500 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' },
  paid:      { label: 'Paid',      class: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' },
  cancelled: { label: 'Cancelled', class: 'text-muted-foreground bg-muted border-border' },
};

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function PortalInvoices() {
  const { t, lang } = useLang();
  const { isValid, invoices: rawInvoices, projects, token, clientName } = usePortalData();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stripeAvailable, setStripeAvailable] = useState<boolean | null>(null);

  if (!isValid) return null;

  async function handlePay(invoice: any) {
    if (payingId) return;
    setPayingId(invoice.id);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.amount,
          successUrl: `/portal/${token}/invoices?success=true`,
          cancelUrl: `/portal/${token}/invoices?cancelled=true`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        setStripeAvailable(true);
        window.location.href = data.url;
      } else if (data.error === 'stripe_not_configured') {
        setStripeAvailable(false);
        toast.error(t.portal.proposals.stripeNotConfigured);
      } else {
        throw new Error(data.error || 'Failed to create payment session.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Payment initiation failed.');
    } finally {
      setPayingId(null);
    }
  }

  async function handleDownload(invoice: any) {
    if (!token) return;
    try {
      // 1. Log activity via API
      await fetch('/api/portal/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          event: 'invoice_downloaded',
          metadata: { invoiceId: invoice.id, number: invoice.number },
        }),
      });

      // 2. Generate and download PDF
      const doc = <InvoicePdf invoice={invoice} workspaceName="Minerva OS" clientName={clientName} />;
      await downloadPdf(doc, `Invoice-${invoice.number}.pdf`);
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
    }
  }

  // Map to local UI format
  const invoices = rawInvoices.map((inv: any) => {
    const project = projects.find((p: any) => p._id === inv.projectId);
    return {
      ...inv,
      id: inv._id,
      number: inv.invoiceNumber,
      issuedDate: inv.date,
      project: project?.name || '...',
      currency: 'USD',
      paidDate: inv.paid_date || null,
      tps: Number(inv.tps || 0),
      tvq: Number(inv.tvq || 0),
      items: inv.items || [{ description: 'Fulfillment services', quantity: 1, price: inv.amount }],
    };
  });

  const outstanding = invoices
    .filter((i: any) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s: any, i: any) => s + i.amount, 0);
  const paid = invoices
    .filter((i: any) => i.status === 'paid')
    .reduce((s: any, i: any) => s + i.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-normal text-foreground"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}
        >
          {t.app.sidebar.billing}
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          {lang === 'fr' ? 'Votre historique de facturation avec Minerva.' : 'Your billing history with Minerva.'}
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: t.app.billing.summary.outstanding, value: outstanding > 0 ? fmt(outstanding, 'USD') : '—', sub: lang === 'fr' ? 'en attente de paiement' : 'awaiting payment', colorClass: outstanding > 0 ? 'text-amber-600' : 'text-emerald-600' },
          { label: t.app.billing.summary.collected,  value: fmt(paid, 'USD'),   sub: lang === 'fr' ? 'au total' : 'all time',           colorClass: 'text-emerald-600' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-[16px] border border-border bg-card p-5"
          >
            <p className={`text-2xl font-semibold tabular-nums ${s.colorClass}`}>{s.value}</p>
            <p className="text-xs font-medium mt-1 text-foreground">{s.label}</p>
            <p className="text-[11px] mt-0.5 text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      <div className="space-y-2">
        {invoices.length === 0 && (
          <p className="text-sm text-center py-12 text-muted-foreground">{t.app.billing.invoices.empty}</p>
        )}
        {invoices.map((invoice: any, i: number) => {
          const sc = STATUS_CONFIG[invoice.status as InvoiceStatus] || STATUS_CONFIG.draft;
          return (
            <motion.div
              key={invoice.id}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 12 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="rounded-[14px] border border-border bg-card overflow-hidden transition-colors duration-200 hover:border-foreground/15"
            >
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Number + project */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums text-foreground">{invoice.number}</p>
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', sc.class)}>{sc.label}</span>
                  </div>
                  <p className="text-[11px] mt-0.5 truncate text-muted-foreground">
                    {invoice.project} · Issued {new Date(invoice.issuedDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Due date */}
                <div className="hidden sm:block text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {invoice.status === 'paid' && invoice.paidDate
                      ? `Paid ${new Date(invoice.paidDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}`
                      : `Due ${new Date(invoice.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>

                {/* Amount */}
                <p className="text-sm font-semibold tabular-nums shrink-0 text-foreground">
                  {fmt(invoice.amount, invoice.currency)}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {(invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'pending') && (
                    stripeAvailable === false
                      ? <span className="text-[11px] px-2 py-1 rounded-lg text-amber-600 border border-amber-200 dark:border-amber-800" style={{ backgroundColor: 'rgba(184,155,106,0.08)' }}>
                          {t.portal.proposals.stripeNotConfigured}
                        </span>
                      : <button
                          onClick={() => handlePay(invoice)}
                          disabled={payingId !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-emerald-600 border border-emerald-200 dark:border-emerald-800"
                          style={{ backgroundColor: 'rgba(5,150,105,0.08)' }}
                        >
                          <CreditCard size={12} />
                          {payingId === invoice.id ? 'Paying...' : 'Pay'}
                        </button>
                  )}
                  <button
                    onClick={() => handleDownload(invoice)}
                    className="p-1.5 rounded-lg transition-colors duration-200 hover:bg-accent cursor-pointer"
                    title={lang === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
                    aria-label="Download invoice"
                  >
                    <Download size={13} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-muted-foreground border border-border hover:bg-accent"
                  >
                    <MessageSquare size={11} />
                    {expandedId === invoice.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === invoice.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 260, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="p-5 h-full">
                      <CommentSection targetId={invoice.id} targetType="invoice" token={token} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

