'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface ProjectFormProps {
  projectId?: string;
}

interface ProjectData {
  name: string;
  description: string;
  status: string;
  priority: string;
  client_name: string;
  start_date: string;
  due_date: string;
  budget: string;
}

const EMPTY: ProjectData = {
  name: '',
  description: '',
  status: 'active',
  priority: 'medium',
  client_name: '',
  start_date: '',
  due_date: '',
  budget: '',
};

export default function ProjectForm({ projectId }: ProjectFormProps) {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const isEditing = !!projectId;

  const [form, setForm] = useState<ProjectData>(EMPTY);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      if (data) setClients(data);
    }
    loadClients();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    async function load() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error || !data) { setError('Project not found'); setLoading(false); return; }
      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        status: data.status ?? 'active',
        priority: data.priority ?? 'medium',
        client_name: data.client_name ?? '',
        start_date: data.start_date ? data.start_date.slice(0, 10) : '',
        due_date: data.due_date ? data.due_date.slice(0, 10) : '',
        budget: data.budget != null ? String(data.budget) : '',
      });
      setLoading(false);
    }
    load();
  }, [projectId]);

  function set(field: keyof ProjectData, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description,
      status: form.status,
      priority: form.priority,
      client_name: form.client_name,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      budget: form.budget ? parseFloat(form.budget) : null,
      workspace_id: workspace?.id,
    };

    const { error: saveError } = isEditing
      ? await supabase.from('projects').update(payload).eq('id', projectId)
      : await supabase.from('projects').insert(payload);

    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    router.push('/app/projects');
  }

  async function handleDelete() {
    if (!projectId) return;
    if (!confirm('Delete this project permanently?')) return;
    await supabase.from('projects').delete().eq('id', projectId);
    router.push('/app/projects');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading project data...
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
            {isEditing ? 'Edit Project' : 'New Project'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditing ? 'Update project details and settings' : 'Create a new project in your workspace'}
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

      {/* Basic Info */}
      <section className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Project Details</h2>
        <div>
          <label className={labelClass}>Project Name <span className="text-destructive">*</span></label>
          <input
            className={inputClass}
            placeholder="Brand Identity Redesign"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Client</label>
          <select
            className={inputClass}
            value={form.client_name}
            onChange={e => set('client_name', e.target.value)}
          >
            <option value="">No client assigned</option>
            {clients.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={inputClass + ' min-h-[100px] resize-none'}
            placeholder="What is this project about?"
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>
      </section>

      {/* Status & Priority */}
      <section className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Status & Priority</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={e => set('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select
              className={inputClass}
              value={form.priority}
              onChange={e => set('priority', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </section>

      {/* Timeline & Budget */}
      <section className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Timeline & Budget</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.start_date}
              onChange={e => set('start_date', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Budget (CAD)</label>
          <input
            type="number"
            className={inputClass}
            placeholder="5000"
            value={form.budget}
            onChange={e => set('budget', e.target.value)}
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
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </div>
  );
}
