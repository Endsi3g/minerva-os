'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface ClientFormProps {
  clientId?: string;
}

interface ClientData {
  name: string;
  company: string;
  email: string;
  phone: string;
  description: string;
  internal_notes: string;
  tier: string;
  status: string;
  tags: string[];
}

const EMPTY: ClientData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  description: '',
  internal_notes: '',
  tier: 'starter',
  status: 'active',
  tags: [],
};

export default function ClientForm({ clientId }: ClientFormProps) {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const isEditing = !!clientId;

  const [form, setForm] = useState<ClientData>(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    async function load() {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      if (error || !data) { setError('Client not found'); setLoading(false); return; }
      setForm({
        name: data.name ?? '',
        company: data.company ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        description: data.description ?? '',
        internal_notes: data.internal_notes ?? '',
        tier: data.tier ?? 'starter',
        status: data.status ?? 'active',
        tags: data.tags ?? [],
      });
      setLoading(false);
    }
    load();
  }, [clientId]);

  function set(field: keyof ClientData, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) { setTagInput(''); return; }
    setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput('');
  }

  function removeTag(tag: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Client name is required'); return; }
    setSaving(true);
    setError(null);

    const payload = { ...form, workspace_id: workspace?.id };

    const { error: saveError } = isEditing
      ? await supabase.from('clients').update(payload).eq('id', clientId)
      : await supabase.from('clients').insert(payload);

    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    router.push('/app/clients');
  }

  async function handleDelete() {
    if (!clientId) return;
    if (!confirm('Delete this client permanently?')) return;
    await supabase.from('clients').delete().eq('id', clientId);
    router.push('/app/clients');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading client data...
      </div>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Client' : 'New Client'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditing ? 'Update client profile and details' : 'Add a new client to your workspace'}
          </p>
        </div>
        {isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
          >
            <Trash2 size={13} />
            Delete
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Company & Contact */}
      <section className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Company & Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client / Contact Name <span className="text-destructive">*</span></label>
            <input
              className={inputClass}
              placeholder="Jane Dupont"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Company Name</label>
            <input
              className={inputClass}
              placeholder="Acme Corp"
              value={form.company}
              onChange={e => set('company', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              placeholder="jane@acme.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              className={inputClass}
              placeholder="+1 514 000 0000"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Status & Tier */}
      <section className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Classification</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={e => set('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="prospect">Prospect</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Tier</label>
            <select
              className={inputClass}
              value={form.tier}
              onChange={e => set('tier', e.target.value)}
            >
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="scale">Scale</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className={labelClass}>Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-soft text-primary border border-primary-soft-border"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-primary/60 transition-colors">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={inputClass + ' flex-1'}
              placeholder="Add a tag and press Enter"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            />
            <Button variant="outline" size="sm" onClick={addTag} className="gap-1">
              <Plus size={12} /> Add
            </Button>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Description</h2>
        <div>
          <label className={labelClass}>Public Description</label>
          <textarea
            className={inputClass + ' min-h-[100px] resize-none'}
            placeholder="Brief description of this client's business and goals..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Internal Notes</label>
          <textarea
            className={inputClass + ' min-h-[120px] resize-none'}
            placeholder="Private notes for your team — context, history, preferences..."
            value={form.internal_notes}
            onChange={e => set('internal_notes', e.target.value)}
          />
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save size={14} />
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Client'}
        </Button>
      </div>
    </div>
  );
}
