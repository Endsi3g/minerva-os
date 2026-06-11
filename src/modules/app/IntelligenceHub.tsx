'use client';
import { useState, useEffect, useMemo } from 'react';
import { useLang } from '@/i18n';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';
import { supabase } from '@/lib/supabase';
import { useWorkspaces, useProjects, useDeals, useApprovals } from '@/lib/hooks/useSupabase';
import {
  AlertTriangle, Bot, Clock, Eye, TrendingUp, TrendingDown,
  Minus, Activity, MessageSquare, CheckCircle, ChevronRight,
  Zap, Shield, Users, BarChart2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import Reports from './Reports';
import Cockpit from './Cockpit';
import NPS from './NPS';
import AgentOps from './AgentOps';
import AgentsList from './AgentsList';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

/* ── PortalAnalytics ─────────────────────────────────────────────────────────── */

function PortalAnalytics({ workspaceId }: { workspaceId: string }) {
  const { t } = useLang();
  const ci = t.app.intelligence.clientIntel;
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/intelligence/portal-analytics?workspaceId=${workspaceId}`)
      .then(r => r.json())
      .then(d => setRows(d.analytics ?? []))
      .catch(() => setRows([]));
  }, [workspaceId]);

  if (rows === null) {
    return <p className="text-sm text-fog py-8 text-center">{ci.loading}</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/6 p-12 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <Eye size={24} className="mx-auto mb-3 opacity-30" style={{ color: '#8A9099' }} />
        <p className="text-sm text-fog">{ci.noData}</p>
      </div>
    );
  }

  function relTime(iso: string | null) {
    if (!iso) return '·';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-ivory">{ci.title}</p>
        <p className="text-xs text-fog mt-0.5">{ci.subtitle}</p>
      </div>
      <div className="rounded-2xl border border-white/6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {[ci.cols.client, ci.cols.visits, ci.cols.lastSeen, ci.cols.proposals, ci.cols.files, ci.cols.approvals].map(col => (
                <th key={col} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-fog">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.clientId}
                style={{
                  backgroundColor: i % 2 === 0 ? '#111522' : '#0E1119',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <td className="px-4 py-3 font-medium text-ivory">{row.clientName}</td>
                <td className="px-4 py-3 text-silver">{row.visits}</td>
                <td className="px-4 py-3 text-fog">{relTime(row.lastSeen)}</td>
                <td className="px-4 py-3 text-silver">{row.proposals}</td>
                <td className="px-4 py-3 text-silver">{row.files}</td>
                <td className="px-4 py-3 text-silver">{row.approvals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function scoreColor(score: number) {
  if (score >= 75) return '#7FA38A';
  if (score >= 50) return '#B89B6A';
  return '#A86A6A';
}

function scoreTrend(score: number): 'up' | 'stable' | 'down' {
  if (score >= 80) return 'up';
  if (score >= 55) return 'stable';
  return 'down';
}

function TrendIcon({ trend, size = 14 }: { trend: 'up' | 'stable' | 'down'; size?: number }) {
  if (trend === 'up') return <TrendingUp size={size} style={{ color: '#7FA38A' }} />;
  if (trend === 'down') return <TrendingDown size={size} style={{ color: '#A86A6A' }} />;
  return <Minus size={size} style={{ color: '#8A9099' }} />;
}

/* ── SubScoreBar ─────────────────────────────────────────────────────────── */

function SubScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color = scoreColor(score);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ color: '#8A9099' }}>{icon}</span>
          <span className="text-[11px] text-fog font-medium uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}55`,
            transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </div>
    </div>
  );
}

/* ── LeversPanel ─────────────────────────────────────────────────────────── */

function LeversPanel({ positives, negatives }: { positives: string[]; negatives: string[] }) {
  if (positives.length === 0 && negatives.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      <div className="space-y-2">
        {positives.map(p => (
          <div key={p} className="flex items-start gap-1.5">
            <div
              className="mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(127,163,138,0.15)' }}
            >
              <ArrowUpRight size={8} style={{ color: '#7FA38A' }} />
            </div>
            <p className="text-[10px] text-silver leading-snug">{p}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {negatives.map(n => (
          <div key={n} className="flex items-start gap-1.5">
            <div
              className="mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(168,106,106,0.15)' }}
            >
              <ArrowDownRight size={8} style={{ color: '#A86A6A' }} />
            </div>
            <p className="text-[10px] text-silver leading-snug">{n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── HealthRing ──────────────────────────────────────────────────────────── */

function HealthRing({ score }: { score: number }) {
  const r = 66;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  const trend = scoreTrend(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={160} height={160} className="-rotate-90">
        <circle cx={80} cy={80} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle
          cx={80} cy={80} r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-bold leading-none tabular-nums" style={{ color }}>{score}</p>
        <p className="text-[10px] text-fog mt-1">/ 100</p>
        <div className="flex items-center justify-center gap-0.5 mt-1.5">
          <TrendIcon trend={trend} size={10} />
          <span className="text-[10px]" style={{ color: trend === 'up' ? '#7FA38A' : trend === 'down' ? '#A86A6A' : '#8A9099' }}>
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'At risk' : 'Stable'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── BriefingBanner ──────────────────────────────────────────────────────── */

function BriefingBanner({ projects, deals, approvals, healthScore, npsScore }: {
  projects: any[] | null;
  deals: any[] | null;
  approvals: any[] | null;
  healthScore: number;
  npsScore: number | null;
}) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const activeProjects = (projects ?? []).filter((p: any) => p.status === 'active').length;
  const lateProjects = (projects ?? []).filter((p: any) => {
    const due = p.dueDate ?? p.due_date ?? '';
    return p.status === 'active' && due && due < todayStr;
  }).length;
  const pendingApprovals = (approvals ?? []).filter((a: any) => a.status === 'pending').length;
  const openDeals = (deals ?? []).filter((d: any) => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length;

  const statusColor = healthScore >= 80 ? '#7FA38A' : healthScore >= 55 ? '#B89B6A' : '#A86A6A';
  const statusLabel = healthScore >= 80 ? 'Healthy' : healthScore >= 55 ? 'Monitoring' : 'At Risk';

  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const narrative =
    healthScore >= 80
      ? `${activeProjects} active project${activeProjects !== 1 ? 's' : ''} on schedule. Pipeline and client sentiment in good standing.`
      : healthScore >= 55
      ? `${lateProjects > 0 ? `${lateProjects} project${lateProjects > 1 ? 's' : ''} past deadline. ` : ''}${openDeals > 0 ? `${openDeals} deal${openDeals > 1 ? 's' : ''} tracked in pipeline. ` : ''}Monitoring for pressure points.`
      : `${lateProjects > 0 ? `${lateProjects} project${lateProjects > 1 ? 's' : ''} overdue. ` : ''}${pendingApprovals > 0 ? `${pendingApprovals} approval${pendingApprovals > 1 ? 's' : ''} stalled. ` : ''}Action required to restore health.`;

  const chips = [
    { label: 'Active Projects', value: activeProjects.toString(), color: '#B8BDC7' },
    lateProjects > 0 ? { label: 'Overdue', value: lateProjects.toString(), color: '#A86A6A' } : null,
    pendingApprovals > 0 ? { label: 'Pending Approvals', value: pendingApprovals.toString(), color: '#B89B6A' } : null,
    openDeals > 0 ? { label: 'Open Deals', value: openDeals.toString(), color: '#B8BDC7' } : null,
    npsScore !== null ? { label: 'NPS', value: `${npsScore >= 0 ? '+' : ''}${npsScore}`, color: npsScore >= 0 ? '#7FA38A' : '#A86A6A' } : null,
  ].filter((c): c is { label: string; value: string; color: string } => c !== null);

  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: 'rgba(127,163,138,0.04)',
        borderColor: 'rgba(127,163,138,0.14)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(127,163,138,0.12)' }}>
              <Zap size={13} style={{ color: '#7FA38A' }} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-fog">
              Intelligence Briefing · {dateLabel}
            </p>
          </div>
          <p className="text-base font-medium leading-relaxed mb-4" style={{ color: '#D8DDE6' }}>
            Agency is{' '}
            <span className="font-bold" style={{ color: statusColor }}>{statusLabel}</span>
            {' — '}
            <span className="text-silver">{narrative}</span>
          </p>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map(chip => (
                <div
                  key={chip.label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="font-bold tabular-nums" style={{ color: chip.color }}>{chip.value}</span>
                  <span className="text-fog">{chip.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          className="flex-shrink-0 self-start px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: `${statusColor}14`, color: statusColor, border: `1px solid ${statusColor}30` }}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  );
}

/* ── RiskPanel ───────────────────────────────────────────────────────────── */

type RiskItem = {
  label: string;
  count: number;
  severity: 'critical' | 'warning' | 'info';
  cta?: string;
  ctaRoute?: string;
};

function RiskPanel({ risks }: { risks: RiskItem[] }) {
  const router = useRouter();

  if (risks.length === 0) {
    return (
      <div className="flex items-start gap-2.5 py-2">
        <div className="mt-0.5 p-1 rounded-md" style={{ backgroundColor: 'rgba(127,163,138,0.1)' }}>
          <CheckCircle size={12} style={{ color: '#7FA38A' }} />
        </div>
        <div>
          <p className="text-xs font-medium text-sage">All systems operational</p>
          <p className="text-[11px] text-fog mt-0.5">No active risks or overdue items detected.</p>
        </div>
      </div>
    );
  }

  const severityStyle = {
    critical: { bg: 'rgba(168,106,106,0.1)', icon: '#A86A6A', tag: 'High Risk' },
    warning: { bg: 'rgba(184,155,106,0.1)', icon: '#B89B6A', tag: 'Medium Risk' },
    info: { bg: 'rgba(138,144,153,0.06)', icon: '#8A9099', tag: 'Monitor' },
  };

  return (
    <div className="space-y-2">
      {risks.map(r => {
        const style = severityStyle[r.severity];
        return (
          <div key={r.label} className="rounded-xl p-3" style={{ backgroundColor: style.bg }}>
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" style={{ color: style.icon }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-silver leading-snug">{r.label}</p>
              </div>
              <div
                className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${style.icon}22`, color: style.icon }}
              >
                {style.tag}
              </div>
            </div>
            {r.cta && r.ctaRoute && (
              <div className="mt-2 pl-6">
                <button
                  onClick={() => router.push(r.ctaRoute!)}
                  className="flex items-center gap-1 text-[11px] font-medium transition-opacity duration-200 hover:opacity-100 opacity-70"
                  style={{ color: style.icon }}
                >
                  {r.cta}
                  <ChevronRight size={10} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── NpsCard ─────────────────────────────────────────────────────────────── */

function NpsCard({
  npsScore, promoters, passives, detractors, total,
}: {
  npsScore: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}) {
  const router = useRouter();

  if (npsScore === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <div
          className="p-3 rounded-2xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <MessageSquare size={20} style={{ color: '#8A9099' }} />
        </div>
        <div>
          <p className="text-sm font-medium text-silver">No NPS responses yet</p>
          <p className="text-[11px] text-fog mt-1 leading-relaxed max-w-[180px]">
            Send a survey to start collecting client sentiment signals.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-[11px] h-7 px-3 border-white/8 text-silver hover:text-ivory"
          onClick={() => router.push('/app/intelligence?tab=nps')}
        >
          Send NPS Survey
          <ChevronRight size={11} className="ml-1" />
        </Button>
      </div>
    );
  }

  const color = npsScore >= 50 ? '#7FA38A' : npsScore >= 0 ? '#B89B6A' : '#A86A6A';

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>
          {npsScore >= 0 ? '+' : ''}{npsScore}
        </p>
        <div className="flex items-center gap-1 text-[11px]" style={{ color }}>
          {npsScore >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span>{npsScore >= 50 ? 'Excellent' : npsScore >= 0 ? 'Good' : 'Needs attention'}</span>
        </div>
      </div>

      {total > 0 && (
        <>
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
            <div
              style={{ width: `${(promoters / total) * 100}%`, backgroundColor: '#7FA38A', transition: 'width 0.8s ease' }}
              className="rounded-full"
            />
            <div
              style={{ width: `${(passives / total) * 100}%`, backgroundColor: '#B89B6A', transition: 'width 0.8s ease' }}
              className="rounded-full"
            />
            <div
              style={{ width: `${(detractors / total) * 100}%`, backgroundColor: '#A86A6A', transition: 'width 0.8s ease' }}
              className="rounded-full"
            />
          </div>
          <div className="flex gap-3 text-[11px]">
            <span><span className="font-semibold" style={{ color: '#7FA38A' }}>{promoters}</span><span className="text-fog ml-1">Promoters</span></span>
            <span><span className="font-semibold" style={{ color: '#B89B6A' }}>{passives}</span><span className="text-fog ml-1">Passive</span></span>
            <span><span className="font-semibold" style={{ color: '#A86A6A' }}>{detractors}</span><span className="text-fog ml-1">Detractors</span></span>
          </div>
          <p className="text-[10px] text-fog">{total} total response{total !== 1 ? 's' : ''}</p>
        </>
      )}
    </div>
  );
}

/* ── AgentCard ───────────────────────────────────────────────────────────── */

function AgentCard({ agents, lastAgentAction }: { agents: any[]; lastAgentAction: string | null }) {
  const router = useRouter();
  const activeCount = agents.filter((a: any) => a.status === 'active' || a.enabled).length;

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <div
          className="p-3 rounded-2xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Bot size={20} style={{ color: '#8A9099' }} />
        </div>
        <div>
          <p className="text-sm font-medium text-silver">Background systems monitored</p>
          <p className="text-[11px] text-fog mt-1 leading-relaxed max-w-[180px]">
            No Hermes agents configured. Run a health audit to detect automation gaps.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-[11px] h-7 px-3 border-white/8 text-silver hover:text-ivory"
          onClick={() => router.push('/app/intelligence?tab=agents')}
        >
          Run Health Audit
          <ChevronRight size={11} className="ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold tabular-nums leading-none text-ivory">{activeCount}</p>
        <p className="text-sm text-fog">active</p>
        <p className="text-sm text-fog">· {agents.length} total</p>
      </div>

      <div className="space-y-2">
        {agents.slice(0, 3).map((agent: any) => {
          const isActive = agent.status === 'active' || agent.enabled;
          return (
            <div key={agent.id ?? agent._id ?? agent.name} className="flex items-center gap-2.5">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: isActive ? '#7FA38A' : '#8A9099' }}
              />
              <p className="text-xs text-silver flex-1 truncate">{agent.name}</p>
              <p className="text-[10px] text-fog">{isActive ? 'Active' : 'Idle'}</p>
            </div>
          );
        })}
        {agents.length > 3 && (
          <p className="text-[10px] text-fog pl-4">+{agents.length - 3} more</p>
        )}
      </div>

      {lastAgentAction && (
        <div className="flex items-center gap-1.5 text-[11px] text-fog pt-1 border-t border-white/5">
          <Clock size={10} />
          <span>Last action: {new Date(lastAgentAction).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}

/* ── IntelligenceOverview ────────────────────────────────────────────────── */

function IntelligenceOverview() {
  const workspaces = useWorkspaces();
  const workspaceId = (workspaces as any[])?.[0]?._id ?? null;

  const projects: any[] | null = useProjects(workspaceId);
  const deals: any[] | null = useDeals(workspaceId);
  const approvals: any[] | null = useApprovals(workspaceId);

  const [npsResponses, setNpsResponses] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [lastAgentAction, setLastAgentAction] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    Promise.all([
      supabase.from('nps_responses').select('*').eq('workspace_id', workspaceId),
      supabase.from('agents').select('*').eq('workspace_id', workspaceId),
    ]).then(([npsRes, agentsRes]) => {
      if (!active) return;
      if (npsRes.data) setNpsResponses(npsRes.data);
      if (agentsRes.data) {
        setAgents(agentsRes.data);
        const latest = agentsRes.data
          .map((a: any) => a.last_action ?? a.updated_at ?? '')
          .filter(Boolean)
          .sort()
          .pop();
        setLastAgentAction(latest ?? null);
      }
    });
    return () => { active = false; };
  }, [workspaceId]);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const deliveryScore = useMemo(() => {
    if (!projects) return 100;
    const active = (projects as any[]).filter(p => p.status === 'active');
    if (active.length === 0) return 100;
    const onTime = active.filter(p => {
      const due = p.dueDate ?? p.due_date ?? '';
      return !due || due >= todayStr;
    });
    return Math.round((onTime.length / active.length) * 100);
  }, [projects, todayStr]);

  const financialScore = useMemo(() => {
    if (!deals) return 100;
    const cutoff30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const stale = (deals as any[]).filter(d => {
      const created = d.createdAt ?? d.created_at ?? '';
      return created && created < cutoff30 && d.stage !== 'closed_won' && d.stage !== 'closed_lost';
    }).length;
    const total = (deals as any[]).filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length;
    if (total === 0) return 100;
    return Math.round(Math.max(0, ((total - stale) / total) * 100));
  }, [deals, today]);

  const sentimentScore = useMemo(() => {
    if (npsResponses.length === 0) return null;
    const promoters = npsResponses.filter(r => r.score >= 9).length;
    const detractors = npsResponses.filter(r => r.score <= 6).length;
    const nps = Math.round(((promoters - detractors) / npsResponses.length) * 100);
    return Math.round(((nps + 100) / 200) * 100);
  }, [npsResponses]);

  const healthScore = useMemo(() => {
    const scores = [deliveryScore, financialScore, sentimentScore ?? 80];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [deliveryScore, financialScore, sentimentScore]);

  const risks = useMemo((): RiskItem[] => {
    const list: RiskItem[] = [];

    const lateProjects = (projects ?? []).filter((p: any) => {
      const due = p.dueDate ?? p.due_date ?? '';
      return p.status === 'active' && due && due < todayStr;
    }).length;
    if (lateProjects > 0) {
      list.push({
        label: `${lateProjects} project${lateProjects > 1 ? 's' : ''} past their deadline`,
        count: lateProjects,
        severity: lateProjects >= 3 ? 'critical' : 'warning',
        cta: 'View Delivery Board',
        ctaRoute: '/app/delivery',
      });
    }

    const cutoff30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const staleDeals = (deals ?? []).filter((d: any) => {
      const created = d.createdAt ?? d.created_at ?? '';
      return created && created < cutoff30 && d.stage !== 'closed_won' && d.stage !== 'closed_lost';
    }).length;
    if (staleDeals > 0) {
      list.push({
        label: `${staleDeals} deal${staleDeals > 1 ? 's' : ''} stagnant for 30+ days`,
        count: staleDeals,
        severity: 'warning',
        cta: 'Review Pipeline',
        ctaRoute: '/app/crm',
      });
    }

    const cutoff7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const pendingApprovals = (approvals ?? []).filter((a: any) => {
      const submitted = a.submittedDate ?? a.submitted_date ?? '';
      return a.status === 'pending' && submitted && submitted < cutoff7;
    }).length;
    if (pendingApprovals > 0) {
      list.push({
        label: `${pendingApprovals} approval${pendingApprovals > 1 ? 's' : ''} pending for 7+ days`,
        count: pendingApprovals,
        severity: 'info',
        cta: 'Open Approvals',
        ctaRoute: '/app/delivery',
      });
    }

    return list.slice(0, 3);
  }, [projects, deals, approvals, todayStr, today]);

  const { positiveLevers, negativeLevers } = useMemo(() => {
    const positives: string[] = [];
    const negatives: string[] = [];

    if (deliveryScore >= 90) positives.push('All active projects on schedule');
    else if (deliveryScore >= 80) positives.push('Strong on-time delivery rate');
    else if (deliveryScore < 70) negatives.push('Delivery cadence below target');

    if (financialScore >= 90) positives.push('Pipeline momentum healthy');
    else if (financialScore >= 80) positives.push('Active deal flow maintained');
    else if (financialScore < 60) negatives.push('Margin threshold warning');

    if (sentimentScore !== null && sentimentScore >= 70) positives.push('High client satisfaction');
    else if (sentimentScore !== null && sentimentScore < 50) negatives.push('Client sentiment below threshold');

    const lateCount = (projects ?? []).filter((p: any) => {
      const due = p.dueDate ?? p.due_date ?? '';
      return p.status === 'active' && due && due < todayStr;
    }).length;
    if (lateCount > 0) negatives.push(`${lateCount} project${lateCount > 1 ? 's' : ''} overdue`);

    const cutoff30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const staleCount = (deals ?? []).filter((d: any) => {
      const created = d.createdAt ?? d.created_at ?? '';
      return created && created < cutoff30 && d.stage !== 'closed_won' && d.stage !== 'closed_lost';
    }).length;
    if (staleCount > 0) negatives.push(`${staleCount} deal${staleCount > 1 ? 's' : ''} stagnant 30+ days`);

    if (risks.length === 0 && positives.length === 0) positives.push('No active risk flags detected');

    return { positiveLevers: positives.slice(0, 3), negativeLevers: negatives.slice(0, 3) };
  }, [deliveryScore, financialScore, sentimentScore, projects, deals, risks, todayStr, today]);

  const npsScore = useMemo(() => {
    if (npsResponses.length === 0) return null;
    const promoters = npsResponses.filter(r => r.score >= 9).length;
    const detractors = npsResponses.filter(r => r.score <= 6).length;
    return Math.round(((promoters - detractors) / npsResponses.length) * 100);
  }, [npsResponses]);

  const promoters = npsResponses.filter(r => r.score >= 9).length;
  const passives = npsResponses.filter(r => r.score >= 7 && r.score <= 8).length;
  const detractors = npsResponses.filter(r => r.score <= 6).length;
  const total = npsResponses.length;

  const cardBase = {
    backgroundColor: '#111522',
    borderColor: 'rgba(255,255,255,0.07)',
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Executive Briefing Banner */}
      <BriefingBanner
        projects={projects}
        deals={deals}
        approvals={approvals}
        healthScore={healthScore}
        npsScore={npsScore}
      />

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* LEFT: Portfolio Health Scorecard — 2 cols */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5 flex flex-col gap-4"
          style={cardBase}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-fog">Portfolio Health</p>
            <p className="text-[11px] text-fog mt-0.5">Composite score across delivery, pipeline and sentiment</p>
          </div>

          <div className="flex items-center justify-center py-2">
            <HealthRing score={healthScore} />
          </div>

          <div className="space-y-3 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <SubScoreBar label="Delivery & Timelines" score={deliveryScore} icon={<BarChart2 size={11} />} />
            <SubScoreBar label="Financial Margins" score={financialScore} icon={<TrendingUp size={11} />} />
            <SubScoreBar label="Client Sentiment" score={sentimentScore ?? 80} icon={<Users size={11} />} />
          </div>

          {(positiveLevers.length > 0 || negativeLevers.length > 0) && (
            <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fog mb-2.5">Contributing Factors</p>
              <LeversPanel positives={positiveLevers} negatives={negativeLevers} />
            </div>
          )}
        </div>

        {/* RIGHT: 3 stacked cards — 3 cols */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Top Risks */}
          <div
            className="rounded-2xl border p-5 flex flex-col gap-3"
            style={cardBase}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-fog">Risk &amp; Action Center</p>
                <p className="text-[11px] text-fog mt-0.5">Priority items requiring action this week</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: risks.length === 0 ? '#7FA38A' : risks[0]?.severity === 'critical' ? '#A86A6A' : '#B89B6A' }}
                />
                <span className="text-[10px] font-medium" style={{ color: risks.length === 0 ? '#7FA38A' : '#B8BDC7' }}>
                  {risks.length === 0 ? 'All clear' : `${risks.length} flag${risks.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
            <RiskPanel risks={risks} />
          </div>

          {/* NPS + Agent grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* NPS Snapshot */}
            <div
              className="rounded-2xl border p-5 flex flex-col gap-3"
              style={cardBase}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-fog">NPS Snapshot</p>
                <p className="text-[11px] text-fog mt-0.5">Client satisfaction signal</p>
              </div>
              <NpsCard
                npsScore={npsScore}
                promoters={promoters}
                passives={passives}
                detractors={detractors}
                total={total}
              />
            </div>

            {/* Agent Ops */}
            <div
              className="rounded-2xl border p-5 flex flex-col gap-3"
              style={cardBase}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-fog">Agent Ops</p>
                  <p className="text-[11px] text-fog mt-0.5">Automation activity</p>
                </div>
                <Activity size={13} style={{ color: '#8A9099' }} />
              </div>
              <AgentCard agents={agents} lastAgentAction={lastAgentAction} />
            </div>

          </div>
        </div>
      </div>

      {/* Signal Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Active Projects',
            value: (projects ?? []).filter((p: any) => p.status === 'active').length,
            icon: <Shield size={13} />,
          },
          {
            label: 'Open Deals',
            value: (deals ?? []).filter((d: any) => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length,
            icon: <TrendingUp size={13} />,
          },
          {
            label: 'Pending Approvals',
            value: (approvals ?? []).filter((a: any) => a.status === 'pending').length,
            icon: <CheckCircle size={13} />,
          },
          {
            label: 'Agents Running',
            value: agents.filter((a: any) => a.status === 'active' || a.enabled).length,
            icon: <Bot size={13} />,
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#111522', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span style={{ color: '#8A9099' }}>{stat.icon}</span>
              <p className="text-[10px] text-fog font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-ivory leading-none">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── IntelligenceHub ─────────────────────────────────────────────────────── */

export default function IntelligenceHub() {
  const { t } = useLang();
  const h = t.app.intelligence;
  const [activeTab, setActiveTab] = useState(0);

  const workspaces = useWorkspaces();
  const workspaceId = (workspaces as any[])?.[0]?._id ?? (workspaces as any[])?.[0]?.id ?? '';

  const tabs = [
    { id: 0, label: h.tabs.overview,    content: <IntelligenceOverview /> },
    { id: 1, label: h.tabs.reports,     content: <Reports /> },
    { id: 2, label: h.tabs.health,      content: <Cockpit /> },
    { id: 3, label: h.tabs.nps,         content: <NPS /> },
    { id: 4, label: h.tabs.agents,      content: <AgentsList /> },
    { id: 5, label: h.tabs.agentOps,    content: <AgentOps /> },
    { id: 6, label: h.tabs.clientIntel, content: <PortalAnalytics workspaceId={workspaceId} /> },
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
