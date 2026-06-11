'use client';
import { useState, useEffect } from 'react';
import {
  Plus,
  FileSignature,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';

type ContractStatus = 'draft' | 'sent' | 'signed' | 'declined';

interface Contract {
  id: string;
  title: string;
  client_name: string;
  status: ContractStatus;
  value: number | null;
  body: string;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  draft:    { label: 'Draft',    icon: Pencil,      color: 'text-muted-foreground', bg: 'bg-muted' },
  sent:     { label: 'Sent',     icon: Clock,       color: 'text-warning',          bg: 'bg-warning/10' },
  signed:   { label: 'Signed',   icon: CheckCircle, color: 'text-success',          bg: 'bg-success/10' },
  declined: { label: 'Declined', icon: XCircle,     color: 'text-destructive',      bg: 'bg-destructive/10' },
};

const DEFAULT_TEMPLATE = `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into between Uprising Studio ("Agency") and [CLIENT NAME] ("Client").

SCOPE OF SERVICES
The Agency agrees to provide the following services:
- [Service 1]
- [Service 2]
- [Service 3]

PAYMENT TERMS
Total project value: $[AMOUNT]
Payment schedule: 50% upon signing, 50% upon delivery.

TIMELINE
Project start date: [START DATE]
Estimated completion: [END DATE]

OWNERSHIP
Upon receipt of full payment, the Client shall own all final deliverables.

CONFIDENTIALITY
Both parties agree to keep all project details confidential.

SIGNATURES
Client: ________________________  Date: __________
Agency: _______________________  Date: __________
`;

function ContractCard({
  contract,
  onEdit,
  onDelete,
  onSend,
  onDuplicate,
}: {
  contract: Contract;
  onEdit: (c: Contract) => void;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
  onDuplicate: (c: Contract) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[contract.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileSignature size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{contract.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{contract.client_name || 'No client'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium', cfg.bg, cfg.color)}>
            <StatusIcon size={11} />
            {cfg.label}
          </span>
          {contract.value != null && (
            <span className="text-xs font-medium text-foreground">${contract.value.toLocaleString()}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {contract.status === 'draft' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onSend(contract.id)} title="Send to client">
              <Send size={13} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(contract)} title="Edit">
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onDuplicate(contract)} title="Duplicate">
            <Copy size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(contract.id)} title="Delete">
            <Trash2 size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setExpanded(e => !e)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-5 border-t border-border">
          <pre className="mt-4 text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/40 rounded-xl p-4 max-h-64 overflow-y-auto">
            {contract.body || '(No content)'}
          </pre>
          <p className="text-[10px] text-muted-foreground mt-3">
            Created {new Date(contract.created_at).toLocaleDateString()}
            {contract.sent_at && ` · Sent ${new Date(contract.sent_at).toLocaleDateString()}`}
            {contract.signed_at && ` · Signed ${new Date(contract.signed_at).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );
}

interface FormState {
  title: string;
  client_name: string;
  value: string;
  body: string;
}

const EMPTY_FORM: FormState = { title: '', client_name: '', value: '', body: DEFAULT_TEMPLATE };

export default function Contracts() {
  const { workspace } = useWorkspace();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Contract | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<ContractStatus | 'all'>('all');

  useEffect(() => {
    if (!workspace?.id) return;
    Promise.all([
      supabase.from('contracts').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id,name').eq('workspace_id', workspace.id).order('name'),
    ]).then(([contractsRes, clientsRes]) => {
      setContracts((contractsRes.data ?? []) as Contract[]);
      setClients(clientsRes.data ?? []);
    });
  }, [workspace?.id]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(c: Contract) {
    setEditTarget(c);
    setForm({ title: c.title, client_name: c.client_name, value: c.value != null ? String(c.value) : '', body: c.body });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title,
      client_name: form.client_name,
      value: form.value ? parseFloat(form.value) : null,
      body: form.body,
      workspace_id: workspace?.id,
      status: (editTarget?.status ?? 'draft') as ContractStatus,
    };
    if (editTarget) {
      const { data, error } = await supabase.from('contracts').update(payload).eq('id', editTarget.id).select().single();
      if (!error && data) setContracts(prev => prev.map(c => c.id === editTarget.id ? data as Contract : c));
    } else {
      const { data, error } = await supabase.from('contracts').insert(payload).select().single();
      if (!error && data) setContracts(prev => [data as Contract, ...prev]);
    }
    setSaving(false);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contract?')) return;
    await supabase.from('contracts').delete().eq('id', id);
    setContracts(prev => prev.filter(c => c.id !== id));
  }

  async function handleSend(id: string) {
    const { data, error } = await supabase
      .from('contracts')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) setContracts(prev => prev.map(c => c.id === id ? data as Contract : c));
  }

  async function handleDuplicate(c: Contract) {
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        title: `${c.title} (Copy)`,
        client_name: c.client_name,
        value: c.value,
        body: c.body,
        status: 'draft',
        workspace_id: workspace?.id,
      })
      .select()
      .single();
    if (!error && data) setContracts(prev => [data as Contract, ...prev]);
  }

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter);
  const statusCounts = (['draft', 'sent', 'signed', 'declined'] as ContractStatus[]).reduce<Record<string, number>>((acc, s) => {
    acc[s] = contracts.filter(c => c.status === s).length;
    return acc;
  }, {});

  const inputClass = 'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{contracts.length} total · {statusCounts.signed ?? 0} signed</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={14} />
          New Contract
        </Button>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-1">
        {(['all', 'draft', 'sent', 'signed', 'declined'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
              filter === s
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {s === 'all' ? `All (${contracts.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Contract list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(c => (
            <ContractCard
              key={c.id}
              contract={c}
              onEdit={openEdit}
              onDelete={handleDelete}
              onSend={handleSend}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 rounded-2xl border-2 border-dashed border-border">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
            <FileSignature size={22} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No contracts yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first contract to send to clients</p>
          </div>
          <Button size="sm" onClick={openCreate} className="gap-1.5 mt-1">
            <Plus size={12} /> New Contract
          </Button>
        </div>
      )}

      {/* ── Contract Editor (inline) ───────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-surface border border-border rounded-2xl shadow-float w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                {editTarget ? 'Edit Contract' : 'New Contract'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-muted-foreground">
                Cancel
              </Button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Title *</label>
                  <input className={inputClass} placeholder="Service Agreement — Acme Corp" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Client</label>
                  <select className={inputClass} value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}>
                    <option value="">No client</option>
                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Contract Value (CAD)</label>
                <input type="number" className={inputClass} placeholder="5000" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Contract Body</label>
                <textarea
                  className={inputClass + ' min-h-[320px] resize-none font-mono text-xs leading-relaxed'}
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving || !form.title.trim()} className="gap-2">
                  <FileSignature size={13} />
                  {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Contract'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
