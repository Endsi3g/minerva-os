'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Copy, Check, BarChart2, CheckCircle2, Clock, FileText } from 'lucide-react';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-muted">
      <div className="h-full rounded-full transition-all duration-700 bg-emerald-600" style={{ width: `${pct}%` }} />
    </div>
  );
}

interface ShareModalProps {
  url: string;
  onClose: () => void;
  t: any;
}

function ShareModal({ url, onClose, t }: ShareModalProps) {
  const sm = t.portal.reports.shareModal;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[18px] border border-border bg-card p-6 w-full max-w-md"
      >
        <h2 className="text-base font-semibold mb-1 text-foreground">{sm.title}</h2>
        <p className="text-sm mb-4 text-muted-foreground">{sm.desc}</p>

        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 px-3 py-2 rounded-xl text-xs outline-none select-all bg-muted border border-border text-muted-foreground"
          />
          <button
            onClick={copy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border ${
              copied
                ? 'text-emerald-600 border-emerald-200 dark:border-emerald-800'
                : 'text-foreground border-border hover:bg-accent'
            }`}
            style={{ backgroundColor: copied ? 'rgba(5,150,105,0.08)' : undefined }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? sm.copied : sm.copy}
          </button>
        </div>

        <p className="text-[11px] mt-3 text-muted-foreground">{sm.expiry}</p>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2 rounded-xl text-sm transition-colors duration-200 hover:bg-accent cursor-pointer text-muted-foreground border border-border"
        >
          {t.app.common.close || 'Close'}
        </button>
      </motion.div>
    </div>
  );
}

export default function PortalReports() {
  const { t } = useLang();
  const pr = t.portal.reports;
  const { isValid, projects, tasks, approvals, invoices, token, scopes } = usePortalData();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  if (!isValid) return null;
  if (!scopes.includes('reports')) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">Reports are not enabled for this portal.</p>
      </div>
    );
  }

  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const doneTasks = tasks.filter((t: any) => t.status === 'done').length;
  const pendingApprovals = approvals.filter((a: any) => a.status === 'pending').length;
  const paidTotal = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.amount || 0), 0);

  const approvalStats = {
    approved: approvals.filter((a: any) => a.status === 'approved').length,
    revision: approvals.filter((a: any) => a.status === 'revision').length,
    pending: pendingApprovals,
  };
  const outstanding = invoices.filter((i: any) => i.status === 'sent').reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const overdue = invoices.filter((i: any) => i.status === 'overdue').reduce((s: number, i: any) => s + Number(i.amount || 0), 0);

  const projectProgress = projects
    .filter((p: any) => p.status === 'active')
    .map((p: any) => {
      const pt = tasks.filter((t: any) => t.projectId === p._id);
      const done = pt.filter((t: any) => t.status === 'done').length;
      return { name: p.name, pct: pt.length > 0 ? Math.round((done / pt.length) * 100) : 0, status: p.status };
    });

  const kpis = [
    { label: pr.kpis.activeProjects,  value: String(activeProjects), icon: BarChart2,    color: '#7FA38A' },
    { label: pr.kpis.tasksCompleted,   value: String(doneTasks),      icon: CheckCircle2, color: '#7FA38A' },
    { label: pr.kpis.activeProjects,   value: String(pendingApprovals), icon: Clock,      color: pendingApprovals > 0 ? '#B89B6A' : '#7FA38A' },
    { label: pr.kpis.totalPaid,        value: fmt(paidTotal),          icon: FileText,    color: '#7FA38A' },
  ];
  // Fix kpi labels
  kpis[0].label = pr.kpis.activeProjects;
  kpis[1].label = pr.kpis.tasksCompleted;
  kpis[2].label = pr.kpis.approvalRate;
  kpis[3].label = pr.kpis.totalPaid;

  async function handleShare() {
    if (!token || sharing) return;
    setSharing(true);
    try {
      const res = await fetch('/api/portal/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          data: {
            kpis: { activeProjects, tasksCompleted: doneTasks, pendingApprovals, invoicesPaid: paidTotal },
            projectProgress,
            approvalStats,
            invoiceSummary: { paid: paidTotal, outstanding, overdue },
          },
        }),
      });
      const d = await res.json();
      if (d.shareUrl) setShareUrl(d.shareUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-8">
      {shareUrl && <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} t={t} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-foreground" style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}>
            {pr.title}
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">{pr.subtitle}</p>
        </div>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 shrink-0 cursor-pointer text-foreground border border-border hover:bg-accent"
        >
          <Share2 size={13} />
          {sharing ? '...' : pr.shareButton}
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label + i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="rounded-[14px] border border-border bg-card p-4"
            >
              <Icon size={14} style={{ color: k.color, marginBottom: 8 }} />
              <p className="text-2xl font-semibold tabular-nums" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[11px] mt-1 text-muted-foreground">{k.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Project progress */}
      {projectProgress.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <h2 className="text-sm font-semibold mb-4 text-foreground">{pr.charts.projectProgress}</h2>
          <div className="space-y-4">
            {projectProgress.map((p: { name: string; pct: number; status: string }) => (
              <div key={p.name} className="rounded-[12px] border border-border bg-card p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-foreground">{p.name}</span>
                  <span className="text-xs tabular-nums text-emerald-600">{p.pct}%</span>
                </div>
                <ProgressBar pct={p.pct} />
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Bottom stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <h2 className="text-sm font-semibold mb-3 text-foreground">{pr.charts.approvals}</h2>
          <div className="rounded-[12px] border border-border bg-card p-4 space-y-2.5">
            {[
              { label: 'Approved',          value: approvalStats.approved, colorClass: 'text-emerald-600' },
              { label: 'Changes requested', value: approvalStats.revision, colorClass: 'text-red-500'     },
              { label: 'Pending',           value: approvalStats.pending,  colorClass: 'text-amber-600'   },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className={`text-xs font-semibold tabular-nums ${row.colorClass}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="text-sm font-semibold mb-3 text-foreground">{pr.charts.invoices}</h2>
          <div className="rounded-[12px] border border-border bg-card p-4 space-y-2.5">
            {[
              { label: 'Paid',        value: fmt(paidTotal),    colorClass: 'text-emerald-600' },
              { label: 'Outstanding', value: fmt(outstanding),  colorClass: outstanding > 0 ? 'text-amber-600' : 'text-muted-foreground' },
              { label: 'Overdue',     value: fmt(overdue),      colorClass: overdue > 0 ? 'text-red-500' : 'text-muted-foreground' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className={`text-xs font-semibold tabular-nums ${row.colorClass}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
