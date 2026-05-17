'use client';
import { useState } from 'react';
import { Plus, Search, Package, Tag, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLang } from '@/i18n';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

type Tab = 'services' | 'packages';

const CATEGORY_COLORS: Record<string, string> = {
  SEO: 'text-sage bg-sage/10',
  'Paid Ads': 'text-warm bg-warm/10',
  Branding: 'text-silver bg-silver/10',
  'Web Design': 'text-fog bg-fog/10',
  'Social Media': 'text-sage bg-sage/15',
  Content: 'text-warm bg-warm/15',
  Video: 'text-fog bg-fog/15',
  Strategy: 'text-silver bg-silver/15',
  Development: 'text-sage bg-sage/10',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function ServiceForm({ workspaceId, categories, onClose, t }: { workspaceId: any; categories: string[]; onClose: () => void; t: any }) {
  const addService = useMutation(api.services.add);
  const f = t.app.serviceCatalog.form;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !basePrice) return;
    setSaving(true);
    await addService({ workspaceId, name, description, basePrice: Number(basePrice), category });
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
          <h2 className="text-sm font-semibold text-ivory">{t.app.serviceCatalog.addService}</h2>
          <button type="button" onClick={onClose}><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={f.namePlaceholder}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={f.descriptionPlaceholder} rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="0"
              className="px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-ivory outline-none"
              style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-fog hover:text-silver transition-colors">{f.cancel}</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving}>{f.save}</Button>
        </div>
      </form>
    </div>
  );
}

export default function ServiceCatalog() {
  const { t } = useLang();
  const sc = t.app.serviceCatalog;

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const services = useQuery(api.services.list as any, workspaceId ? { workspaceId } : 'skip') ?? [];
  const packages = useQuery(api.services.listPackages as any, workspaceId ? { workspaceId } : 'skip') ?? [];
  const removeService = useMutation(api.services.remove);

  const [tab, setTab] = useState<Tab>('services');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = services.filter((s: any) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {showForm && (
        <ServiceForm
          workspaceId={workspaceId}
          categories={sc.form.categories}
          onClose={() => setShowForm(false)}
          t={t}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{sc.title}</h1>
          <p className="text-sm text-fog mt-0.5">
            {sc.subtitle.replace('{{count}}', String(services.length)).replace('{{packages}}', String(packages.length))}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          {tab === 'services' ? sc.addService : sc.addPackage}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/5 mb-6">
        {([['services', sc.tabServices], ['packages', sc.tabPackages]] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === key ? 'border-sage text-sage' : 'border-transparent text-fog hover:text-silver'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'services' && (
        <>
          <div className="relative mb-6 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
            <Input className="pl-8" placeholder={sc.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <Tag size={36} className="text-fog/30" />
              <p className="text-sm text-fog max-w-sm">{sc.noServices}</p>
              {workspaceId && (
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                  <Plus size={12} />{sc.addService}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((service: any) => {
                const catClass = CATEGORY_COLORS[service.category] ?? 'text-fog bg-fog/10';
                return (
                  <div
                    key={service._id}
                    className="rounded-xl p-4 border border-border bg-card hover:border-white/15 transition-colors group relative"
                  >
                    <button
                      onClick={() => removeService({ id: service._id })}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-fog hover:text-ember transition-all h-6 w-6 flex items-center justify-center rounded"
                    >
                      <X size={11} />
                    </button>
                    <div className="flex items-start justify-between mb-2 pr-6">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', catClass)}>
                        {service.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-ivory mb-1">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-fog leading-relaxed line-clamp-2 mb-3">{service.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-sm font-semibold text-ivory tabular-nums">{fmt(service.basePrice)}</span>
                      <span className="text-[10px] text-fog">/ project</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'packages' && (
        <div>
          {packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <Package size={36} className="text-fog/30" />
              <p className="text-sm text-fog max-w-sm">{sc.noPackages}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packages.map((pkg: any) => (
                <div
                  key={pkg._id}
                  className="rounded-xl p-5 border border-border bg-card hover:border-white/15 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-ivory">{pkg.name}</p>
                      {pkg.description && <p className="text-xs text-fog mt-0.5">{pkg.description}</p>}
                    </div>
                    <p className="text-sm font-semibold text-ivory tabular-nums shrink-0">{fmt(pkg.totalPrice)}</p>
                  </div>
                  <p className="text-[10px] text-fog mb-3">
                    {pkg.services?.length ?? 0} services included
                  </p>
                  <button className="flex items-center gap-1 text-xs text-sage hover:text-ivory transition-colors">
                    <ChevronRight size={12} />
                    {sc.createProposal}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
