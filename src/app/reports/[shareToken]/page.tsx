'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'motion/react';
import { BarChart2, CheckCircle2, Clock, FileText } from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: '#7FA38A' }} />
    </div>
  );
}

export default function PublicReportPage() {
  const params = useParams();
  const shareToken = params?.shareToken as string;
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shareToken) return;
    fetch(`/api/portal/reports/share?token=${shareToken}`)
      .then(r => r.ok ? r.json() : Promise.reject('not_found'))
      .then(d => setSnapshot(d))
      .catch(() => setError('This report link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0D14' }}>
        <div className="text-sm animate-pulse" style={{ color: '#8A9099' }}>Loading report...</div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0D14' }}>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium" style={{ color: '#F5F1E8' }}>Report unavailable</p>
          <p className="text-xs" style={{ color: '#8A9099' }}>{error || 'This report could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const { data, generatedAt } = snapshot;

  const kpis = [
    { label: 'Active projects',       value: data.kpis.activeProjects,   icon: BarChart2,    color: '#7FA38A' },
    { label: 'Tasks completed',        value: data.kpis.tasksCompleted,   icon: CheckCircle2, color: '#7FA38A' },
    { label: 'Pending approvals',      value: data.kpis.pendingApprovals, icon: Clock,        color: data.kpis.pendingApprovals > 0 ? '#B89B6A' : '#7FA38A' },
    { label: 'Invoices paid',          value: fmt(data.kpis.invoicesPaid), icon: FileText,    color: '#7FA38A' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0D14', fontFamily: "'Inter', sans-serif" }}>
      <header className="border-b px-6 py-4 flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#F5F1E8' }}>
          <span className="text-[10px] font-bold" style={{ color: '#0A0D14' }}>M</span>
        </div>
        <span className="text-sm font-semibold" style={{ color: '#F5F1E8' }}>Minerva</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(127,163,138,0.10)', color: '#7FA38A', border: '1px solid rgba(127,163,138,0.20)' }}>
          Shared report
        </span>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: '#8A9099' }}>
          Generated {new Date(generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-2xl font-normal mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8' }}>
            Project Report
          </h1>
          <p className="text-sm" style={{ color: '#8A9099' }}>A snapshot of your engagement with Uprising Studio.</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="rounded-[14px] border p-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <Icon size={14} style={{ color: k.color, marginBottom: 8 }} />
                <p className="text-2xl font-semibold tabular-nums" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[11px] mt-1" style={{ color: '#8A9099' }}>{k.label}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#F5F1E8' }}>Project progress</h2>
          <div className="space-y-4">
            {data.projectProgress.map((p: any) => (
              <div key={p.name} className="rounded-[12px] border p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm" style={{ color: '#F5F1E8' }}>{p.name}</span>
                  <span className="text-xs tabular-nums" style={{ color: '#7FA38A' }}>{p.pct}%</span>
                </div>
                <ProgressBar value={p.pct} max={100} />
              </div>
            ))}
          </div>
        </motion.section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#F5F1E8' }}>Approvals</h2>
            <div className="rounded-[12px] border p-4 space-y-2" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Approved',          value: data.approvalStats.approved,  color: '#7FA38A' },
                { label: 'Changes requested', value: data.approvalStats.revision,  color: '#A86A6A' },
                { label: 'Pending review',    value: data.approvalStats.pending,   color: '#B89B6A' },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-xs" style={{ color: '#8A9099' }}>{row.label}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#F5F1E8' }}>Invoices</h2>
            <div className="rounded-[12px] border p-4 space-y-2" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Paid',        value: fmt(data.invoiceSummary.paid),        color: '#7FA38A' },
                { label: 'Outstanding', value: fmt(data.invoiceSummary.outstanding), color: data.invoiceSummary.outstanding > 0 ? '#B89B6A' : '#8A9099' },
                { label: 'Overdue',     value: fmt(data.invoiceSummary.overdue),     color: data.invoiceSummary.overdue > 0 ? '#A86A6A' : '#8A9099' },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-xs" style={{ color: '#8A9099' }}>{row.label}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        <footer className="pt-4 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs" style={{ color: '#8A9099' }}>Powered by Minerva OS · Uprising Studio</p>
        </footer>
      </main>
    </div>
  );
}
