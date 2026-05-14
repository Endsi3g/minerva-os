import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
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
import { ClientCard } from '@/components/minerva/ClientCard';
import type { ClientStatus } from '@/lib/types';
import { useLang } from '@/i18n';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

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

export default function Clients() {
  const { t } = useLang();
  const cKeys = t.app.clients;

  const clients = useQuery(api.clients.list) ?? [];
  const addClient = useMutation(api.clients.add);

  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewClientForm>(EMPTY_FORM);

  const filtered = clients.filter(c =>
    c.company.toLowerCase().includes(query.toLowerCase())
  );

  async function handleAdd() {
    if (!form.company.trim()) return;
    
    await addClient({
      company: form.company.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      status: form.status,
    });
    
    setSheetOpen(false);
    setForm(EMPTY_FORM);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{cKeys.title}</h1>
          <p className="text-sm text-fog mt-0.5">
            {cKeys.stats.replace('{{count}}', String(clients.length))}
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }}>
          <Plus size={14} />
          {cKeys.addClient}
        </Button>
      </div>

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
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <ClientCard key={client._id} client={{
              ...client,
              id: client._id,
              activeProjects: 0,
              industry: 'Services',
              monthlyValue: 0
            }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <p className="text-sm text-silver">{cKeys.noClients} {query ? `"${query}"` : ''}</p>
          {query && (
            <button onClick={() => setQuery('')} className="text-xs text-fog hover:text-silver transition-colors">
              {cKeys.clearSearch}
            </button>
          )}
        </div>
      )}

      {/* Add client sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
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
    </>
  );
}
