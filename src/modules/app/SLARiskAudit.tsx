'use client';
import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, CheckCircle2, Clock, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface Violation {
  id: string;
  contract: string;
  client: string;
  clause: string;
  severity: Severity;
  flaggedAt: string;
  detail: string;
}

const SEVERITY_META: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  high:     { label: 'High',     color: 'text-warning',     bg: 'bg-warning/10',     border: 'border-warning/30' },
  medium:   { label: 'Medium',   color: 'text-foreground',  bg: 'bg-secondary',      border: 'border-border' },
  low:      { label: 'Low',      color: 'text-muted-foreground', bg: 'bg-secondary/60', border: 'border-border' },
};

const MOCK_VIOLATIONS: Violation[] = [
  {
    id: '1',
    contract: 'Master Service Agreement',
    client: 'Bolt Tech',
    clause: 'Deliverable deadline clause 4.2',
    severity: 'critical',
    flaggedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    detail: 'Project milestone overdue by 8 days. Clause 4.2 stipulates a CAD 500 penalty per day after the 5-day grace period.',
  },
  {
    id: '2',
    contract: 'Retainer Agreement',
    client: 'Nexus Labs',
    clause: 'Scope creep notification (clause 7.1)',
    severity: 'high',
    flaggedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    detail: 'Estimated hours exceeded by 23% over the last billing cycle without a signed change order.',
  },
  {
    id: '3',
    contract: 'NDA — Projet Phoenix',
    client: 'Vertex Capital',
    clause: 'Confidentiality renewal (clause 2.4)',
    severity: 'high',
    flaggedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    detail: 'NDA expires in 12 days. Renewal requires 30-day advance notice per clause 2.4.',
  },
  {
    id: '4',
    contract: 'Design Services Agreement',
    client: 'Sunrise Media',
    clause: 'Payment terms (clause 9.3)',
    severity: 'medium',
    flaggedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    detail: 'Invoice #INV-2024-042 is 15 days past the net-30 window with no follow-up logged.',
  },
  {
    id: '5',
    contract: 'Consulting Retainer',
    client: 'Pinnacle Group',
    clause: 'Monthly reporting (clause 5.1)',
    severity: 'low',
    flaggedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    detail: 'Monthly status report not delivered for the June cycle. Clause 5.1 mandates delivery by the 5th.',
  },
];

const SLA_THRESHOLDS = [
  { label: 'Deliverable grace period',   value: '5 days',  status: 'active' },
  { label: 'Scope overrun alert',         value: '+20%',    status: 'active' },
  { label: 'Invoice follow-up trigger',   value: 'Net +30', status: 'active' },
  { label: 'NDA renewal reminder',        value: '30 days', status: 'active' },
  { label: 'Monthly reporting deadline',  value: '5th',     status: 'active' },
];

function HealthGauge({ score }: { score: number }) {
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  const label = score >= 75 ? 'Healthy' : score >= 50 ? 'At Risk' : 'Critical';
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r="38" fill="none" strokeWidth="8" className="stroke-border" />
          <circle
            cx="48" cy="48" r="38"
            fill="none" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ stroke: color, transition: 'stroke-dashoffset 1.2s cubic-bezier(0.23,1,0.32,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-mono" style={{ color }}>{score}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function ScanningAnimation({ scanning }: { scanning: boolean }) {
  if (!scanning) return null;
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="flex gap-1"
        initial="hidden"
        animate="visible"
      >
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
      <span className="text-xs text-muted-foreground">Scanning contracts...</span>
    </div>
  );
}

function ViolationRow({ v }: { v: Violation }) {
  const [open, setOpen] = useState(false);
  const meta = SEVERITY_META[v.severity];
  const days = Math.round((Date.now() - new Date(v.flaggedAt).getTime()) / 86400000);

  return (
    <div className={cn('rounded-xl border overflow-hidden', meta.border)}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn('w-full flex items-center gap-3 px-4 py-3 text-left', meta.bg)}
      >
        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0', meta.color, meta.bg, meta.border)}>
          {meta.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{v.clause}</p>
          <p className="text-[10px] text-muted-foreground truncate">{v.contract} · {v.client}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock size={10} />
            {days === 0 ? 'Today' : `${days}d ago`}
          </span>
          {open ? <ChevronDown size={13} className="text-muted-foreground" /> : <ChevronRight size={13} className="text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-border bg-surface">
              <p className="text-xs text-muted-foreground leading-relaxed">{v.detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SLARiskAudit() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filter, setFilter] = useState<Severity | 'all'>('all');

  const score = violations.length === 0 ? 100
    : violations.filter(v => v.severity === 'critical').length > 0 ? 42
    : violations.filter(v => v.severity === 'high').length > 0 ? 61
    : 78;

  const runScan = useCallback(async () => {
    setScanning(true);
    setScanned(false);
    setViolations([]);
    await new Promise(r => setTimeout(r, 2200));
    setViolations(MOCK_VIOLATIONS);
    setScanning(false);
    setScanned(true);
  }, []);

  useEffect(() => {
    runScan();
  }, [runScan]);

  const filtered = filter === 'all' ? violations : violations.filter(v => v.severity === filter);
  const counts = {
    critical: violations.filter(v => v.severity === 'critical').length,
    high:     violations.filter(v => v.severity === 'high').length,
    medium:   violations.filter(v => v.severity === 'medium').length,
    low:      violations.filter(v => v.severity === 'low').length,
  };

  return (
    <div className="space-y-6 w-full px-6 py-6 max-w-[1200px] mx-auto select-none">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <ShieldAlert size={20} className="text-primary" />
            SLA Risk Audit
          </h1>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Hermes scans your active contracts and flags clauses at risk of breach before they become costly.
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 h-9 px-4 rounded-full text-xs font-semibold border border-border text-foreground hover:bg-accent/60 transition-all disabled:opacity-50 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Scanning...' : 'Re-scan'}
        </button>
      </header>

      {/* Score + Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-1 bg-surface border border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2">
          <HealthGauge score={scanned ? score : 100} />
          <ScanningAnimation scanning={scanning} />
          {scanned && !scanning && (
            <p className="text-[10px] text-muted-foreground">
              {violations.length} issue{violations.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {(['critical', 'high', 'medium', 'low'] as Severity[]).map(sev => {
          const meta = SEVERITY_META[sev];
          return (
            <div
              key={sev}
              onClick={() => setFilter(f => f === sev ? 'all' : sev)}
              className={cn(
                'bg-surface border rounded-xl p-4 flex flex-col gap-2 cursor-pointer transition-all',
                filter === sev ? cn(meta.bg, meta.border) : 'border-border hover:border-border'
              )}
            >
              <span className={cn('text-[10px] font-bold uppercase tracking-widest', meta.color)}>{meta.label}</span>
              <span className="text-2xl font-bold font-mono text-foreground">{scanning ? '—' : counts[sev]}</span>
              <span className="text-[10px] text-muted-foreground">clause{counts[sev] !== 1 ? 's' : ''} flagged</span>
            </div>
          );
        })}
      </div>

      {/* Violations list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {filter === 'all' ? 'All Violations' : `${SEVERITY_META[filter].label} Violations`}
          </p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-[10px] text-primary hover:underline">
              Clear filter
            </button>
          )}
        </div>

        {scanning && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl bg-border/30 animate-pulse" />
            ))}
          </div>
        )}

        {!scanning && scanned && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 size={32} className="text-primary" />
            <p className="text-sm font-semibold text-foreground">No violations found</p>
            <p className="text-xs text-muted-foreground">All contracts are within SLA thresholds.</p>
          </div>
        )}

        {!scanning && filtered.map(v => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ViolationRow v={v} />
          </motion.div>
        ))}
      </div>

      {/* SLA Thresholds */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active SLA Thresholds</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SLA_THRESHOLDS.map((t, i) => (
            <div key={i} className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
              <span className="text-xs text-foreground">{t.label}</span>
              <span className="text-xs font-mono font-semibold text-primary">{t.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
