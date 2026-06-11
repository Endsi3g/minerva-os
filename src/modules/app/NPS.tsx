'use client';
import { useState, useEffect } from 'react';
import { Plus, Star, TrendingUp, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';

type NpsResponse = {
  id: string;
  _id: string;
  client_id: string;
  clientId: string;
  score: number;
  reason?: string;
  suggestion?: string;
  trigger_event: string;
  triggerEvent: string;
  responded_at: string;
  respondedAt: string;
};

type Client = {
  id: string;
  _id: string;
  company: string;
};

function scoreColor(score: number): string {
  if (score >= 9) return 'text-primary';
  if (score >= 7) return 'text-warning';
  return 'text-destructive';
}

function scoreLabel(score: number): string {
  if (score >= 9) return 'Promoter';
  if (score >= 7) return 'Passive';
  return 'Detractor';
}

function NPSGauge({ score }: { score: number }) {
  const pct = (score + 100) / 200 * 100;
  const color = score >= 0 ? (score >= 50 ? 'var(--primary)' : 'var(--warning)') : 'var(--danger)';
  return (
    <div className="relative">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>-100</span>
        <span className={cn('text-lg font-bold', score >= 0 ? 'text-primary' : 'text-destructive')}>{score >= 0 ? '+' : ''}{score}</span>
        <span>+100</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        {(() => {
          const gaugeStyle = { width: `${pct}%`, backgroundColor: color };
          return <div className="h-full rounded-full transition-all duration-500" style={gaugeStyle} />;
        })()}
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
        <span>Detractors</span>
        <span>Passives</span>
        <span>Promoters</span>
      </div>
    </div>
  );
}

function NPSForm({
  workspaceId,
  clients,
  onClose,
  onAdd,
}: {
  workspaceId: string;
  clients: Client[];
  onClose: () => void;
  onAdd: (r: NpsResponse) => void;
}) {
  const { t } = useLang();
  const f = t.app.nps.form;
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
    try {
      const { data, error } = await supabase
        .from('nps_responses')
        .insert({
          workspace_id: workspaceId,
          client_id: clientId,
          score,
          reason: reason || null,
          suggestion: suggestion || null,
          trigger_event: trigger,
        })
        .select()
        .single();
      if (!error && data) {
        onAdd({
          id: data.id,
          _id: data.id,
          client_id: data.client_id,
          clientId: data.client_id,
          score: data.score,
          reason: data.reason || undefined,
          suggestion: data.suggestion || undefined,
          trigger_event: data.trigger_event,
          triggerEvent: data.trigger_event,
          responded_at: data.responded_at,
          respondedAt: data.responded_at,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl p-6 space-y-4 bg-midnight border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{f.title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog"><X size={14} className="text-muted-foreground hover:text-foreground" /></button>
        </div>
        <div className="space-y-3">
          <select value={clientId} onChange={e => setClientId(e.target.value)}
            title="Client"
            className="w-full px-3 py-2 rounded-lg text-sm text-foreground outline-none bg-midnight border border-border">
            <option value="">{f.clientPlaceholder}</option>
            {clients.map((c) => <option key={c._id} value={c._id}>{c.company}</option>)}
          </select>

          <div>
            <p className="text-[10px] text-muted-foreground mb-2">{t.app.nps.scoreLabel}</p>
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
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <select value={trigger} onChange={e => setTrigger(e.target.value)}
            title="Trigger Event"
            className="w-full px-3 py-2 rounded-lg text-sm text-foreground outline-none bg-midnight border border-border">
            <option value="manual">{f.triggers.manual}</option>
            <option value="phase_complete">{f.triggers.phase_complete}</option>
            <option value="delivery">{f.triggers.delivery}</option>
            <option value="renewal">{f.triggers.renewal}</option>
          </select>

          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={f.reasonPlaceholder} rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none bg-obsidian border border-border" />
          <textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder={f.suggestionPlaceholder} rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none bg-obsidian border border-border" />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-muted-foreground hover:text-muted-foreground">{f.cancel}</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving || score === null}>{f.save}</Button>
        </div>
      </form>
    </div>
  );
}

export default function NPSPage() {
  const { t } = useLang();
  const nps = t.app.nps;

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [responses, setResponses] = useState<NpsResponse[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (!workspaceId) return;
    async function loadData() {
      const [{ data: nData }, { data: cData }] = await Promise.all([
        supabase.from('nps_responses').select('*').eq('workspace_id', workspaceId).order('responded_at', { ascending: false }),
        supabase.from('clients').select('*').eq('workspace_id', workspaceId),
      ]);
      if (nData) {
        setResponses(nData.map(r => ({
          id: r.id,
          _id: r.id,
          client_id: r.client_id,
          clientId: r.client_id,
          score: r.score,
          reason: r.reason || undefined,
          suggestion: r.suggestion || undefined,
          trigger_event: r.trigger_event,
          triggerEvent: r.trigger_event,
          responded_at: r.responded_at,
          respondedAt: r.responded_at,
        })));
      }
      if (cData) {
        setClients(cData.map(c => ({ ...c, _id: c.id })));
      }
    }
    loadData();
  }, [workspaceId]);

  const promoters = responses.filter(r => r.score >= 9).length;
  const passives = responses.filter(r => r.score >= 7 && r.score <= 8).length;
  const detractors = responses.filter(r => r.score <= 6).length;
  const total = responses.length;
  const npsScore = total > 0
    ? Math.round(((promoters - detractors) / total) * 100)
    : 0;

  const atRisk = responses.filter(r => r.score < 7).map(r => {
    const client = clients.find(c => c._id === r.clientId);
    return { score: r.score, clientName: client?.company ?? nps.unknown };
  });

  return (
    <>
      {showForm && workspaceId && (
        <NPSForm
          workspaceId={workspaceId}
          clients={clients}
          onClose={() => setShowForm(false)}
          onAdd={(newResponse) => setResponses(prev => [newResponse, ...prev])}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{nps.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{nps.responseCount.replace('{{count}}', String(total))}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          {nps.addResponse}
        </Button>
      </div>

      {/* ── NPS Guide ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="sm:col-span-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">What is NPS?</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Net Promoter Score measures client loyalty on a 0-10 scale. Clients who score 9-10 are <strong className="text-foreground">Promoters</strong> who refer others. Scores of 7-8 are <strong className="text-foreground">Passives</strong> who are satisfied but neutral. Scores of 0-6 are <strong className="text-foreground">Detractors</strong> at risk of churn. Your NPS equals % Promoters minus % Detractors, ranging from -100 to +100.
          </p>
        </div>
        {[
          {
            range: '9-10',
            label: 'Promoter',
            color: 'text-primary',
            bg: 'bg-primary/10 border-primary/20',
            desc: 'Highly loyal. Likely to refer new clients. Nurture with exclusive updates and early access.',
          },
          {
            range: '7-8',
            label: 'Passive',
            color: 'text-warning',
            bg: 'bg-warning/10 border-warning/20',
            desc: 'Satisfied but not enthusiastic. A proactive check-in can turn them into Promoters.',
          },
          {
            range: '0-6',
            label: 'Detractor',
            color: 'text-destructive',
            bg: 'bg-destructive/10 border-destructive/20',
            desc: 'At-risk of churning. Escalate immediately, address root causes, and track recovery over time.',
          },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border p-4 space-y-1.5 ${item.bg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${item.color}`}>{item.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">{item.range}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* NPS Score gauge */}
      <div className="rounded-xl p-5 border border-border bg-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Star size={14} className="text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-widest">Net Promoter Score</span>
        </div>
        <NPSGauge score={npsScore} />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Promoters', value: promoters, color: 'text-primary', sub: '9-10' },
            { label: 'Passives', value: passives, color: 'text-warning', sub: '7-8' },
            { label: 'Detractors', value: detractors, color: 'text-destructive', sub: '0-6' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={cn('text-xl font-bold tabular-nums', s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-[9px] text-muted-foreground/50">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* At-risk clients */}
      {atRisk.length > 0 && (
        <div className="rounded-xl p-4 border border-ember/20 bg-ember/5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={13} className="text-destructive" />
            <span className="text-xs font-medium text-destructive">
              {(atRisk.length === 1 ? nps.churnRisk : nps.churnRiskPlural).replace('{{count}}', String(atRisk.length))}
            </span>
          </div>
          <div className="space-y-1">
            {atRisk.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.clientName}</span>
                <span className={cn('font-mono font-bold', scoreColor(r.score))}>{r.score}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All responses */}
      {responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <TrendingUp size={36} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{nps.noResponses}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">{nps.allResponses}</p>
          {responses.map((r) => {
            const client = clients.find(c => c._id === r.clientId);
            return (
              <div
                key={r._id}
                className="flex items-start sm:items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl border flex-wrap sm:flex-nowrap bg-midnight border-border"
              >
                <div className={cn('text-2xl font-bold tabular-nums w-10 text-right', scoreColor(r.score))}>{r.score}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{client?.company ?? nps.unknown}</p>
                  {Boolean(r.reason) && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{r.reason}</p>}
                </div>
                <span className={cn('text-[10px] font-medium', scoreColor(r.score))}>{scoreLabel(r.score)}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(r.respondedAt).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
