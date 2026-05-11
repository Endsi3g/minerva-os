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
import { MOCK_CLIENTS } from '@/lib/mock-data';
import type { Client, ClientStatus } from '@/lib/types';

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
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<NewClientForm>(EMPTY_FORM);

  const filtered = clients.filter(c =>
    c.company.toLowerCase().includes(query.toLowerCase())
  );

  function handleAdd() {
    if (!form.company.trim()) return;
    const client: Client = {
      id: `c${Date.now()}`,
      company: form.company.trim(),
      industry: form.industry.trim() || 'Other',
      contact: form.contact.trim(),
      email: form.email.trim(),
      monthlyValue: parseFloat(form.monthlyValue) || 0,
      activeProjects: 0,
      status: form.status,
    };
    setClients(prev => [client, ...prev]);
    setSheetOpen(false);
    setForm(EMPTY_FORM);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">Clients</h1>
          <p className="text-sm text-fog mt-0.5">{clients.length} accounts</p>
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setSheetOpen(true); }}>
          <Plus size={14} />
          Add client
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
        <Input
          className="pl-8"
          placeholder="Search clients..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <p className="text-sm text-silver">No clients match "{query}"</p>
          <button onClick={() => setQuery('')} className="text-xs text-fog hover:text-silver transition-colors">
            Clear search
          </button>
        </div>
      )}

      {/* Add client sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>New Client</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label>Company name</Label>
              <Input placeholder="Acme Corp" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input placeholder="Technology, Design..." value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Primary contact</Label>
              <Input placeholder="Jane Smith" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="jane@acme.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly retainer (USD)</Label>
              <Input type="number" placeholder="5000" value={form.monthlyValue} onChange={e => setForm(f => ({ ...f, monthlyValue: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ClientStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={handleAdd}>Add Client</Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
