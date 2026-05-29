'use client';
import { useState, useEffect } from 'react';
import { Plus, LifeBuoy, Clock, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  open:        { label: 'Open',        class: 'text-warm bg-warm/10 border-warm/20',   icon: AlertCircle },
  in_progress: { label: 'In progress', class: 'text-sage bg-sage/10 border-sage/20',   icon: Clock },
  resolved:    { label: 'Resolved',    class: 'text-fog bg-fog/10 border-fog/20',      icon: LifeBuoy },
  closed:      { label: 'Closed',      class: 'text-fog/50 bg-fog/5 border-fog/10',   icon: LifeBuoy },
};

const PRIORITY_CONFIG: Record<string, string> = {
  low:    'text-fog',
  medium: 'text-warm',
  high:   'text-ember',
  urgent: 'text-ember font-bold',
};

const CATEGORIES = ['Bug', 'Feature', 'Question', 'Billing', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

type Ticket = Record<string, unknown>;
type Client = Record<string, unknown>;

function TicketForm({ workspaceId, clients, onClose, onCreated }: { workspaceId: string | null; clients: Client[]; onClose: () => void; onCreated: (t: any) => void }) {
  const { t } = useLang();
  const f = t.app.tickets.form;
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('Question');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !clientId) return;
    setSaving(true);
    const { data } = await supabase.from('tickets').insert({
      workspace_id: workspaceId,
      client_id: clientId || null,
      subject,
      description,
      priority,
      category,
      status: 'open',
    }).select().single();
    if (data) onCreated(data);
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
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder={f.subjectPlaceholder}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={f.descriptionPlaceholder} rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <select value={clientId} onChange={e => setClientId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory outline-none"
            style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="">{f.clientPlaceholder}</option>
             {clients.map((c) => <option key={c._id as string} value={c._id as string}>{c.company as string}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-ivory outline-none"
              style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-ivory outline-none"
              style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-fog hover:text-silver">{f.cancel}</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving}>{f.save}</Button>
        </div>
      </form>
    </div>
  );
}

export default function Tickets() {
  const { t } = useLang();
  const tk = t.app.tickets;
  const [tickets, setTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const wsRes = await supabase.from('workspaces').select('id').limit(1);
      const wid = wsRes.data?.[0]?.id;
      if (!wid) return;
      setWorkspaceId(wid);
      const [tickRes, clientRes] = await Promise.all([
        supabase.from('tickets').select('*').eq('workspace_id', wid).order('created_at', { ascending: false }),
        supabase.from('clients').select('id,company').eq('workspace_id', wid),
      ]);
      setTickets((tickRes.data ?? []).map((t: any) => ({ ...t, _id: t.id, clientId: t.client_id })));
      setClients((clientRes.data ?? []).map((c: any) => ({ ...c, _id: c.id })));
    }
    load();
  }, []);

  async function updateTicketStatus(id: string, status: string) {
    await supabase.from('tickets').update({ status }).eq('id', id);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status, _id: id } : t));
  }

  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');

  const typedTickets = tickets as Ticket[];
  const typedClients = clients as Client[];

  const filtered = typedTickets.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchQuery = !query || (t.subject as string).toLowerCase().includes(query.toLowerCase());
    return matchStatus && matchQuery;
  });

  const openCount = typedTickets.filter(t => t.status === 'open').length;

  return (
    <>
      {showForm && (
        <TicketForm workspaceId={workspaceId} clients={typedClients} onClose={() => setShowForm(false)} onCreated={(nt) => setTickets(prev => [{ ...nt, _id: nt.id, clientId: nt.client_id }, ...prev])} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{tk.title}</h1>
          <p className="text-sm text-fog mt-0.5">{tk.ticketCount.replace('{{count}}', String(typedTickets.length)).replace('{{open}}', String(openCount))}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          {tk.addTicket}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Input placeholder={tk.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs transition-colors capitalize',
                statusFilter === s ? 'bg-sage/20 text-sage' : 'text-fog hover:text-ivory hover:bg-white/5'
              )}
            >
              {s === 'all' ? tk.statusAll : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <LifeBuoy size={36} className="text-fog/30" />
          <p className="text-sm text-fog">{query ? tk.noMatch.replace('{{query}}', query) : tk.noTickets}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => {
            const sc = STATUS_CONFIG[ticket.status as string] ?? STATUS_CONFIG.open;
            const client = typedClients.find(c => c._id === ticket.clientId);
            const StatusIcon = sc.icon;
            return (
              <div
                key={ticket._id as string}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors hover:border-white/15"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <StatusIcon size={14} className={sc.class.split(' ')[0]} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ivory truncate">{ticket.subject as string}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {client && <span className="text-[11px] text-fog">{client.company as string}</span>}
                    <span className="text-[11px] text-fog/40">·</span>
                    <span className="text-[11px] text-fog">{ticket.category as string}</span>
                    <span className="text-[11px] text-fog/40">·</span>
                    <span className={cn('text-[11px] capitalize', PRIORITY_CONFIG[ticket.priority as string])}>
                      {ticket.priority as string}
                    </span>
                  </div>
                </div>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0', sc.class)}>
                  {sc.label}
                </span>
                {ticket.status === 'open' && (
                  <button
                    onClick={() => updateTicketStatus(ticket._id as string, 'in_progress')}
                    className="text-xs text-fog hover:text-sage transition-colors shrink-0"
                  >
                    {tk.start}
                  </button>
                )}
                {ticket.status === 'in_progress' && (
                  <button
                    onClick={() => updateTicketStatus(ticket._id as string, 'resolved')}
                    className="text-xs text-fog hover:text-sage transition-colors shrink-0"
                  >
                    {tk.resolve}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
