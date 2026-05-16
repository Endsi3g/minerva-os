'use client';
import { useState } from 'react';
import { Plus, Search, FileText, Send, Copy, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLang } from '@/i18n';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  draft:    { label: 'Draft',    class: 'text-fog bg-fog/10 border-fog/20' },
  sent:     { label: 'Sent',     class: 'text-warm bg-warm/10 border-warm/20' },
  signed:   { label: 'Signed',   class: 'text-sage bg-sage/10 border-sage/20' },
  declined: { label: 'Declined', class: 'text-ember bg-ember/10 border-ember/20' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

type Section = { type: string; content: string };
const DEFAULT_SECTIONS: Section[] = [
  { type: 'intro', content: '' },
  { type: 'scope', content: '' },
  { type: 'timeline', content: '' },
  { type: 'pricing', content: '' },
  { type: 'terms', content: 'Payment is due within 30 days of invoice. All work remains property of the agency until payment is received in full.' },
];

function ProposalForm({ workspaceId, onClose, t }: { workspaceId: any; onClose: () => void; t: any }) {
  const createProposal = useMutation(api.proposals.create);
  const clients = useQuery(api.clients.list, workspaceId ? { workspaceId } : 'skip') ?? [];
  const services = useQuery(api.services.list as any, workspaceId ? { workspaceId } : 'skip') ?? [];
  const f = t.app.proposals.form;

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');

  function toggleService(id: string) {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  function updateSection(type: string, content: string) {
    setSections(prev => prev.map(s => s.type === type ? { ...s, content } : s));
  }

  const sectionLabels: Record<string, string> = {
    intro: f.intro, scope: f.scope, timeline: f.timeline, pricing: f.pricing, terms: f.terms,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !totalAmount) return;
    setSaving(true);
    await createProposal({
      workspaceId,
      title,
      clientId: clientId ? clientId as any : undefined,
      sections,
      serviceIds: selectedServices,
      totalAmount: Number(totalAmount),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]"
        style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-sm font-semibold text-ivory">{t.app.proposals.newProposal}</h2>
          <button type="button" onClick={onClose}><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Title + client */}
          <div className="grid grid-cols-2 gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={f.titlePlaceholder}
              className="col-span-2 px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-ivory outline-none"
              style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="">{f.selectClient}</option>
              {(clients as any[]).map(c => <option key={c._id} value={c._id}>{c.company}</option>)}
            </select>
            <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder={f.totalAmount}
              className="px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>

          {/* Services */}
          {(services as any[]).length > 0 && (
            <div>
              <p className="text-[10px] text-fog uppercase tracking-widest mb-2">{f.services}</p>
              <div className="flex flex-wrap gap-2">
                {(services as any[]).map((s: any) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => toggleService(s._id)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors border',
                      selectedServices.includes(s._id)
                        ? 'bg-sage/15 text-sage border-sage/30'
                        : 'text-fog border-white/10 hover:border-white/20'
                    )}
                  >
                    {selectedServices.includes(s._id) && <Check size={10} />}
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section tabs */}
          <div>
            <div className="flex gap-1 border-b border-white/5 mb-3">
              {sections.map(s => (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => setActiveSection(s.type)}
                  className={cn(
                    'px-3 py-1.5 text-[11px] border-b-2 -mb-px transition-colors capitalize',
                    activeSection === s.type
                      ? 'border-sage text-sage'
                      : 'border-transparent text-fog hover:text-silver'
                  )}
                >
                  {sectionLabels[s.type] ?? s.type}
                </button>
              ))}
            </div>
            {sections.map(s => s.type === activeSection && (
              <textarea
                key={s.type}
                value={s.content}
                onChange={e => updateSection(s.type, e.target.value)}
                rows={5}
                placeholder={`Write ${sectionLabels[s.type]?.toLowerCase()}...`}
                className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t border-white/5">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-fog hover:text-silver">{f.cancel}</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving}>{f.save}</Button>
        </div>
      </form>
    </div>
  );
}

export default function Proposals() {
  const { t } = useLang();
  const p = t.app.proposals;

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const proposals = useQuery(api.proposals.list as any, workspaceId ? { workspaceId } : 'skip') ?? [];
  const clients = useQuery(api.clients.list, workspaceId ? { workspaceId } : 'skip') ?? [];
  const sendProposal = useMutation(api.proposals.send as any);
  const removeProposal = useMutation(api.proposals.remove as any);

  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = (proposals as any[]).filter(prop =>
    prop.title.toLowerCase().includes(query.toLowerCase())
  );

  async function copyLink(proposal: any) {
    const url = `${window.location.origin}/portal/proposal/${proposal.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(proposal._id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <>
      {showForm && workspaceId && (
        <ProposalForm workspaceId={workspaceId} onClose={() => setShowForm(false)} t={t} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{p.title}</h1>
          <p className="text-sm text-fog mt-0.5">
            {p.subtitle.replace('{{count}}', String((proposals as any[]).length))}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} disabled={!workspaceId}>
          <Plus size={14} />
          {p.newProposal}
        </Button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
        <Input className="pl-8" placeholder={p.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <FileText size={36} className="text-fog/30" />
          <p className="text-sm text-fog">{p.noProposals}</p>
          {workspaceId && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <Plus size={12} />{p.newProposal}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((proposal: any) => {
            const client = (clients as any[]).find(c => c._id === proposal.clientId);
            const sc = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG.draft;
            const isCopied = copiedId === proposal._id;
            return (
              <div
                key={proposal._id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors hover:border-white/15"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ivory truncate">{proposal.title}</p>
                  {client && <p className="text-[11px] text-fog mt-0.5">{client.company}</p>}
                </div>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0', sc.class)}>
                  {sc.label}
                </span>
                <p className="text-sm font-semibold text-ivory tabular-nums shrink-0">
                  {fmt(proposal.totalAmount)}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  {proposal.status === 'draft' && (
                    <button
                      onClick={() => sendProposal({ id: proposal._id })}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-fog hover:text-sage hover:bg-sage/10 transition-colors"
                      title={p.actions.send}
                    >
                      <Send size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => copyLink(proposal)}
                    className={cn(
                      'h-7 w-7 flex items-center justify-center rounded-md transition-colors',
                      isCopied ? 'text-sage bg-sage/10' : 'text-fog hover:text-ivory hover:bg-white/5'
                    )}
                    title={isCopied ? p.actions.linkCopied : p.actions.copyLink}
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <button
                    onClick={() => removeProposal({ id: proposal._id })}
                    className="h-7 w-7 flex items-center justify-center rounded-md text-fog hover:text-ember hover:bg-ember/10 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
