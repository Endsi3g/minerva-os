'use client';
import { useState } from 'react';
import { Plus, Star, TrendingUp, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLang } from '@/i18n';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

type NpsResponse = Record<string, unknown>;
type Client = Record<string, unknown>;

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

function NPSForm({ workspaceId, clients, onClose }: { workspaceId: string; clients: Client[]; onClose: () => void }) {
  const { t } = useLang();
  const f = t.app.nps.form;
  const submit = useMutation(api.nps.submit as Parameters<typeof useMutation>[0]);
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
    await submit({ workspaceId, clientId: clientId as Parameters<typeof submit>[0]['clientId'], score, reason: reason || undefined, suggestion: suggestion || undefined, trigger });
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
          <h2 className="text-sm font-semibold text-ivory">{f.title}</h2>
          <button type="button" onClick={onClose}><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>
        <div className="space-y-3">
          <select value={clientId} onChange={e => setClientId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory outline-none"
            style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="">{f.clientPlaceholder}</option>
            {clients.map((c) => <option key={c._id as string} value={c._id as string}>{c.company as string}</option>)}
          </select>

          <div>
            <p className="text-[10px] text-fog mb-2">{t.app.nps.scoreLabel}</p>
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
            <option value="manual">{f.triggers.manual}</option>
            <option value="phase_complete">{f.triggers.phase_complete}</option>
            <option value="delivery">{f.triggers.delivery}</option>
            <option value="renewal">{f.triggers.renewal}</option>
          </select>

          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={f.reasonPlaceholder} rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder={f.suggestionPlaceholder} rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-fog hover:text-silver">{f.cancel}</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving || score === null}>{f.save}</Button>
        </div>
      </form>
    </div>
  );
}

export default function NPSPage() {
  const { t } = useLang();
  const nps = t.app.nps;
  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const responses = useQuery(api.nps.list as Parameters<typeof useQuery>[0], workspaceId ? { workspaceId } : 'skip') ?? [];
  const clients = useQuery(api.clients.list, workspaceId ? { workspaceId } : 'skip') ?? [];

  const [showForm, setShowForm] = useState(false);

  const typedResponses = responses as NpsResponse[];
  const typedClients = clients as Client[];

  const promoters = typedResponses.filter(r => (r.score as number) >= 9).length;
  const passives = typedResponses.filter(r => (r.score as number) >= 7 && (r.score as number) <= 8).length;
  const detractors = typedResponses.filter(r => (r.score as number) <= 6).length;
  const total = typedResponses.length;
  const npsScore = total > 0
    ? Math.round(((promoters - detractors) / total) * 100)
    : 0;
  const atRisk = typedResponses.filter(r => (r.score as number) < 7).map(r => {
    const client = typedClients.find(c => c._id === r.clientId);
    return { ...r, clientName: (client?.company as string) ?? nps.unknown };
  });

  return (
    <>
      {showForm && workspaceId && (
        <NPSForm workspaceId={workspaceId} clients={typedClients} onClose={() => setShowForm(false)} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{nps.title}</h1>
          <p className="text-sm text-fog mt-0.5">{nps.responseCount.replace('{{count}}', String(total))}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} disabled={!workspaceId}>
          <Plus size={14} />
          {nps.addResponse}
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
            <span className="text-xs font-medium text-ember">
              {(atRisk.length === 1 ? nps.churnRisk : nps.churnRiskPlural).replace('{{count}}', String(atRisk.length))}
            </span>
          </div>
          <div className="space-y-1">
            {atRisk.map(r => (
              <div key={r._id as string} className="flex items-center justify-between text-xs">
                <span className="text-silver">{r.clientName as string}</span>
                <span className={cn('font-mono font-bold', scoreColor(r.score as number))}>{r.score as number}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All responses */}
      {typedResponses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <TrendingUp size={36} className="text-fog/30" />
          <p className="text-sm text-fog">{nps.noResponses}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-fog uppercase tracking-widest mb-3">{nps.allResponses}</p>
          {typedResponses.map((r) => {
            const client = typedClients.find(c => c._id === r.clientId);
            return (
              <div
                key={r._id as string}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className={cn('text-2xl font-bold tabular-nums w-10 text-right', scoreColor(r.score as number))}>{r.score as number}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ivory">{(client?.company as string) ?? nps.unknown}</p>
                  {r.reason && <p className="text-[11px] text-fog mt-0.5 truncate">{r.reason as string}</p>}
                </div>
                <span className={cn('text-[10px] font-medium', scoreColor(r.score as number))}>{scoreLabel(r.score as number)}</span>
                <span className="text-[10px] text-fog">{new Date(r.respondedAt as number).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
