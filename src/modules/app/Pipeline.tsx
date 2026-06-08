'use client';
import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { UpgradeBanner } from '@/components/minerva/UpgradeBanner';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TextAnimate } from '@/components/ui/text-animate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DealCard } from '@/components/minerva/DealCard';
import type { DealStage } from '@/lib/types';
import { useLang } from '@/i18n';
import { useWorkspaces, useDeals, useAddDeal, useUpdateDeal, useUpdateDealStage } from '@/lib/hooks/useSupabase';
import { supabase } from '@/lib/supabase';

function fmt(n: number, lang: string) {
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 0 
  }).format(n);
}

function totalValue(leads: any[], stage: DealStage) {
  return leads.filter((l: any) => l.stage === stage).reduce((s: number, l: any) => s + l.value, 0);
}

const STAGE_STYLE: Partial<Record<DealStage, string>> = {
  won:  'border-sage/25 bg-sage/5',
  lost: 'border-ember/25 bg-ember/5',
};

function KanbanSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex flex-col shrink-0 w-64 rounded-xl border border-border bg-card/20 p-3 gap-3">
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-4 w-24 bg-secondary/60" />
            <Skeleton className="h-4 w-8 rounded-full bg-secondary/60" />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {[1, 2].map(j => (
              <div key={j} className="bg-midnight border border-border rounded-xl p-4 space-y-3 animate-pulse">
                <Skeleton className="h-4 w-3/4 bg-secondary/60" />
                <Skeleton className="h-3 w-1/2 bg-secondary/60" />
                <div className="flex justify-between pt-1">
                  <Skeleton className="h-3 w-12 bg-secondary/60" />
                  <Skeleton className="h-3 w-16 bg-secondary/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface NewDealForm {
  company: string;
  contact: string;
  email: string;
  value: string;
  stage: DealStage;
  notes: string;
}

const EMPTY_FORM: NewDealForm = {
  company: '', contact: '', email: '', value: '', stage: 'new_lead', notes: '',
};

export default function Pipeline() {
  const router = useRouter();
  const { t, lang } = useLang();
  const p = t.app.pipeline;
  
  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id;

  useEffect(() => {
    if (workspaces !== null && workspaces.length === 0) {
      router.replace('/onboarding/discover');
    }
  }, [workspaces, router]);

  const leads = useDeals(workspaceId);
  const addDeal = useAddDeal();
  const updateDeal = useUpdateDeal();
  const updateStage = useUpdateDealStage();
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [form, setForm] = useState<NewDealForm>(EMPTY_FORM);
  const [emailDraft, setEmailDraft] = useState<{ id: string; subject: string; body: string } | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  const [localLeads, setLocalLeads] = useState<any[]>([]);

  useEffect(() => {
    if (leads) {
      setLocalLeads(leads);
    }
  }, [leads]);

  const isLoading = leads === null;

  const STAGES = useMemo(() => [
    { id: 'new_lead' as DealStage,    label: p.stages.new_lead },
    { id: 'qualified' as DealStage,   label: p.stages.qualified },
    { id: 'proposal' as DealStage,    label: p.stages.proposal },
    { id: 'negotiation' as DealStage, label: p.stages.negotiation },
    { id: 'won' as DealStage,         label: p.stages.won },
    { id: 'lost' as DealStage,        label: p.stages.lost },
  ], [p]);

  function openSheet(stage: DealStage) {
    setEditingLead(null);
    setForm({ ...EMPTY_FORM, stage });
    setEmailDraft(null);
    setSheetOpen(true);
  }

  function openEditSheet(lead: any) {
    setEditingLead(lead);
    setForm({
      company: lead.company,
      contact: lead.contact,
      email: lead.email,
      value: lead.value.toString(),
      stage: lead.stage,
      notes: lead.notes || '',
    });
    setEmailDraft(null);
    if (lead.email) {
      supabase.from('email_drafts')
        .select('id, subject, body')
        .eq('recipient_email', lead.email)
        .eq('status', 'draft')
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setEmailDraft({
              id: data.id,
              subject: data.subject,
              body: data.body,
            });
          }
        });
    }
    setSheetOpen(true);
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stageId: DealStage) => {
    const leadId = e.dataTransfer.getData('leadId');
    const originalLeads = [...localLeads];

    // Optimistic Update
    setLocalLeads(prev => prev.map(l => l._id === leadId ? { ...l, stage: stageId } : l));

    try {
      await updateStage({ id: leadId, stage: stageId });
    } catch (err) {
      setLocalLeads(originalLeads);
      toast.error("Failed to move deal");
    }
  };

  async function handleSaveDeal() {
    if (!form.company.trim() || !workspaceId) return;

    if (editingLead) {
      await updateDeal({
        id: editingLead._id,
        company: form.company.trim(),
        contact: form.contact.trim(),
        email: form.email.trim(),
        value: parseFloat(form.value) || 0,
        stage: form.stage,
        notes: form.notes.trim() || undefined,
        lastContact: editingLead.lastContact,
      });
    } else {
      await addDeal({
        workspaceId,
        company: form.company.trim(),
        contact: form.contact.trim(),
        email: form.email.trim(),
        value: parseFloat(form.value) || 0,
        stage: form.stage,
        notes: form.notes.trim() || undefined,
        lastContact: new Date().toISOString().split('T')[0],
      });
    }
    
    setSheetOpen(false);
    setForm(EMPTY_FORM);
    setEditingLead(null);
  }

  const handleOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEmailDraft(null);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <TextAnimate text={p.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
          <p className="text-sm text-fog mt-0.5">
            {p.stats
              .replace('{{count}}', String(localLeads ? localLeads.length : 0))
              .replace('{{total}}', fmt(localLeads ? localLeads.reduce((s: number, l: any) => s + l.value, 0) : 0, lang))}
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => openSheet('new_lead')} 
          id="btn-new-deal"
          className="bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-all font-semibold px-4 h-9 text-xs"
        >
          <Plus size={14} />
          {p.addDeal}
        </Button>
      </div>

      <UpgradeBanner featureKey="intelligence" show={(localLeads?.length ?? 0) >= 5} />

      {isLoading ? (
        <KanbanSkeleton />
      ) : (
        /* Kanban board */
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 min-h-[calc(100vh-200px)]">
          {STAGES.map((stage: any) => {
            const stageLeads = localLeads.filter((l: any) => l.stage === stage.id);
            const total = totalValue(localLeads, stage.id);
            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={cn(
                  'flex flex-col shrink-0 w-64 rounded-md border p-3 gap-2 transition-colors',
                  (STAGE_STYLE as any)[stage.id] ?? 'border-border bg-card/40'
                )}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-1 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-fog">
                      {stage.label}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-dusk text-fog">
                      {stageLeads.length}
                    </span>
                  </div>
                  {total > 0 && (
                    <span className="text-[10px] text-fog">{fmt(total, lang)}</span>
                  )}
                </div>

                {/* Deal cards */}
                <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                  {stageLeads.map((lead: any) => (
                    <DealCard 
                      key={lead._id} 
                      lead={lead} 
                      onEdit={() => openEditSheet(lead)}
                      onDragStart={(e) => handleDragStart(e, lead._id)}
                    />
                  ))}
                </div>

              {/* Add deal */}
              <button
                onClick={() => openSheet(stage.id)}
                className="flex items-center gap-1.5 text-xs text-fog hover:text-silver transition-colors px-1 py-1.5 rounded-lg hover:bg-accent mt-1"
              >
                <Plus size={12} />
                {p.addDeal}
              </button>
            </div>
          );
        })}
      </div>
      )}

      {/* Add/Edit deal sheet */}
      <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className={cn("w-full sm:w-96 p-6 flex flex-col gap-6 transition-all duration-300 overflow-y-auto", emailDraft && "sm:w-[480px] lg:w-[540px]")}>
          <SheetHeader>
            <SheetTitle>{editingLead ? p.editDeal : p.newDeal}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label>{p.form.company}</Label>
              <Input placeholder={p.form.companyPlaceholder} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{p.form.contact}</Label>
              <Input placeholder={p.form.contactPlaceholder} value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{p.form.email}</Label>
              <Input type="email" placeholder={p.form.emailPlaceholder} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{p.form.value}</Label>
              <Input type="number" placeholder={p.form.valuePlaceholder} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{p.form.stage}</Label>
              <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v as DealStage }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{p.form.notes}</Label>
              <textarea
                placeholder={p.form.notesPlaceholder}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="flex w-full rounded-md border border-border bg-midnight px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {emailDraft && (
              <div className="border border-border bg-obsidian/40 rounded-2xl p-4 mt-2 space-y-3 relative overflow-hidden transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-warm font-semibold">
                    <Sparkles size={13} className="text-warm animate-pulse" />
                    <span>{p.hermes.replyDraft}</span>
                  </div>
                  <div className="text-[10px] text-fog font-mono">Source: AI CRM Agent</div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-fog">Subject</Label>
                    <Input
                      className="h-8 text-xs bg-midnight border-border text-ivory focus-visible:ring-1"
                      value={emailDraft.subject}
                      onChange={e => setEmailDraft(prev => prev ? { ...prev, subject: e.target.value } : null)}
                      title="Subject"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-fog">Body</Label>
                    <textarea
                      rows={5}
                      className="w-full rounded-md border border-border bg-midnight px-2 py-1.5 text-xs text-silver placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-sans"
                      value={emailDraft.body}
                      onChange={e => setEmailDraft(prev => prev ? { ...prev, body: e.target.value } : null)}
                      title="Body"
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full h-8 text-xs bg-ivory text-obsidian rounded-xl flex items-center justify-center gap-1.5 hover:bg-ivory/90"
                  disabled={savingDraft}
                  onClick={async () => {
                    setSavingDraft(true);
                    try {
                      const { error } = await supabase
                        .from('email_drafts')
                        .update({
                          subject: emailDraft.subject,
                          body: emailDraft.body,
                          status: 'sent'
                        })
                        .eq('id', emailDraft.id);
                      if (error) throw error;
                      setEmailDraft(null);
                    } catch (err) {
                      console.error('Failed to send draft:', err);
                    } finally {
                      setSavingDraft(false);
                    }
                  }}
                >
                  {savingDraft ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  {p.hermes.approveAndSend}
                </Button>
              </div>
            )}
          </div>

          <Button className="w-full" onClick={handleSaveDeal}>
            {editingLead ? p.form.save : p.form.add}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
