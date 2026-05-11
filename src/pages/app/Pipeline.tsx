import { useState } from 'react';
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
import { MOCK_LEADS } from '@/lib/mock-data';
import type { Lead, DealStage } from '@/lib/types';

const STAGES: { id: DealStage; label: string }[] = [
  { id: 'new_lead',    label: 'New Lead' },
  { id: 'qualified',   label: 'Qualified' },
  { id: 'proposal',    label: 'Proposal Sent' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'won',         label: 'Closed Won' },
  { id: 'lost',        label: 'Closed Lost' },
];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function totalValue(leads: Lead[], stage: DealStage) {
  return leads.filter(l => l.stage === stage).reduce((s, l) => s + l.value, 0);
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
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewDealForm>(EMPTY_FORM);

  function openSheet(stage: DealStage) {
    setForm({ ...EMPTY_FORM, stage });
    setSheetOpen(true);
  }

  function handleAdd() {
    if (!form.company.trim()) return;
    const lead: Lead = {
      id: `l${Date.now()}`,
      company: form.company.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      value: parseFloat(form.value) || 0,
      probability: 20,
      stage: form.stage,
      daysInStage: 0,
      owner: 'US',
      notes: form.notes.trim() || undefined,
    };
    setLeads(prev => [lead, ...prev]);
    setSheetOpen(false);
    setForm(EMPTY_FORM);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">Pipeline</h1>
          <p className="text-sm text-fog mt-0.5">{leads.length} deals · {fmt(leads.reduce((s, l) => s + l.value, 0))} total value</p>
        </div>
        <Button size="sm" onClick={() => openSheet('new_lead')}>
          <Plus size={14} />
          Add deal
        </Button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage.id);
          const total = totalValue(leads, stage.id);
          return (
            <div
              key={stage.id}
              className={cn(
                'flex flex-col shrink-0 w-64 rounded-xl border p-3 gap-2',
                STAGE_STYLE[stage.id] ?? 'border-border bg-card/50'
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
                  <span className="text-[10px] text-fog">{fmt(total)}</span>
                )}
              </div>

              {/* Deal cards */}
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {stageLeads.map(lead => (
                  <DealCard key={lead.id} lead={lead} />
                ))}
              </div>

              {/* Add deal */}
              <button
                onClick={() => openSheet(stage.id)}
                className="flex items-center gap-1.5 text-xs text-fog hover:text-silver transition-colors px-1 py-1.5 rounded-lg hover:bg-white/5 mt-1"
              >
                <Plus size={12} />
                Add deal
              </button>
            </div>
          );
        })}
      </div>

      {/* Add deal sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>New Deal</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input placeholder="Acme Corp" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact name</Label>
              <Input placeholder="Jane Smith" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="jane@acme.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Deal value (USD)</Label>
              <Input type="number" placeholder="25000" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
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
              <Label>Notes</Label>
              <textarea
                placeholder="Context, requirements, next steps..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="flex w-full rounded-md border border-border bg-midnight px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <Button className="w-full" onClick={handleAdd}>Add Deal</Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
