'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Send, Copy, Trash2, X, Check, FileDown, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TextAnimate } from '@/components/ui/text-animate';
import { Input } from '@/components/ui/input';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';

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

function ProposalForm({
  workspaceId,
  onClose,
  t,
  onAdd,
}: {
  workspaceId: string;
  onClose: () => void;
  t: any;
  onAdd: (proposal: any) => void;
}) {
  const f = t.app.proposals.form;
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');

  const [aiBrief, setAiBrief] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!aiBrief.trim() || generating) return;
    setGenerating(true);
    try {
      const selectedClient = clients.find(c => c._id === clientId);
      const res = await fetch('/api/ai/proposal-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: aiBrief.trim(),
          clientCompany: selectedClient?.company || ''
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSections([
        { type: 'intro', content: data.intro },
        { type: 'scope', content: data.scope },
        { type: 'timeline', content: data.timeline },
        { type: 'pricing', content: data.pricing },
        { type: 'terms', content: DEFAULT_SECTIONS.find(s => s.type === 'terms')?.content || '' },
      ]);
    } catch (err) {
      console.error('Failed to generate proposal:', err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      const [{ data: cData }, { data: sData }] = await Promise.all([
        supabase.from('clients').select('*').eq('workspace_id', workspaceId),
        supabase.from('services').select('*').eq('workspace_id', workspaceId),
      ]);
      if (cData) setClients(cData.map(c => ({ ...c, _id: c.id })));
      if (sData) setServices(sData.map(s => ({ ...s, _id: s.id })));
    }
    loadData();
  }, [workspaceId]);

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
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          workspace_id: workspaceId,
          title,
          client_id: clientId ? clientId : null,
          sections,
          service_ids: selectedServices,
          total_amount: Number(totalAmount),
          status: 'draft',
          token,
        })
        .select()
        .single();
      if (!error && data) {
        onAdd({
          ...data,
          _id: data.id,
          clientId: data.client_id,
          totalAmount: Number(data.total_amount),
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh] bg-midnight border border-border"
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
              className="col-span-2 px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none bg-obsidian border border-border" />
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-ivory outline-none bg-midnight border border-border">
              <option value="">{f.selectClient}</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.company}</option>)}
            </select>
            <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder={f.totalAmount}
              className="px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none bg-obsidian border border-border" />
          </div>

          {/* Hermes AI Scoping Assistant */}
          <div 
            className="rounded-xl border p-4 space-y-3 bg-midnight border-sage/20"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-sage uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Sparkles size={11} className="animate-pulse" />
                Hermes AI Scoping Assistant
              </p>
            </div>
            <textarea
              value={aiBrief}
              onChange={e => setAiBrief(e.target.value)}
              placeholder="Enter general scoping details, budget requirements, and deliverables brief to draft all sections automatically..."
              rows={2}
              className="w-full px-3 py-1.5 rounded-lg text-xs text-ivory placeholder:text-fog/50 outline-none resize-none bg-obsidian border border-border/40"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !aiBrief.trim()}
                size="sm"
                variant="outline"
                className="text-[10px] h-7 border-white/10 font-sans"
              >
                {generating ? (
                  <>
                    <Loader2 size={10} className="mr-1.5 animate-spin" />
                    Drafting sections...
                  </>
                ) : (
                  <>
                    <Sparkles size={10} className="mr-1.5" />
                    Draft Proposal with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div>
              <p className="text-[10px] text-fog uppercase tracking-widest mb-2">{f.services}</p>
              <div className="flex flex-wrap gap-2">
                {services.map((s: any) => (
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
                className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none resize-none bg-obsidian border border-border"
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

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (!workspaceId) return;
    async function loadData() {
      const [{ data: prData }, { data: clData }] = await Promise.all([
        supabase.from('proposals').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('workspace_id', workspaceId),
      ]);
      if (prData) {
        setProposals(prData.map(pr => ({
          ...pr,
          _id: pr.id,
          clientId: pr.client_id,
          totalAmount: Number(pr.total_amount),
        })));
      }
      if (clData) {
        setClients(clData.map(c => ({ ...c, _id: c.id })));
      }
    }
    loadData();
  }, [workspaceId]);

  const filtered = proposals.filter(prop =>
    prop.title.toLowerCase().includes(query.toLowerCase())
  );

  async function copyLink(proposal: any) {
    const url = `${window.location.origin}/portal/proposal/${proposal.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(proposal._id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function sendProposal(proposalId: string) {
    const { error } = await supabase
      .from('proposals')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', proposalId);
    if (!error) {
      setProposals(prev =>
        prev.map(pr => pr._id === proposalId ? { ...pr, status: 'sent' } : pr)
      );
    }
  }

  async function removeProposal(proposalId: string) {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', proposalId);
    if (!error) {
      setProposals(prev => prev.filter(pr => pr._id !== proposalId));
    }
  }

  function printProposal(proposal: any) {
    const client = clients.find(c => c._id === proposal.clientId);
    const sectionsHtml = (proposal.sections ?? [])
      .map((s: any) => `<section><h2>${s.type}</h2><p>${s.content}</p></section>`)
      .join('');
    const html = `<!DOCTYPE html><html><head><title>${proposal.title}</title>
    <style>body{font-family:Inter,system-ui,sans-serif;padding:48px;max-width:780px;margin:0 auto;color:#111}
    h1{font-size:28px}h2{font-size:14px;text-transform:uppercase;letter-spacing:.05em;margin-top:32px;color:#555}
    p{font-size:13px;line-height:1.7}.total{margin-top:48px;border-top:2px solid #111;padding-top:16px;font-size:18px;font-weight:600}
    @media print{body{padding:0}}</style></head>
    <body><h1>${proposal.title}</h1>
    <p style="color:#777">Prepared for ${client?.company ?? 'Client'}</p>
    ${sectionsHtml}
    <div class="total">Investment: ${fmt(proposal.totalAmount)}</div>
    <script>window.onload=()=>{window.print();}</script></body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  return (
    <>
      {showForm && workspaceId && (
        <ProposalForm
          workspaceId={workspaceId}
          onClose={() => setShowForm(false)}
          t={t}
          onAdd={(newProp) => setProposals(prev => [newProp, ...prev])}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <TextAnimate text={p.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
          <p className="text-sm text-fog mt-0.5">
            {p.subtitle.replace('{{count}}', String(proposals.length))}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
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
            const client = clients.find(c => c._id === proposal.clientId);
            const sc = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG.draft;
            const isCopied = copiedId === proposal._id;
            return (
              <div
                key={proposal._id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors hover:border-white/15 bg-midnight border-border"
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
                      onClick={() => sendProposal(proposal._id)}
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
                    onClick={() => printProposal(proposal)}
                    className="h-7 w-7 flex items-center justify-center rounded-md text-fog hover:text-ivory hover:bg-white/5 transition-colors"
                    title="Export PDF"
                  >
                    <FileDown size={12} />
                  </button>
                  <button
                    onClick={() => removeProposal(proposal._id)}
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
