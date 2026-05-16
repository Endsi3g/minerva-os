'use client';
import { useState } from 'react';
import { Plus, Star, TrendingUp, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

function scoreColor(score: number): string {
  if (score >= 9) return 'text-sage';
  if (score >= 7) return 'text-warm';
  return 'text-ember';
}

function scoreLabel(score: number): string {
  if (score >= 9) return 'Promoter';
  if (score >= 7) return 'Passive';
  return 'Detractor';
}

function NPSGauge({ score }: { score: number }) {
  const pct = (score + 100) / 200 * 100;
  const color = score >= 0 ? (score >= 50 ? '#7FA38A' : '#B89B6A') : '#A86A6A';
  return (
    <div className="relative">
      <div className="flex items-center justify-between text-[10px] text-fog mb-1">
        <span>-100</span>
        <span className={cn('text-lg font-bold', score >= 0 ? 'text-sage' : 'text-ember')}>{score >= 0 ? '+' : ''}{score}</span>
        <span>+100</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex items-center justify-between text-[10px] text-fog mt-1">
        <span>Detractors</span>
        <span>Passives</span>
        <span>Promoters</span>
      </div>
    </div>
  );
}

function NPSForm({ workspaceId, clients, onClose }: { workspaceId: any; clients: any[]; onClose: () => void }) {
  const submit = useMutation(api.nps.submit as any);
  const [clientId, setClientId] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [trigger, setTrigger] = useState('manual');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || score === null) return;
    setSaving(true);
    await submit({ workspaceId, clientId: clientId as any, score, reason: reason || undefined, suggestion: suggestion || undefined, trigger });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ivory">Record NPS Response</h2>
          <button type="button" onClick={onClose}><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>
        <div className="space-y-3">
          <select value={clientId} onChange={e => setClientId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory outline-none"
            style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="">Select client</option>
            {clients.map((c: any) => <option key={c._id} value={c._id}>{c.company}</option>)}
          </select>

          <div>
            <p className="text-[10px] text-fog mb-2">Score (0 = not at all, 10 = extremely likely)</p>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setScore(i)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-xs font-medium transition-colors',
                    score === i
                      ? (i >= 9 ? 'bg-sage text-white' : i >= 7 ? 'bg-warm text-white' : 'bg-ember text-white')
                      : 'bg-white/5 text-fog hover:bg-white/10 hover:text-ivory'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <select value={trigger} onChange={e => setTrigger(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory outline-none"
            style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="manual">Manual</option>
            <option value="phase_complete">Phase complete</option>
            <option value="delivery">Delivery</option>
            <option value="renewal">Renewal</option>
          </select>

          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)" rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder="Suggestion (optional)" rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-fog hover:text-silver">Cancel</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving || score === null}>Save response</Button>
        </div>
      </form>
    </div>
  );
}

export default function NPSPage() {
  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const responses = useQuery(api.nps.list as any, workspaceId ? { workspaceId } : 'skip') ?? [];
  const clients = useQuery(api.clients.list, workspaceId ? { workspaceId } : 'skip') ?? [];

  const [showForm, setShowForm] = useState(false);

  const promoters = (responses as any[]).filter(r => r.score >= 9).length;
  const passives = (responses as any[]).filter(r => r.score >= 7 && r.score <= 8).length;
  const detractors = (responses as any[]).filter(r => r.score <= 6).length;
  const total = (responses as any[]).length;
  const npsScore = total > 0
    ? Math.round(((promoters - detractors) / total) * 100)
    : 0;
  const atRisk = (responses as any[]).filter(r => r.score < 7).map(r => {
    const client = (clients as any[]).find(c => c._id === r.clientId);
    return { ...r, clientName: client?.company ?? 'Unknown' };
  });

  return (
    <>
      {showForm && workspaceId && (
        <NPSForm workspaceId={workspaceId} clients={clients as any[]} onClose={() => setShowForm(false)} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">NPS</h1>
          <p className="text-sm text-fog mt-0.5">{total} responses tracked</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} disabled={!workspaceId}>
          <Plus size={14} />
          Record response
        </Button>
      </div>

      {/* NPS Score gauge */}
      <div className="rounded-xl p-5 border border-border bg-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Star size={14} className="text-sage" />
          <span className="text-xs font-medium text-sage uppercase tracking-widest">Net Promoter Score</span>
        </div>
        <NPSGauge score={npsScore} />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Promoters', value: promoters, color: 'text-sage', sub: '9-10' },
            { label: 'Passives', value: passives, color: 'text-warm', sub: '7-8' },
            { label: 'Detractors', value: detractors, color: 'text-ember', sub: '0-6' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={cn('text-xl font-bold tabular-nums', s.color)}>{s.value}</p>
              <p className="text-[10px] text-fog">{s.label}</p>
              <p className="text-[9px] text-fog/50">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* At-risk clients */}
      {atRisk.length > 0 && (
        <div className="rounded-xl p-4 border border-ember/20 bg-ember/5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={13} className="text-ember" />
            <span className="text-xs font-medium text-ember">Churn risk — {atRisk.length} detractor{atRisk.length > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-1">
            {atRisk.map(r => (
              <div key={r._id} className="flex items-center justify-between text-xs">
                <span className="text-silver">{r.clientName}</span>
                <span className={cn('font-mono font-bold', scoreColor(r.score))}>{r.score}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All responses */}
      {(responses as any[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <TrendingUp size={36} className="text-fog/30" />
          <p className="text-sm text-fog">No NPS responses yet. Record your first response to start tracking client satisfaction.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-fog uppercase tracking-widest mb-3">All responses</p>
          {(responses as any[]).map((r: any) => {
            const client = (clients as any[]).find(c => c._id === r.clientId);
            return (
              <div
                key={r._id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className={cn('text-2xl font-bold tabular-nums w-10 text-right', scoreColor(r.score))}>{r.score}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ivory">{client?.company ?? 'Unknown'}</p>
                  {r.reason && <p className="text-[11px] text-fog mt-0.5 truncate">{r.reason}</p>}
                </div>
                <span className={cn('text-[10px] font-medium', scoreColor(r.score))}>{scoreLabel(r.score)}</span>
                <span className="text-[10px] text-fog">{new Date(r.respondedAt).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
