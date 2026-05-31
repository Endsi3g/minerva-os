'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  open:        { label: 'Open',        class: 'text-warm bg-warm/10 border-warm/20' },
  in_progress: { label: 'In progress', class: 'text-sage bg-sage/10 border-sage/20' },
  resolved:    { label: 'Resolved',    class: 'text-fog bg-fog/10 border-fog/20' },
  closed:      { label: 'Closed',      class: 'text-fog/50 bg-fog/5 border-fog/10' },
};

const PRIORITY_CONFIG: Record<string, string> = {
  low:    'text-fog',
  medium: 'text-warm',
  high:   'text-ember',
  urgent: 'text-ember font-bold',
};

export default function TicketDetail({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (!data) {
        toast.error('Ticket not found');
        router.push('/app/tickets');
        return;
      }
      setTicket({ ...data, _id: data.id });

      if (data.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id,company,contact,email')
          .eq('id', data.client_id)
          .single();
        if (clientData) setClient(clientData);
      }
      setLoading(false);
    }
    load();
  }, [ticketId, router]);

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', ticketId);
    setUpdating(false);
    if (error) { toast.error('Failed to update status'); return; }
    setTicket((prev: any) => ({ ...prev, status: newStatus }));
    toast.success(`Ticket marked as ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`);
  }

  async function handleSendReply() {
    if (!reply.trim()) return;
    setSending(true);
    const notes = [...(ticket.notes || []), {
      text: reply.trim(),
      author: 'Agent',
      created_at: new Date().toISOString(),
    }];
    const { error } = await supabase.from('tickets').update({ notes }).eq('id', ticketId);
    setSending(false);
    if (error) { toast.error('Failed to send reply'); return; }
    setTicket((prev: any) => ({ ...prev, notes }));
    setReply('');
    toast.success('Reply added');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-fog" />
      </div>
    );
  }

  if (!ticket) return null;

  const sc = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
  const notes: any[] = ticket.notes || [];

  const TRANSITIONS: Record<string, { label: string; next: string }[]> = {
    open:        [{ label: 'Start', next: 'in_progress' }],
    in_progress: [{ label: 'Resolve', next: 'resolved' }],
    resolved:    [{ label: 'Close', next: 'closed' }, { label: 'Reopen', next: 'open' }],
    closed:      [{ label: 'Reopen', next: 'open' }],
  };

  const transitions = TRANSITIONS[ticket.status] ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push('/app/tickets')}
          className="flex items-center gap-2 text-sm text-fog hover:text-ivory transition-colors mb-4"
        >
          <ArrowLeft size={14} /> All tickets
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-ivory">{ticket.subject}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant="outline" className={cn('text-[10px] font-medium rounded-full', sc.class)}>
                {sc.label}
              </Badge>
              <span className={cn('text-xs capitalize', PRIORITY_CONFIG[ticket.priority] ?? 'text-fog')}>
                {ticket.priority} priority
              </span>
              <span className="text-xs text-fog">{ticket.category}</span>
              {client && (
                <button
                  onClick={() => router.push(`/app/clients/${client.id}`)}
                  className="text-xs text-fog hover:text-ivory transition-colors"
                >
                  {client.company}
                </button>
              )}
            </div>
          </div>

          {/* Status actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {transitions.map(tr => (
              <Button
                key={tr.next}
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={updating}
                onClick={() => handleStatusChange(tr.next)}
              >
                {updating ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                {tr.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <div
          className="rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-xs font-semibold text-fog uppercase tracking-wider mb-2">Description</h2>
          <p className="text-sm text-silver leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[11px] text-fog mb-1">Created</p>
          <p className="text-sm text-silver">{new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        {client && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] text-fog mb-1">Client</p>
            <p className="text-sm text-silver">{client.company}</p>
            {client.email && <p className="text-[11px] text-fog">{client.email}</p>}
          </div>
        )}
      </div>

      {/* Notes / thread */}
      <div>
        <h2 className="text-sm font-semibold text-ivory mb-3">Activity</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-fog py-2">No replies yet.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note: any, i: number) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-ivory">{note.author || 'Unknown'}</span>
                  <span className="text-[10px] text-fog">{new Date(note.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-silver whitespace-pre-wrap">{note.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Reply box */}
        {ticket.status !== 'closed' && (
          <div className="mt-4 space-y-2">
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm text-ivory placeholder:text-fog resize-none outline-none focus:ring-1 focus:ring-white/10"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSendReply} disabled={sending || !reply.trim()} className="gap-1.5">
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {sending ? 'Sending...' : 'Send reply'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
