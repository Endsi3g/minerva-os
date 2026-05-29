import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const { t, lang } = useLang();
  const p = t.app.pipeline;
  
  const workspaces = useWorkspaces();
  const workspaceId = workspaces[0]?.id;

  const leads = useDeals(workspaceId);
  const addDeal = useAddDeal();
  const updateDeal = useUpdateDeal();
  const updateStage = useUpdateDealStage();
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [form, setForm] = useState<NewDealForm>(EMPTY_FORM);

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
    setSheetOpen(true);
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: DealStage) => {
    const leadId = e.dataTransfer.getData('leadId');
    updateStage({ id: leadId, stage: stageId });
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

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{p.title}</h1>
          <p className="text-sm text-fog mt-0.5">
            {p.stats
              .replace('{{count}}', String(leads.length))
              .replace('{{total}}', fmt(leads.reduce((s: number, l: any) => s + l.value, 0), lang))}
          </p>
        </div>
        <Button size="sm" onClick={() => openSheet('new_lead')}>
          <Plus size={14} />
          {p.addDeal}
        </Button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {STAGES.map((stage: any) => {
          const stageLeads = leads.filter((l: any) => l.stage === stage.id);
          const total = totalValue(leads, stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={cn(
                'flex flex-col shrink-0 w-64 rounded-xl border p-3 gap-2 transition-colors',
                (STAGE_STYLE as any)[stage.id] ?? 'border-border bg-card/50'
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
                className="flex items-center gap-1.5 text-xs text-fog hover:text-silver transition-colors px-1 py-1.5 rounded-lg hover:bg-white/5 mt-1"
              >
                <Plus size={12} />
                {p.addDeal}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add/Edit deal sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
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
          </div>

          <Button className="w-full" onClick={handleSaveDeal}>
            {editingLead ? p.form.save : p.form.add}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
