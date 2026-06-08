'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Search, FileText, Send, Copy, Trash2, X, Check, FileDown, Sparkles, Loader2, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TextAnimate } from '@/components/ui/text-animate';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';

const SERVICE_TYPES = [
  'Brand Identity',
  'Web Design',
  'Web Development',
  'Content Strategy',
  'UX Audit',
  'Retainer',
];

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

const TERMS_DEFAULT = 'Payment is due within 30 days of invoice. All work remains property of the studio until payment is received in full. The client receives full IP rights upon final payment. Two rounds of revisions are included per phase.';

type ProposalTemplate = { label: string; color: string; sections: Section[] };
const PROPOSAL_TEMPLATES: Record<string, ProposalTemplate> = {
  brand_identity: {
    label: 'Brand Identity',
    color: 'var(--color-amber)',
    sections: [
      { type: 'intro', content: 'We are pleased to present this brand identity proposal. This engagement covers the complete development of a visual identity system — from strategic positioning through final asset delivery.' },
      { type: 'scope', content: '· Brand strategy and positioning workshop\n· Logo system: primary, secondary, and icon marks\n· Colour palette, typography system, and spacing guidelines\n· Brand guidelines document (digital PDF)\n· Core asset package: business card, letterhead, email signature\n\nExclusions: Website design, photography, video production, social media templates.' },
      { type: 'timeline', content: '· Phase 1 (Week 1-2): Discovery, strategy, and moodboard presentation\n· Phase 2 (Week 3-4): Logo concepts — up to 3 directions presented\n· Phase 3 (Week 5): Refinements and selected direction developed\n· Phase 4 (Week 6): Final delivery — files, guidelines, and brand kit' },
      { type: 'pricing', content: '· Brand strategy workshop: $2,500\n· Logo system design: $4,500\n· Brand guidelines document: $2,000\n· Core asset package: $1,500\n· Total investment: $10,500\n· Deposit (50% on kickoff): $5,250\n· Balance (50% on final delivery): $5,250' },
      { type: 'terms', content: TERMS_DEFAULT },
    ],
  },
  web_design: {
    label: 'Web Design',
    color: 'var(--color-sage)',
    sections: [
      { type: 'intro', content: 'We are pleased to present this website design proposal. This engagement covers strategic design and user experience from discovery through developer-ready handoff.' },
      { type: 'scope', content: '· UX strategy and site map definition\n· Wireframes for all key page templates\n· High-fidelity design in Figma (desktop + mobile)\n· Design system: components, states, and interaction notes\n· Developer handoff package with specs and assets\n\nExclusions: Frontend development, CMS setup, copywriting, photography.' },
      { type: 'timeline', content: '· Phase 1 (Week 1-2): Discovery, sitemap, and wireframes\n· Phase 2 (Week 3-5): High-fidelity design — homepage and core templates\n· Phase 3 (Week 6): Inner pages and responsive breakpoints\n· Phase 4 (Week 7): Revisions, final QA, and developer handoff' },
      { type: 'pricing', content: '· UX strategy and sitemap: $1,500\n· Wireframes: $2,000\n· High-fidelity design (up to 8 templates): $6,000\n· Design system and handoff: $1,500\n· Total investment: $11,000\n· Deposit (50% on kickoff): $5,500\n· Balance (50% on handoff): $5,500' },
      { type: 'terms', content: TERMS_DEFAULT },
    ],
  },
  web_development: {
    label: 'Web Development',
    color: 'var(--color-fog)',
    sections: [
      { type: 'intro', content: 'We are pleased to present this web development proposal. This engagement covers full-stack implementation from technical setup through deployment and handoff.' },
      { type: 'scope', content: '· Technical architecture and stack selection\n· Frontend development (Next.js / React)\n· Backend API development and database setup\n· CMS integration and content entry\n· Staging environment and QA testing\n· Production deployment and DNS configuration\n\nExclusions: Ongoing maintenance (available as retainer), third-party API costs, copywriting.' },
      { type: 'timeline', content: '· Phase 1 (Week 1): Technical setup, architecture, and sprint planning\n· Phase 2 (Week 2-5): Core development — pages, features, and integrations\n· Phase 3 (Week 6): QA, bug fixes, and performance optimization\n· Phase 4 (Week 7): Deployment, client training, and handoff' },
      { type: 'pricing', content: '· Technical setup and architecture: $2,000\n· Frontend development: $7,000\n· Backend and integrations: $5,000\n· QA, deployment, and training: $2,000\n· Total investment: $16,000\n· Deposit (40% on kickoff): $6,400\n· Milestone (30% on staging): $4,800\n· Balance (30% on launch): $4,800' },
      { type: 'terms', content: 'Payment is due within 30 days of invoice. Source code and all assets transfer to the client upon final payment. Two rounds of QA revisions included. Critical bugs fixed at no charge for 30 days post-launch.' },
    ],
  },
  content_strategy: {
    label: 'Content Strategy',
    color: 'var(--color-silver)',
    sections: [
      { type: 'intro', content: 'We are pleased to present this content strategy proposal. This engagement defines content direction, voice, and execution roadmap to build a consistent, high-impact brand presence.' },
      { type: 'scope', content: '· Content audit and competitive analysis\n· Brand voice and tone guidelines\n· Content pillars and messaging framework\n· 90-day content calendar with topic suggestions\n· Copywriting for up to 4 core web pages\n\nExclusions: Ongoing content production, paid media, social media management.' },
      { type: 'timeline', content: '· Phase 1 (Week 1): Audit, research, and stakeholder alignment\n· Phase 2 (Week 2-3): Brand voice, tone guidelines, and messaging framework\n· Phase 3 (Week 4-5): Content calendar and web page copywriting\n· Phase 4 (Week 6): Review, refinements, and final delivery' },
      { type: 'pricing', content: '· Content audit and research: $1,200\n· Brand voice and messaging framework: $1,800\n· 90-day content calendar: $1,200\n· Web page copywriting (4 pages): $2,400\n· Total investment: $6,600\n· Deposit (50% on kickoff): $3,300\n· Balance (50% on delivery): $3,300' },
      { type: 'terms', content: TERMS_DEFAULT },
    ],
  },
  ux_audit: {
    label: 'UX Audit',
    color: 'var(--color-rose)',
    sections: [
      { type: 'intro', content: 'We are pleased to present this UX audit proposal. This engagement delivers a structured expert review of your current product, identifying friction points and prioritized opportunities to improve conversion and user satisfaction.' },
      { type: 'scope', content: '· Heuristic evaluation against 10 established UX principles\n· User flow mapping and friction point identification\n· Accessibility assessment (WCAG 2.1 AA)\n· Annotated audit report with severity ratings (critical / major / minor)\n· Prioritized recommendations roadmap\n\nExclusions: User testing recruitment and sessions, implementation of recommendations.' },
      { type: 'timeline', content: '· Phase 1 (Week 1): Onboarding, access setup, and scope alignment\n· Phase 2 (Week 2): Heuristic evaluation and flow analysis\n· Phase 3 (Week 3): Report writing and recommendations\n· Phase 4 (Week 4): Presentation, Q&A, and final delivery' },
      { type: 'pricing', content: '· Heuristic evaluation: $1,500\n· Accessibility assessment: $1,000\n· Audit report and roadmap: $1,500\n· Presentation and Q&A session: $500\n· Total investment: $4,500\n· Full payment on kickoff: $4,500' },
      { type: 'terms', content: 'Payment is due at project kickoff. All deliverables remain property of the studio until payment is received. Client receives full rights upon payment. One round of clarification revisions included.' },
    ],
  },
  retainer: {
    label: 'Retainer',
    color: 'var(--color-sage)',
    sections: [
      { type: 'intro', content: 'We are pleased to present this retainer agreement. This ongoing engagement provides dedicated, priority access to our team for a defined monthly scope — enabling faster delivery and a consistent creative partnership.' },
      { type: 'scope', content: '· Up to 40 hours of creative and strategic work per month\n· Priority turnaround (48-hr response guarantee)\n· Weekly check-in call (30 minutes)\n· Monthly reporting summary\n· Access to all service disciplines: strategy, design, development\n\nExclusions: Out-of-scope work beyond monthly hours (billed at overage rate). Hours do not roll over.' },
      { type: 'timeline', content: '· Month-to-month engagement with 30-day written notice to cancel\n· Kickoff: onboarding call, access setup, and first month planning\n· Ongoing: weekly check-ins, monthly review, and scope confirmation\n· Renewal: automatic unless notice is given before the 15th of the prior month' },
      { type: 'pricing', content: '· Monthly retainer: $5,000 USD\n· Included hours: 40 hrs/month\n· Overage rate: $150/hr (invoiced at month-end)\n· Invoiced on the 1st of each month\n· First invoice due on kickoff date' },
      { type: 'terms', content: 'Monthly invoices are due within 15 days of issue. All work becomes property of the client upon payment of the applicable monthly invoice. Either party may terminate with 30 days written notice. Outstanding balances must be settled before IP transfer.' },
    ],
  },
};

/* ── Proposal Copilot ─────────────────────────────────────────────────────── */
function ProposalCopilot({
  workspaceId,
  onClose,
  onGenerated,
}: {
  workspaceId: string;
  onClose: () => void;
  onGenerated: (data: { title: string; clientId: string; sections: Section[]; budget: number }) => void;
}) {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [budget, setBudget] = useState('');
  const [additionalBrief, setAdditionalBrief] = useState('');
  const [step, setStep] = useState<'brief' | 'generating' | 'done'>('brief');
  const [pricingSuggestion, setPricingSuggestion] = useState<{
    suggested_min: number; suggested_max: number; based_on_count: number; insight: string;
  } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  useEffect(() => {
    supabase.from('clients').select('*').eq('workspace_id', workspaceId).then(({ data }: { data: any }) => {
      if (data) setClients(data.map((c: any) => ({ ...c, _id: c.id })));
    });
  }, [workspaceId]);

  async function loadPricingSuggestion(svcType: string) {
    if (!svcType) return;
    setPricingLoading(true);
    try {
      const res = await fetch('/api/agents/pricing-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, serviceType: svcType, budget: budget ? Number(budget) : undefined }),
      });
      const data = await res.json();
      if (!data.error) setPricingSuggestion(data);
    } catch { /* non-critical */ }
    setPricingLoading(false);
  }

  function handleServiceTypeChange(val: string) {
    setServiceType(val);
    if (val) loadPricingSuggestion(val);
    else setPricingSuggestion(null);
  }

  async function handleGenerate() {
    if (!serviceType) return;
    setStep('generating');
    try {
      const selectedClient = clients.find((c: any) => c._id === clientId);
      const res = await fetch('/api/ai/proposal-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: additionalBrief || `${serviceType} project`,
          clientCompany: selectedClient?.company || '',
          serviceType,
          budget: budget ? Number(budget) : undefined,
          workspaceId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const sections: Section[] = [
        { type: 'intro', content: data.intro },
        { type: 'scope', content: data.scope },
        { type: 'timeline', content: data.timeline },
        { type: 'pricing', content: data.pricing },
        { type: 'terms', content: data.terms || DEFAULT_SECTIONS.find(s => s.type === 'terms')!.content },
      ];

      const title = `${serviceType}${selectedClient ? ` · ${selectedClient.company}` : ''}`;
      onGenerated({ title, clientId, sections, budget: budget ? Number(budget) : 0 });
    } catch (err) {
      console.error('[Copilot generate]', err);
      setStep('brief');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col bg-midnight border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-sage animate-pulse" />
            <span className="text-sm font-semibold text-ivory">Quick Proposal</span>
          </div>
          <button onClick={onClose} aria-label="Close dialog"><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>

        <div className="p-5 space-y-4">
          {step === 'generating' ? (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-sage/20 border-t-sage animate-spin" />
                <Sparkles size={16} className="absolute inset-0 m-auto text-sage" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ivory">Writing your proposal...</p>
                <p className="text-xs text-fog mt-1">Hermes is tailoring scope, timeline, and pricing</p>
              </div>
            </div>
          ) : (
            <>
              {/* Client */}
              <div>
                <label className="text-[10px] text-fog uppercase tracking-wider font-semibold mb-1.5 block">Client</label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  title="Client"
                  className="w-full px-3 py-2 rounded-lg text-sm text-ivory bg-obsidian border border-border outline-none"
                >
                  <option value="">Select a client (optional)</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.company}</option>)}
                </select>
              </div>

              {/* Service type */}
              <div>
                <label className="text-[10px] text-fog uppercase tracking-wider font-semibold mb-1.5 block">Service Type</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TYPES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleServiceTypeChange(serviceType === s ? '' : s)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs border transition-colors',
                        serviceType === s
                          ? 'bg-sage/15 text-sage border-sage/30'
                          : 'text-fog border-border hover:border-border hover:text-silver'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget + pricing suggestion */}
              <div>
                <label className="text-[10px] text-fog uppercase tracking-wider font-semibold mb-1.5 block">Approximate Budget (USD)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. 12000"
                  className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog bg-obsidian border border-border outline-none"
                />
                {/* Pricing suggestion widget */}
                {pricingLoading && (
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-fog">
                    <Loader2 size={10} className="animate-spin" />
                    Checking your project history...
                  </div>
                )}
                {!pricingLoading && pricingSuggestion && (
                  <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-sage/5 border border-sage/15">
                    <TrendingUp size={12} className="text-sage mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-sage font-semibold">
                        Suggested range: {fmt(pricingSuggestion.suggested_min)} – {fmt(pricingSuggestion.suggested_max)}
                      </p>
                      <p className="text-[10px] text-fog mt-0.5">{pricingSuggestion.insight}</p>
                      {budget && Number(budget) < pricingSuggestion.suggested_min * 0.7 && (
                        <p className="text-[10px] text-amber mt-0.5">Your budget is below typical range for this service</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional context */}
              <div>
                <label className="text-[10px] text-fog uppercase tracking-wider font-semibold mb-1.5 block">Additional Context (optional)</label>
                <textarea
                  value={additionalBrief}
                  onChange={e => setAdditionalBrief(e.target.value)}
                  placeholder="Any specific requirements, deliverables, or constraints..."
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg text-xs text-ivory placeholder:text-fog/50 bg-obsidian border border-border outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 py-2 text-xs text-fog hover:text-silver">Cancel</button>
                <Button
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={!serviceType}
                  onClick={handleGenerate}
                >
                  <Sparkles size={12} />
                  Generate Proposal
                  <ArrowRight size={12} />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProposalForm({
  workspaceId,
  onClose,
  t,
  onAdd,
  seed,
}: {
  workspaceId: string;
  onClose: () => void;
  t: any;
  onAdd: (proposal: any) => void;
  seed?: { title: string; clientId: string; sections: Section[]; budget: number } | null;
}) {
  const f = t.app.proposals.form;
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [title, setTitle] = useState(seed?.title ?? '');
  const [clientId, setClientId] = useState(seed?.clientId ?? '');
  const [sections, setSections] = useState<Section[]>(seed?.sections ?? DEFAULT_SECTIONS);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState(seed?.budget ? String(seed.budget) : '');
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');

  const [aiBrief, setAiBrief] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  function applyTemplate(key: string) {
    const tpl = PROPOSAL_TEMPLATES[key];
    if (!tpl) return;
    setSections(tpl.sections.map(s => ({ ...s })));
    setActiveTemplate(key);
    if (!title) setTitle(`${tpl.label} Proposal`);
  }

  const handleGenerate = async () => {
    if (!aiBrief.trim() || generating) return;
    setGenerating(true);
    try {
      const selectedClient = clients.find((c: any) => c._id === clientId);
      const res = await fetch('/api/ai/proposal-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: aiBrief.trim(),
          clientCompany: selectedClient?.company || '',
          workspaceId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSections([
        { type: 'intro', content: data.intro },
        { type: 'scope', content: data.scope },
        { type: 'timeline', content: data.timeline },
        { type: 'pricing', content: data.pricing },
        { type: 'terms', content: data.terms || DEFAULT_SECTIONS.find(s => s.type === 'terms')?.content || '' },
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
      if (cData) setClients((cData as any[]).map((c: any) => ({ ...c, _id: c.id })));
      if (sData) setServices((sData as any[]).map((s: any) => ({ ...s, _id: s.id })));
    }
    loadData();
  }, [workspaceId]);

  function toggleService(id: string) {
    setSelectedServices((prev: string[]) =>
      prev.includes(id) ? prev.filter((s: string) => s !== id) : [...prev, id]
    );
  }

  function updateSection(type: string, content: string) {
    setSections((prev: Section[]) => prev.map((s: Section) => s.type === type ? { ...s, content } : s));
  }

  const sectionLabels: Record<string, string> = {
    intro: f.intro, scope: f.scope, timeline: f.timeline, pricing: f.pricing, terms: f.terms,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) { toast.error(f.titleRequired); return; }
    if (!totalAmount) { toast.error(f.amountRequired); return; }
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
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh] bg-midnight border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-ivory">{t.app.proposals.newProposal}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog"><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Title + client */}
          <div className="grid grid-cols-2 gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={f.titlePlaceholder}
              className="col-span-2 px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none bg-obsidian border border-border" />
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              title="Select Client"
              className="px-3 py-2 rounded-lg text-sm text-ivory outline-none bg-midnight border border-border">
              <option value="">{f.selectClient}</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.company}</option>)}
            </select>
            <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder={f.totalAmount}
              className="px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none bg-obsidian border border-border" />
          </div>

          {/* Quick templates */}
          <div>
            <p className="text-[10px] text-fog uppercase tracking-widest mb-2">Quick templates</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PROPOSAL_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs transition-all border',
                    activeTemplate === key
                      ? 'border-transparent font-medium'
                      : 'text-fog border-border hover:border-border'
                  )}
                  style={(() => {
                    const templateStyle = activeTemplate === key ? { backgroundColor: `${tpl.color}20`, color: tpl.color, borderColor: `${tpl.color}40` } : {};
                    return templateStyle;
                  })()}
                >
                  {activeTemplate === key && <Check size={9} className="inline mr-1" />}
                  {tpl.label}
                </button>
              ))}
            </div>
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
                className="text-[10px] h-7 border-border font-sans"
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
                        : 'text-fog border-border hover:border-border'
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
            <div className="flex gap-1 border-b border-border mb-3">
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

        <div className="flex gap-2 p-5 border-t border-border">
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
  const searchParams = useSearchParams();
  const { workspace: wsCtx } = useWorkspace();

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(searchParams.get('copilot') === '1');
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotSeed, setCopilotSeed] = useState<{ title: string; clientId: string; sections: Section[]; budget: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    const base = wsCtx?.customDomain ? `https://${wsCtx.customDomain}` : window.location.origin;
    const url = `${base}/portal/proposal/${proposal.token}`;
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
      toast.success(p.form.sendSuccess);
    }
  }

  async function removeProposal(proposalId: string) {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', proposalId);
    if (!error) {
      setProposals(prev => prev.filter(pr => pr._id !== proposalId));
      toast.success(p.form.removeSuccess);
    }
  }

  async function exportPDF(proposal: any) {
    if (exportingId) return;
    setExportingId(proposal._id);
    try {
      const client = clients.find(c => c._id === proposal.clientId);
      const workspaceName = workspaces[0]?.name ?? 'Uprising Studio';
      const res = await fetch('/api/export/proposal-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: proposal.title,
          clientName: client?.company ?? 'Client',
          studioName: workspaceName,
          totalAmount: proposal.totalAmount,
          sections: proposal.sections ?? [],
        }),
      });
      if (!res.ok) throw new Error('PDF export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-${proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[PDF export]', err);
    } finally {
      setExportingId(null);
    }
  }

  return (
    <>
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={open => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{p.form.removeConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{p.form.removeConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{p.form.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { if (confirmDeleteId) removeProposal(confirmDeleteId); setConfirmDeleteId(null); }}>
              {p.actions.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showForm && workspaceId && (
        <ProposalForm
          workspaceId={workspaceId}
          onClose={() => { setShowForm(false); setCopilotSeed(null); }}
          t={t}
          seed={copilotSeed}
          onAdd={(newProp) => setProposals(prev => [newProp, ...prev])}
        />
      )}

      {showCopilot && workspaceId && (
        <ProposalCopilot
          workspaceId={workspaceId}
          onClose={() => setShowCopilot(false)}
          onGenerated={(data) => {
            setCopilotSeed(data);
            setShowCopilot(false);
            setShowForm(true);
          }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <TextAnimate text={p.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
          <p className="text-sm text-fog mt-0.5">
            {p.subtitle.replace('{{count}}', String(proposals.length))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCopilot(true)} className="flex items-center gap-1.5 border-sage/30 text-sage hover:bg-sage/10">
            <Sparkles size={13} />
            Quick Proposal
          </Button>
          <Button size="sm" onClick={() => { setCopilotSeed(null); setShowForm(true); }}>
            <Plus size={14} />
            {p.newProposal}
          </Button>
        </div>
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
                className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors hover:border-border bg-midnight border-border"
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
                      isCopied ? 'text-sage bg-sage/10' : 'text-fog hover:text-ivory hover:bg-accent'
                    )}
                    title={isCopied ? p.actions.linkCopied : p.actions.copyLink}
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <button
                    onClick={() => exportPDF(proposal)}
                    disabled={exportingId === proposal._id}
                    className="h-7 w-7 flex items-center justify-center rounded-md text-fog hover:text-ivory hover:bg-accent transition-colors disabled:opacity-40"
                    title="Export PDF"
                  >
                    {exportingId === proposal._id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <FileDown size={12} />
                    }
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(proposal._id)}
                    className="h-7 w-7 flex items-center justify-center rounded-md text-fog hover:text-ember hover:bg-ember/10 transition-colors"
                    aria-label="Delete Proposal"
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
