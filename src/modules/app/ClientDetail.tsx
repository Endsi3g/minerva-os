'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, FolderKanban, Receipt, Link, ExternalLink, Copy, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active:     { label: 'Active',     class: 'text-sage bg-sage/10' },
  onboarding: { label: 'Onboarding', class: 'text-warm bg-warm/10' },
  lead:       { label: 'Lead',       class: 'text-silver bg-silver/10' },
  inactive:   { label: 'Inactive',   class: 'text-fog bg-fog/10' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
}

export default function ClientDetail({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generatingPortal, setGeneratingPortal] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (!clientData) {
        toast.error('Client not found');
        router.push('/app/clients');
        return;
      }
      setClient(clientData);

      const [{ data: projData }, { data: invData }] = await Promise.all([
        supabase.from('projects').select('*').eq('workspace_id', clientData.workspace_id).or(`client_id.eq.${clientId},client_name.eq.${clientData.company}`),
        supabase.from('invoices').select('*').eq('workspace_id', clientData.workspace_id).eq('client_id', clientId).order('created_at', { ascending: false }),
      ]);

      setProjects((projData ?? []).map((p: any) => ({ ...p, _id: p.id })));
      setInvoices((invData ?? []).map((i: any) => ({ ...i, _id: i.id })));
      setLoading(false);
    }
    load();
  }, [clientId, router]);

  async function handleGeneratePortalLink() {
    if (!client) return;
    setGeneratingPortal(true);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('portal_tokens').insert({
      token,
      client_id: clientId,
      workspace_id: client.workspace_id,
      expires_at: expiresAt,
      scopes: ['approvals', 'files', 'invoices'],
    });
    setGeneratingPortal(false);
    if (error) { toast.error('Failed to generate portal link'); return; }
    const url = `${window.location.origin}/portal/${token}`;
    setPortalUrl(url);
    await navigator.clipboard.writeText(url);
    toast.success('Portal link copied to clipboard');
  }

  async function copyPortalUrl() {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-fog" />
      </div>
    );
  }

  if (!client) return null;

  const status = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;
  const totalRevenue = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push('/app/clients')}
          className="flex items-center gap-2 text-sm text-fog hover:text-ivory transition-colors mb-4"
        >
          <ArrowLeft size={14} /> All clients
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg font-semibold">{initials(client.company)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold text-ivory">{client.company}</h1>
              <p className="text-sm text-fog mt-0.5">{client.industry || 'Services'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-[11px] font-semibold border-none rounded-full', status.class)}>
              {status.label}
            </Badge>
            {portalUrl ? (
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={copyPortalUrl}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy portal link'}
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleGeneratePortalLink} disabled={generatingPortal}>
                {generatingPortal ? <Loader2 size={12} className="animate-spin" /> : <Link size={12} />}
                Generate portal link
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Monthly value', value: client.monthly_value > 0 ? `${fmt(client.monthly_value)}/mo` : 'No retainer' },
          { label: 'Active projects', value: String(projects.filter((p: any) => p.status === 'active').length) },
          { label: 'Total revenue', value: totalRevenue > 0 ? fmt(totalRevenue) : '$0' },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl p-4 space-y-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[11px] text-fog">{stat.label}</p>
            <p className="text-xl font-semibold text-ivory">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Contact info */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <h2 className="text-sm font-semibold text-ivory mb-3">Contact</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-silver">
            <span className="text-fog text-xs">Name</span>
            {client.contact || '—'}
          </div>
          <div className="flex items-center gap-2 text-sm text-silver">
            <Mail size={13} className="text-fog" />
            {client.email ? (
              <a href={`mailto:${client.email}`} className="hover:text-ivory transition-colors">{client.email}</a>
            ) : '—'}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-sm font-semibold text-ivory mb-3 flex items-center gap-2">
          <FolderKanban size={14} className="text-fog" /> Projects ({projects.length})
        </h2>
        {projects.length === 0 ? (
          <p className="text-sm text-fog py-4">No projects yet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((p: any) => (
              <button
                key={p._id}
                onClick={() => router.push(`/app/projects/${p._id}`)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-colors hover:border-white/15"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ivory">{p.name}</p>
                  <p className="text-[11px] text-fog mt-0.5">Due {p.due_date ? new Date(p.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                </div>
                <Badge variant="outline" className={cn('text-[10px] border-none rounded-full shrink-0', p.status === 'active' ? 'text-sage bg-sage/10' : p.status === 'completed' ? 'text-fog bg-fog/10' : 'text-warm bg-warm/10')}>
                  {p.status}
                </Badge>
                <ExternalLink size={12} className="text-fog/40 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div>
        <h2 className="text-sm font-semibold text-ivory mb-3 flex items-center gap-2">
          <Receipt size={14} className="text-fog" /> Invoices ({invoices.length})
        </h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-fog py-4">No invoices yet.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv: any) => (
              <div
                key={inv._id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ivory">{inv.invoice_number || inv.description || `Invoice`}</p>
                  <p className="text-[11px] text-fog mt-0.5">{inv.due_date ? `Due ${new Date(inv.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</p>
                </div>
                <p className="text-sm font-medium text-ivory">{fmt(inv.amount || 0)}</p>
                <Badge variant="outline" className={cn('text-[10px] border-none rounded-full shrink-0', inv.status === 'paid' ? 'text-sage bg-sage/10' : inv.status === 'overdue' ? 'text-ember bg-ember/10' : 'text-warm bg-warm/10')}>
                  {inv.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
