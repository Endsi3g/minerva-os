'use client';
import { useState, useEffect, useMemo } from 'react';
import { useLang } from '@/i18n';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';
import { supabase } from '@/lib/supabase';
import { useWorkspaces, useProjects, useDeals, useApprovals } from '@/lib/hooks/useSupabase';
import { AlertTriangle, Bot, Clock, Eye } from 'lucide-react';
import Reports from './Reports';
import Cockpit from './Cockpit';
import NPS from './NPS';
import AgentOps from './AgentOps';

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
    if (!iso) return '—';
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

/* ── HealthRing ──────────────────────────────────────────────────────────── */

function HealthRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={112} height={112} className="-rotate-90">
        <circle cx={56} cy={56} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={56} cy={56} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold leading-none" style={{ color }}>{score}</p>
        <p className="text-[10px] text-fog mt-0.5">/ 100</p>
      </div>
    </div>
  );
}

/* ── IntelligenceOverview ────────────────────────────────────────────────── */

function IntelligenceOverview() {
  const { t } = useLang();
  const ov = t.app.intelligence.overview;

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

  // Portfolio health score
  const healthScore = useMemo(() => {
    if (!projects) return 0;
    const active = (projects as any[]).filter(p => p.status === 'active');
    if (active.length === 0) return 100;
    const onTime = active.filter(p => {
      const due = p.dueDate ?? p.due_date ?? '';
      return !due || due >= todayStr;
    });
    return Math.round((onTime.length / active.length) * 100);
  }, [projects, todayStr]);

  // Top risks
  const risks = useMemo(() => {
    const list: { label: string; count: number }[] = [];

    const lateProjects = (projects ?? []).filter((p: any) => {
      const due = p.dueDate ?? p.due_date ?? '';
      return p.status === 'active' && due && due < todayStr;
    }).length;
    if (lateProjects > 0) list.push({ label: `${lateProjects} project${lateProjects > 1 ? 's' : ''} overdue`, count: lateProjects });

    const cutoff30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const staleDeals = (deals ?? []).filter((d: any) => {
      const created = d.createdAt ?? d.created_at ?? '';
      return created && created < cutoff30 && d.stage !== 'closed_won' && d.stage !== 'closed_lost';
    }).length;
    if (staleDeals > 0) list.push({ label: `${staleDeals} deal${staleDeals > 1 ? 's' : ''} stagnant 30d+`, count: staleDeals });

    const cutoff7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const pendingApprovals = (approvals ?? []).filter((a: any) => {
      const submitted = a.submittedDate ?? a.submitted_date ?? '';
      return a.status === 'pending' && submitted && submitted < cutoff7;
    }).length;
    if (pendingApprovals > 0) list.push({ label: `${pendingApprovals} approval${pendingApprovals > 1 ? 's' : ''} pending 7d+`, count: pendingApprovals });

    return list.slice(0, 3);
  }, [projects, deals, approvals, todayStr, today]);

  // NPS score
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

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Health Score */}
        <div
          className="rounded-[14px] border p-5 flex flex-col items-center gap-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-[11px] text-fog self-start">{ov.healthScore}</p>
          <HealthRing score={healthScore} />
        </div>

        {/* Top Risks */}
        <div
          className="rounded-[14px] border p-5 flex flex-col gap-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-[11px] text-fog">{ov.topRisks}</p>
          {risks.length === 0 ? (
            <p className="text-xs text-sage mt-1">{ov.noRisks}</p>
          ) : (
            <div className="space-y-2">
              {risks.map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <AlertTriangle size={12} style={{ color: '#B89B6A', flexShrink: 0 }} />
                  <span className="text-xs text-silver">{r.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NPS Snapshot */}
        <div
          className="rounded-[14px] border p-5 flex flex-col gap-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-[11px] text-fog">{ov.npsScore}</p>
          {npsScore === null ? (
            <p className="text-xs text-fog">No responses yet</p>
          ) : (
            <>
              <p
                className="text-2xl font-bold leading-none"
                style={{ color: npsScore >= 0 ? '#7FA38A' : '#A86A6A' }}
              >
                {npsScore >= 0 ? '+' : ''}{npsScore}
              </p>
              {total > 0 && (
                <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: `${(promoters / total) * 100}%`, backgroundColor: '#7FA38A' }} />
                  <div style={{ width: `${(passives / total) * 100}%`, backgroundColor: '#B89B6A' }} />
                  <div style={{ width: `${(detractors / total) * 100}%`, backgroundColor: '#A86A6A' }} />
                </div>
              )}
              <p className="text-[10px] text-fog">{promoters}P · {passives}N · {detractors}D</p>
            </>
          )}
        </div>
      </div>

      {/* Agent Status */}
      <div
        className="rounded-[14px] border p-5 flex items-center gap-4"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 flex-1">
          <Bot size={16} style={{ color: '#8A9099' }} />
          <div>
            <p className="text-xs font-medium text-silver">{ov.agents}</p>
            <p className="text-lg font-semibold text-ivory leading-none mt-0.5">{agents.length}</p>
          </div>
        </div>
        {lastAgentAction && (
          <div className="flex items-center gap-1.5 text-[11px] text-fog">
            <Clock size={11} />
            <span>{ov.lastAction}: {new Date(lastAgentAction).toLocaleDateString()}</span>
          </div>
        )}
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
    { id: 4, label: h.tabs.agentOps,    content: <AgentOps /> },
    { id: 5, label: h.tabs.clientIntel, content: <PortalAnalytics workspaceId={workspaceId} /> },
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
