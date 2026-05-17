'use client';
import { useState } from 'react';
import { Plus, Receipt, Check, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLang } from '@/i18n';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';

function fmt(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending:  { label: 'Pending',  class: 'text-warm bg-warm/10 border-warm/20' },
  approved: { label: 'Approved', class: 'text-sage bg-sage/10 border-sage/20' },
  rejected: { label: 'Rejected', class: 'text-ember bg-ember/10 border-ember/20' },
};

function ExpenseForm({ workspaceId, submittedBy, projects, categories, onClose, t }: {
  workspaceId: any;
  submittedBy: string;
  projects: any[];
  categories: string[];
  onClose: () => void;
  t: any;
}) {
  const createExpense = useMutation(api.expenses.create as any);
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
    await createExpense({
      workspaceId,
      submittedBy,
      amount: Number(amount),
      currency: 'USD',
      category,
      description,
      date: new Date(date).getTime(),
      projectId: projectId ? projectId as any : undefined,
    });
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
          <h2 className="text-sm font-semibold text-ivory">{t.app.expenses.addExpense}</h2>
          <button type="button" onClick={onClose}><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>
        <div className="space-y-3">
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder={f.descriptionPlaceholder}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={f.amount}
              className="px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-ivory outline-none"
              style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          {projects.length > 0 && (
            <select value={projectId} onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-ivory outline-none"
              style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}>
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

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const expenses = useQuery(api.expenses.list as any, workspaceId ? { workspaceId } : 'skip') ?? [];
  const projects = useQuery(api.projects.list as any, workspaceId ? { workspaceId } : 'skip') ?? [];
  const approveExpense = useMutation(api.expenses.approve as any);
  const rejectExpense = useMutation(api.expenses.reject as any);
  const removeExpense = useMutation(api.expenses.remove as any);

  const [showForm, setShowForm] = useState(false);

  const totalPending = (expenses as any[]).filter(e => e.status === 'pending').reduce((s: number, e: any) => s + e.amount, 0);
  const totalApproved = (expenses as any[]).filter(e => e.status === 'approved').reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <>
      {showForm && (
        <ExpenseForm
          workspaceId={workspaceId}
          submittedBy={user?.name ?? 'Unknown'}
          projects={projects as any[]}
          categories={ex.categories}
          onClose={() => setShowForm(false)}
          t={t}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{ex.title}</h1>
          <p className="text-sm text-fog mt-0.5">
            {ex.subtitle.replace('{{count}}', String((expenses as any[]).length))}
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

      {/* List */}
      {(expenses as any[]).length === 0 ? (
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
                className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors hover:border-white/15 group"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
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
                      onClick={() => approveExpense({ id: expense._id, approvedBy: user?.name ?? 'Admin' })}
                      className="h-6 w-6 flex items-center justify-center rounded text-fog hover:text-sage hover:bg-sage/10 transition-colors"
                    >
                      <Check size={11} />
                    </button>
                    <button
                      onClick={() => rejectExpense({ id: expense._id })}
                      className="h-6 w-6 flex items-center justify-center rounded text-fog hover:text-ember hover:bg-ember/10 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => removeExpense({ id: expense._id })}
                  className="opacity-0 group-hover:opacity-100 text-fog hover:text-ember transition-all h-6 w-6 flex items-center justify-center rounded"
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
