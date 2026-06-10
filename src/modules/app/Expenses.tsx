'use client';
import { useState, useEffect } from 'react';
import { Plus, Receipt, Check, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TextAnimate } from '@/components/ui/text-animate';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

function fmt(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending:  { label: 'Pending',  class: 'text-warm bg-warm/10 border-warm/20' },
  approved: { label: 'Approved', class: 'text-sage bg-sage/10 border-sage/20' },
  rejected: { label: 'Rejected', class: 'text-ember bg-ember/10 border-ember/20' },
};

function ExpenseForm({ workspaceId, submittedBy, projects, categories, onClose, t, onCreated }: {
  workspaceId: string | null;
  submittedBy: string;
  projects: any[];
  categories: string[];
  onClose: () => void;
  t: any;
  onCreated: (expense: any) => void;
}) {
  const f = t.app.expenses.form;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [projectId, setProjectId] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount) return;
    setSaving(true);
    const { data } = await supabase.from('expenses').insert({
      workspace_id: workspaceId,
      submitted_by: submittedBy,
      amount: Number(amount),
      currency: 'USD',
      category,
      description,
      date: new Date(date).toISOString(),
      project_id: projectId || null,
      status: 'pending',
    }).select().single();
    if (data) onCreated(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl p-6 space-y-4 bg-midnight border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ivory">{t.app.expenses.addExpense}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog"><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>
        <div className="space-y-3">
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder={f.descriptionPlaceholder}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none bg-obsidian border border-border" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={f.amount}
              className="px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none bg-obsidian border border-border" />
            <select value={category} onChange={e => setCategory(e.target.value)}
              title="Category"
              className="px-3 py-2 rounded-lg text-sm text-ivory outline-none bg-midnight border border-border">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            title="Date"
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory outline-none bg-obsidian border border-border" />
          {projects.length > 0 && (
            <select value={projectId} onChange={e => setProjectId(e.target.value)}
              title="Project"
              className="w-full px-3 py-2 rounded-lg text-sm text-ivory outline-none bg-midnight border border-border">
              <option value="">{f.project}</option>
              {projects.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-fog hover:text-silver">{f.cancel}</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving}>{f.save}</Button>
        </div>
      </form>
    </div>
  );
}

export default function Expenses() {
  const { t } = useLang();
  const { user } = useAuth();
  const ex = t.app.expenses;

  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const wsRes = await supabase.from('workspaces').select('id').limit(1);
      const wid = wsRes.data?.[0]?.id;
      if (!wid) return;
      setWorkspaceId(wid);
      const [expRes, projRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('workspace_id', wid).order('date', { ascending: false }),
        supabase.from('projects').select('id,name').eq('workspace_id', wid),
      ]);
      setExpenses(expRes.data ?? []);
      setProjects(projRes.data ?? []);
    }
    load();
  }, []);

  async function approveExpense(id: string) {
    await supabase.from('expenses').update({ status: 'approved', approved_by: user?.name ?? 'Admin' }).eq('id', id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e));
  }
  async function rejectExpense(id: string) {
    await supabase.from('expenses').update({ status: 'rejected' }).eq('id', id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
  }
  async function removeExpense(id: string) {
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  }

  const [showForm, setShowForm] = useState(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    const action = searchParams?.get('create') || searchParams?.get('new');
    if (action === 'expense') {
      setShowForm(true);
    }
  }, [searchParams]);

  const totalPending = (expenses as any[]).filter(e => e.status === 'pending').reduce((s: number, e: any) => s + e.amount, 0);
  const totalApproved = (expenses as any[]).filter(e => e.status === 'approved').reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <>
      {showForm && (
      <ExpenseForm
          workspaceId={workspaceId}
          submittedBy={user?.name ?? 'Unknown'}
          projects={projects}
          categories={ex.categories}
          onClose={() => setShowForm(false)}
          t={t}
          onCreated={(e) => setExpenses(prev => [e, ...prev])}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <TextAnimate text={ex.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
          <p className="text-sm text-fog mt-0.5">
            {ex.subtitle.replace('{{count}}', String(expenses.length))}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          {ex.addExpense}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Pending', value: fmt(totalPending), color: 'text-warm', count: (expenses as any[]).filter(e => e.status === 'pending').length },
          { label: 'Approved', value: fmt(totalApproved), color: 'text-sage', count: (expenses as any[]).filter(e => e.status === 'approved').length },
          { label: 'Total expenses', value: String((expenses as any[]).length), color: 'text-ivory', count: null },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 border border-border bg-card">
            <p className={cn('text-xl font-semibold tabular-nums', s.color)}>{s.value}</p>
            <p className="text-xs text-fog mt-1">{s.label}</p>
          </div>
        ))}
      </div>

          {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Receipt size={36} className="text-fog/30" />
          <p className="text-sm text-fog">{ex.noExpenses}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(expenses as any[]).map((expense: any) => {
            const sc = STATUS_CONFIG[expense.status] ?? STATUS_CONFIG.pending;
            return (
              <div
                key={expense._id}
                className="flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl border transition-colors hover:border-white/15 group bg-card border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ivory truncate">{expense.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-fog">{expense.category}</span>
                    <span className="text-[10px] text-fog/40">·</span>
                    <span className="text-[10px] text-fog">{expense.submittedBy}</span>
                    <span className="text-[10px] text-fog/40">·</span>
                    <span className="text-[10px] text-fog">{new Date(expense.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0', sc.class)}>
                  {sc.label}
                </span>
                <p className="text-sm font-semibold text-ivory tabular-nums shrink-0 w-20 text-right">
                  {fmt(expense.amount, expense.currency)}
                </p>
                {expense.status === 'pending' && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => approveExpense(expense.id)}
                      className="h-6 w-6 flex items-center justify-center rounded text-fog hover:text-sage hover:bg-sage/10 transition-colors"
                      aria-label="Approve Expense"
                    >
                      <Check size={11} />
                    </button>
                    <button
                      onClick={() => rejectExpense(expense.id)}
                      className="h-6 w-6 flex items-center justify-center rounded text-fog hover:text-ember hover:bg-ember/10 transition-colors"
                      aria-label="Reject Expense"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => removeExpense(expense.id)}
                  className="opacity-0 group-hover:opacity-100 text-fog hover:text-ember transition-all h-6 w-6 flex items-center justify-center rounded"
                  aria-label="Delete Expense"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
