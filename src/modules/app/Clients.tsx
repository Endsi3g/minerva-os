'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Copy, Check, Users, FolderKanban, Receipt, CheckCircle2, Mail } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientCard } from '@/components/minerva/ClientCard';
import type { ClientStatus } from '@/lib/types';
import { useLang } from '@/i18n';
import { useWorkspaces, useClients, useProjects, useAddClient, useInvoices, useApprovals } from '@/lib/hooks/useSupabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Pipeline from './Pipeline';
import Proposals from './Proposals';

type ClientsView = 'pipeline' | 'accounts' | 'deals' | 'proposals' | 'billing';

const CLIENT_TABS: { key: ClientsView; label: string }[] = [
  { key: 'pipeline',  label: 'Pipeline' },
  { key: 'accounts',  label: 'Accounts' },
  { key: 'deals',     label: 'Deals' },
  { key: 'proposals', label: 'Proposals' },
  { key: 'billing',   label: 'Billing Snapshot' },
];

function ClientCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-10 w-10 rounded-full bg-secondary/60 shrink-0" />
        <Skeleton className="h-5 w-16 rounded-full shrink-0 bg-secondary/60" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4 bg-secondary/60" />
        <Skeleton className="h-3 w-1/2 bg-secondary/60" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-1/3 bg-secondary/60" />
        <Skeleton className="h-3 w-1/2 bg-secondary/60" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-4 w-20 bg-secondary/60" />
        <Skeleton className="h-4 w-16 bg-secondary/60" />
      </div>
    </div>
  );
}

interface NewClientForm {
  company: string;
  industry: string;
  contact: string;
  email: string;
  monthlyValue: string;
  status: ClientStatus;
}

const EMPTY_FORM: NewClientForm = {
  company: '', industry: '', contact: '', email: '', monthlyValue: '', status: 'onboarding',
};

function DealsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4 rounded-xl border border-border p-8" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
      <p className="text-sm font-medium text-ivory">Deals</p>
      <p className="text-xs max-w-xs" style={{ color: '#8A9099' }}>
        Deal tracking and opportunity management coming soon.
      </p>
    </div>
  );
}

function BillingSnapshot() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4 rounded-xl border border-border p-8" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
      <p className="text-sm font-medium text-ivory">Billing Snapshot</p>
      <p className="text-xs max-w-xs" style={{ color: '#8A9099' }}>
        Client billing overview and invoice status will appear here.
      </p>
    </div>
  );
}

export default function Clients() {
  const { t } = useLang();
  const cKeys = t.app.clients;
  const pKeys = cKeys.portal;

  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id;
  const { workspace } = useWorkspace();

  const clients = useClients(workspaceId);
  const projects = useProjects(workspaceId);
  const allInvoices = useInvoices(workspaceId);
  const allApprovals = useApprovals(workspaceId);
  const addClient = useAddClient();

  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const searchParams = useSearchParams();

  const initialTab = (): ClientsView => {
    const tab = searchParams?.get('tab') as ClientsView | null;
    return CLIENT_TABS.some(t => t.key === tab) ? (tab as ClientsView) : 'accounts';
  };

  const [viewTab, setViewTab] = useState<ClientsView>(initialTab);
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewClientForm>(EMPTY_FORM);

  useEffect(() => {
    const tab = searchParams?.get('tab') as ClientsView | null;
    if (tab && CLIENT_TABS.some(t => t.key === tab)) {
      setViewTab(tab);
    }
    if (searchParams?.get('create') === 'true' || searchParams?.get('new') === 'true') {
      setSheetOpen(true);
    }
  }, [searchParams]);

  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');
  const [portalGenerating, setPortalGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // New Client Portal States
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['approvals', 'files', 'invoices']);
  const [expiryOption, setExpiryOption] = useState<string>('30');
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  const [activeToken, setActiveToken] = useState<any>(null);
  const [portalTokens, setPortalTokens] = useState<any[]>([]);

  const isLoading = clients === null || projects === null;
  const filtered = clients ? clients.filter((c: any) =>
    c.company.toLowerCase().includes(query.toLowerCase())
  ) : [];

  async function refreshTokens() {
    if (!workspaceId) return;
    const { data } = await supabase
      .from('portal_tokens')
      .select('*')
      .eq('workspace_id', workspaceId);
    if (data) {
      setPortalTokens(data);
    }
  }

  useEffect(() => {
    refreshTokens();
  }, [workspaceId]);

  async function handleAdd() {
    if (!form.company.trim() || !workspaceId) return;

    await addClient({
      workspaceId,
      company: form.company.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      status: form.status,
      monthlyValue: parseFloat(form.monthlyValue) || undefined,
    });

    setSheetOpen(false);
    setForm(EMPTY_FORM);
  }

  async function handleGeneratePortalLink(clientId: string) {
    if (!workspaceId) return;
    setPortalGenerating(true);
    setPortalUrl('');
    setPortalDialogOpen(true);
    setCopied(false);
    setSelectedClientId(clientId);
    setActiveToken(null);

    // Fetch existing token if any
    const { data: existingToken, error } = await supabase
      .from('portal_tokens')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    setPortalGenerating(false);

    if (!error && existingToken) {
      setActiveToken(existingToken);
      const base = workspace?.customDomain ? `https://${workspace.customDomain}` : window.location.origin;
      setPortalUrl(`${base}/portal/${existingToken.token}`);
      setSelectedScopes(existingToken.scopes || []);
      
      const expiryDate = new Date(existingToken.expires_at);
      const days = Math.round((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days === 7) setExpiryOption('7');
      else if (days === 30) setExpiryOption('30');
      else if (days === 90) setExpiryOption('90');
      else {
        setExpiryOption('custom');
        setCustomExpiryDate(existingToken.expires_at.split('T')[0]);
      }
    } else {
      setSelectedScopes(['approvals', 'files', 'invoices']);
      setExpiryOption('30');
      setCustomExpiryDate('');
    }
  }

  async function handleGenerateLink() {
    if (!selectedClientId || !workspaceId) return;
    setPortalGenerating(true);

    const token = crypto.randomUUID();
    let expiresAt: string;
    if (expiryOption === 'custom') {
      if (!customExpiryDate) {
        toast.error('Please select a custom expiry date.');
        setPortalGenerating(false);
        return;
      }
      expiresAt = new Date(customExpiryDate).toISOString();
    } else {
      const days = parseInt(expiryOption) || 30;
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    // Delete existing token if any (clean up)
    await supabase
      .from('portal_tokens')
      .delete()
      .eq('client_id', selectedClientId);

    const { data: newToken, error } = await supabase
      .from('portal_tokens')
      .insert({
        token,
        client_id: selectedClientId,
        workspace_id: workspaceId,
        expires_at: expiresAt,
        scopes: selectedScopes,
      })
      .select()
      .single();

    setPortalGenerating(false);

    if (error) {
      toast.error('Failed to generate link.');
      return;
    }

    setActiveToken(newToken);
    const portalBase = workspace?.customDomain ? `https://${workspace.customDomain}` : window.location.origin;
    setPortalUrl(`${portalBase}/portal/${token}`);
    toast.success('Portal link created successfully.');
    refreshTokens();
  }

  async function handleRevokeLink() {
    if (!selectedClientId) return;
    setPortalGenerating(true);

    const { error } = await supabase
      .from('portal_tokens')
      .delete()
      .eq('client_id', selectedClientId);

    setPortalGenerating(false);

    if (error) {
      toast.error('Failed to revoke access.');
      return;
    }

    setActiveToken(null);
    setPortalUrl('');
    toast.success('Portal access revoked.');
    refreshTokens();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleScopeToggle(scope: string) {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <TextAnimate text={cKeys.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
          <p className="text-sm text-fog mt-0.5">
            {cKeys.stats.replace('{{count}}', String(clients ? clients.length : 0))}
          </p>
        </div>
        {viewTab === 'accounts' && (
          <Button size="sm" id="btn-new-client" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }}>
            <Plus size={14} />
            {cKeys.addClient}
          </Button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
        {CLIENT_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setViewTab(key)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              viewTab === key ? 'border-sage text-sage' : 'border-transparent text-fog hover:text-silver'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {viewTab === 'pipeline'  && <Pipeline />}
      {viewTab === 'deals'     && <DealsPlaceholder />}
      {viewTab === 'proposals' && <Proposals />}
      {viewTab === 'billing'   && <BillingSnapshot />}

      {viewTab === 'accounts' && <>
      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
        <Input
          className="pl-8"
          placeholder={cKeys.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <ClientCardSkeleton key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client: any) => {
            const activeProjectsCount = projects ? projects.filter((p: any) =>
              (p.clientId === client._id || p.clientName === client.company) && p.status === 'active'
            ).length : 0;
            return (
              <ClientCard
                key={client._id}
                client={{
                  ...client,
                  id: client._id,
                  activeProjects: activeProjectsCount,
                  industry: client.industry || 'Services',
                  monthlyValue: client.monthlyValue || 0,
                }}
                onPortalLink={handleGeneratePortalLink}
                activePortalToken={portalTokens.find(t => t.client_id === client._id)}
                onClick={() => { setSelectedClient({ ...client, id: client._id, activeProjects: activeProjectsCount }); }}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-midnight/30 rounded-xl border border-border p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 border border-border text-fog">
            <Users size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-ivory">
              {query ? `${cKeys.noClients} "${query}"` : cKeys.noClientsYet}
            </p>
            {!query && (
              <p className="text-xs text-fog max-w-xs">Add your first client account to begin tracking projects and billing retainers.</p>
            )}
          </div>
          {query ? (
            <button onClick={() => setQuery('')} className="text-xs text-fog hover:text-silver transition-colors">
              {cKeys.clearSearch}
            </button>
          ) : (
            <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }} className="rounded-full">
              <Plus size={14} className="mr-1.5" />
              {cKeys.addClient}
            </Button>
          )}
        </div>
      )}
      </>}

      {/* Add client sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-96 p-6 flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>{cKeys.newClient}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label>{cKeys.form.company}</Label>
              <Input placeholder={cKeys.form.companyPlaceholder} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{cKeys.form.industry}</Label>
              <Input placeholder={cKeys.form.industryPlaceholder} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{cKeys.form.contact}</Label>
              <Input placeholder={cKeys.form.contactPlaceholder} value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{cKeys.form.email}</Label>
              <Input type="email" placeholder={cKeys.form.emailPlaceholder} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{cKeys.form.monthlyValue}</Label>
              <Input type="number" placeholder={cKeys.form.monthlyValuePlaceholder} value={form.monthlyValue} onChange={e => setForm(f => ({ ...f, monthlyValue: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{cKeys.form.status}</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ClientStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onboarding">{cKeys.form.onboarding}</SelectItem>
                  <SelectItem value="active">{cKeys.form.active}</SelectItem>
                  <SelectItem value="inactive">{cKeys.form.inactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={handleAdd}>{cKeys.form.add}</Button>
        </SheetContent>
      </Sheet>

      {/* Client detail sheet */}
      <Sheet open={selectedClient !== null} onOpenChange={open => { if (!open) setSelectedClient(null); }}>
        <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col bg-card border-border overflow-hidden">
          {selectedClient && (() => {
            const clientProjects = projects ? (projects as any[]).filter((p: any) =>
              p.clientId === selectedClient._id || p.clientName === selectedClient.company
            ) : [];
            const activeClientProjects = clientProjects.filter((p: any) => p.status === 'active');
            const clientInvoices = allInvoices ? (Array.isArray(allInvoices) ? allInvoices : []).filter((i: any) => i.clientId === selectedClient._id) : [];
            const openInvoices = clientInvoices.filter((i: any) => i.status !== 'paid');
            const openTotal = openInvoices.reduce((sum: number, i: any) => sum + (i.amount ?? 0), 0);
            const clientApprovals = allApprovals ? (allApprovals as any[]).filter((a: any) => {
              const proj = (projects as any[] | null)?.find((p: any) => p._id === a.projectId || p.id === a.projectId);
              return proj && (proj.clientId === selectedClient._id || proj.clientName === selectedClient.company);
            }) : [];
            const pendingApprovals = clientApprovals.filter((a: any) => a.status === 'pending');

            return (
              <>
                <SheetHeader className="p-6 border-b border-border shrink-0">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ backgroundColor: 'rgba(127,163,138,0.15)', color: '#7FA38A' }}>
                      {selectedClient.company.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <SheetTitle className="text-base font-semibold text-ivory truncate">{selectedClient.company}</SheetTitle>
                      <p className="text-xs text-fog mt-0.5 flex items-center gap-1"><Mail size={10} />{selectedClient.email}</p>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* KPI strip */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border p-3 text-center" style={{ backgroundColor: 'rgba(23,28,42,0.5)' }}>
                      <p className="text-lg font-semibold text-ivory">{activeClientProjects.length}</p>
                      <p className="text-[10px] text-fog mt-0.5 flex items-center justify-center gap-1"><FolderKanban size={9} /> Active</p>
                    </div>
                    <div className="rounded-xl border border-border p-3 text-center" style={{ backgroundColor: 'rgba(23,28,42,0.5)' }}>
                      <p className="text-lg font-semibold text-ivory">{openInvoices.length}</p>
                      <p className="text-[10px] text-fog mt-0.5 flex items-center justify-center gap-1"><Receipt size={9} /> Open inv.</p>
                    </div>
                    <div className="rounded-xl border border-border p-3 text-center" style={{ backgroundColor: 'rgba(23,28,42,0.5)' }}>
                      <p className="text-lg font-semibold text-ivory">{pendingApprovals.length}</p>
                      <p className="text-[10px] text-fog mt-0.5 flex items-center justify-center gap-1"><CheckCircle2 size={9} /> Pending</p>
                    </div>
                  </div>

                  {/* Active projects */}
                  <div>
                    <p className="text-[10px] font-semibold text-fog uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FolderKanban size={10} /> Projects
                    </p>
                    {clientProjects.length === 0 ? (
                      <p className="text-xs text-fog italic">No projects yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {clientProjects.slice(0, 4).map((proj: any) => (
                          <div key={proj._id ?? proj.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border" style={{ backgroundColor: 'rgba(23,28,42,0.3)' }}>
                            <p className="text-xs text-ivory truncate">{proj.name}</p>
                            <span className={cn(
                              'text-[9px] font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0',
                              proj.status === 'active' ? 'text-sage bg-sage/10' :
                              proj.status === 'on_hold' ? 'text-warm bg-warm/10' :
                              'text-fog bg-fog/10'
                            )}>
                              {proj.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Open invoices */}
                  {openInvoices.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-fog uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Receipt size={10} /> Outstanding
                      </p>
                      <div className="px-3 py-2 rounded-lg border border-border flex items-center justify-between" style={{ backgroundColor: 'rgba(168,106,106,0.08)' }}>
                        <p className="text-xs text-silver">{openInvoices.length} open invoice{openInvoices.length !== 1 ? 's' : ''}</p>
                        <p className="text-sm font-semibold text-ember">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(openTotal)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pending approvals */}
                  {pendingApprovals.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-fog uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <CheckCircle2 size={10} /> Pending Approvals
                      </p>
                      <div className="space-y-2">
                        {pendingApprovals.slice(0, 3).map((a: any) => (
                          <div key={a._id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border" style={{ backgroundColor: 'rgba(23,28,42,0.3)' }}>
                            <p className="text-xs text-ivory truncate">{a.name}</p>
                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0 text-warm bg-warm/10">pending</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-border shrink-0">
                  <Button
                    variant="outline"
                    className="w-full border-border text-fog hover:text-ivory"
                    onClick={() => { handleGeneratePortalLink(selectedClient._id); setSelectedClient(null); }}
                  >
                    Open Portal
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Portal link dialog */}
      <Dialog open={portalDialogOpen} onOpenChange={setPortalDialogOpen}>
        <DialogContent className="sm:max-w-md bg-midnight border-border">
          <DialogHeader>
            <DialogTitle className="text-ivory">{pKeys.dialogTitle}</DialogTitle>
            <DialogDescription className="text-fog">{pKeys.dialogDesc}</DialogDescription>
          </DialogHeader>

          {portalGenerating ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-fog animate-pulse">{pKeys.generating}</p>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Active Link Input */}
              {portalUrl && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-ivory flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    {pKeys.activeLink}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={portalUrl}
                      className="text-xs text-silver bg-dusk border-border flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-border text-fog hover:text-ivory gap-1.5"
                      onClick={handleCopy}
                    >
                      {copied ? <Check size={14} className="text-sage" /> : <Copy size={14} />}
                      {copied ? pKeys.copied : pKeys.copyLink}
                    </Button>
                  </div>
                  {activeToken && (
                    <p className="text-[10px] text-fog">
                      Expires: {new Date(activeToken.expires_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Scopes Section */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-ivory">{pKeys.scopes}</Label>
                <div className="space-y-2.5 rounded-xl border border-border bg-dusk/50 p-4">
                  {[
                    { id: 'approvals', label: pKeys.scopeApprovals },
                    { id: 'files', label: pKeys.scopeFiles },
                    { id: 'invoices', label: pKeys.scopeInvoices },
                    { id: 'tickets', label: pKeys.scopeTickets },
                    { id: 'nps', label: pKeys.scopeNps },
                  ].map(s => (
                    <label key={s.id} className="flex items-center gap-2.5 cursor-pointer text-xs text-silver hover:text-ivory transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(s.id)}
                        onChange={() => handleScopeToggle(s.id)}
                        className="rounded border-border bg-midnight text-sage focus:ring-0 focus:ring-offset-0 accent-emerald-600 h-3.5 w-3.5"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Expiry Section */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-ivory">{pKeys.expiry}</Label>
                <div className="flex gap-2">
                  <Select value={expiryOption} onValueChange={setExpiryOption}>
                    <SelectTrigger className="flex-1 text-xs bg-dusk border-border text-silver">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-midnight border-border">
                      <SelectItem value="7">{pKeys.days7}</SelectItem>
                      <SelectItem value="30">{pKeys.days30}</SelectItem>
                      <SelectItem value="90">{pKeys.days90}</SelectItem>
                      <SelectItem value="custom">{pKeys.custom}</SelectItem>
                    </SelectContent>
                  </Select>

                  {expiryOption === 'custom' && (
                    <Input
                      type="date"
                      value={customExpiryDate}
                      onChange={e => setCustomExpiryDate(e.target.value)}
                      className="text-xs text-silver bg-dusk border-border max-w-[150px]"
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {activeToken && (
                  <Button
                    variant="ghost"
                    onClick={handleRevokeLink}
                    className="flex-1 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500 border border-red-500/20"
                  >
                    {pKeys.revoke}
                  </Button>
                )}
                <Button
                  onClick={handleGenerateLink}
                  className="flex-1 text-xs bg-ivory text-midnight hover:bg-white rounded-full font-medium"
                >
                  {pKeys.generate}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
