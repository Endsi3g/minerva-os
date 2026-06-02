'use client';
import { useState, useMemo } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { TextAnimate } from '@/components/ui/text-animate';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspaces, useFinances, useAddFinance } from '@/lib/hooks/useSupabase';
import { useLang } from '@/i18n';
import { Skeleton } from '@/components/ui/skeleton';

const TPS_RATE = 0.05;
const TVQ_RATE = 0.09975;

function FinanceSkeleton() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-4 w-32 bg-white/5" />
        </div>
        <Skeleton className="h-9 w-28 bg-white/5 rounded-full" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-midnight p-6 space-y-3">
            <Skeleton className="h-3 w-20 bg-white/5" />
            <Skeleton className="h-8 w-28 bg-white/5" />
          </div>
        ))}
      </div>

      {/* Tax box */}
      <div className="bg-dusk/30 rounded-2xl p-6 border border-white/5 space-y-4">
        <Skeleton className="h-5 w-48 bg-white/5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 bg-white/5" />
            <Skeleton className="h-2 w-full bg-white/5 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 bg-white/5" />
            <Skeleton className="h-2 w-full bg-white/5 rounded-full" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-midnight rounded-2xl border border-white/5 overflow-hidden">
        <div className="h-10 bg-white/[0.02] border-b border-white/5" />
        <div className="divide-y divide-white/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-6 flex justify-between gap-4">
              <Skeleton className="h-4 w-20 bg-white/5" />
              <Skeleton className="h-4 w-40 bg-white/5" />
              <Skeleton className="h-4 w-16 bg-white/5" />
              <Skeleton className="h-4 w-12 bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Finance() {
  const { t, lang } = useLang();
  const f = t.app.financeModule;
  
  const workspaces = useWorkspaces();
  const workspaceId = workspaces?.[0]?.id;

  const finances = useFinances(workspaceId);
  const addEntry = useAddFinance();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'income',
    category: 'Software',
    date: new Date().toISOString().split('T')[0],
  });

  const isLoading = workspaces === null || finances === null;

  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let tpsCollected = 0;
    let tvqCollected = 0;
    let tpsPaid = 0;
    let tvqPaid = 0;

    if (finances) {
      finances.forEach((entry: any) => {
        if (entry.type === 'income') {
          income += entry.amount;
          tpsCollected += entry.tps;
          tvqCollected += entry.tvq;
        } else {
          expenses += entry.amount;
          tpsPaid += entry.tps;
          tvqPaid += entry.tvq;
        }
      });
    }

    return {
      income,
      expenses,
      net: income - expenses,
      tpsNet: tpsCollected - tpsPaid,
      tvqNet: tvqCollected - tvqPaid,
    };
  }, [finances]);

  const fmt = (val: number) => 
    new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(val);

  async function handleSubmit() {
    const baseAmount = parseFloat(form.amount);
    if (isNaN(baseAmount)) return;

    if (!workspaceId) return;
    await addEntry({
      workspaceId,
      type: form.type,
      amount: baseAmount,
      description: form.description,
      category: form.category,
      date: form.date,
      tps: baseAmount * TPS_RATE,
      tvq: baseAmount * TVQ_RATE,
      status: 'paid',
    });

    setShowAdd(false);
    setForm({ ...form, description: '', amount: '' });
  }

  if (isLoading) {
    return <FinanceSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <TextAnimate text={f.title} type="calmInUp" className="text-3xl font-serif text-ivory tracking-tight" />
          <p className="text-sm text-fog mt-1">{f.stats}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="rounded-full bg-ivory text-obsidian hover:bg-ivory/90">
          <Plus size={16} className="mr-2" /> {t.app.common.add}
        </Button>
      </div>

      {/* Summary Cards - Notion Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-midnight border-white/5 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-fog uppercase tracking-wider flex items-center justify-between">
              {f.revenue} <TrendingUp size={14} className="text-sage" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-ivory"><AnimatedNumber value={totals.income} format={(n) => fmt(n)} stiffness={80} damping={18} mass={0.5} /></p>
          </CardContent>
        </Card>

        <Card className="bg-midnight border-white/5 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-fog uppercase tracking-wider flex items-center justify-between">
              {f.expenses} <TrendingDown size={14} className="text-ember" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-ivory"><AnimatedNumber value={totals.expenses} format={(n) => fmt(n)} stiffness={80} damping={18} mass={0.5} /></p>
          </CardContent>
        </Card>

        <Card className="bg-midnight border-white/5 shadow-none ring-1 ring-sage/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-fog uppercase tracking-wider flex items-center justify-between">
              {f.netProfit} <Wallet size={14} className="text-sage" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-sage"><AnimatedNumber value={totals.net} format={(n) => fmt(n)} stiffness={80} damping={18} mass={0.5} /></p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Report Section */}
      <div className="bg-dusk/30 rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-4 text-ivory">
          <Calculator size={18} className="text-warm" />
          <TextAnimate text="Quebec Tax Summary (TPS/TVQ)" type="fadeIn" className="text-lg font-medium" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-fog">TPS Net to Pay</span>
              <span className={cn("font-medium", totals.tpsNet >= 0 ? "text-warm" : "text-sage")}>
                {fmt(totals.tpsNet)}
              </span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-warm" style={{ width: '40%' }} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-fog">TVQ Net to Pay</span>
              <span className={cn("font-medium", totals.tvqNet >= 0 ? "text-warm" : "text-sage")}>
                {fmt(totals.tvqNet)}
              </span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-warm" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-midnight rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white/[0.02] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-xs font-medium text-fog uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-medium text-fog uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-xs font-medium text-fog uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-medium text-fog uppercase tracking-wider text-right">Amount</th>
              <th className="px-6 py-4 text-xs font-medium text-fog uppercase tracking-wider text-right">TPS</th>
              <th className="px-6 py-4 text-xs font-medium text-fog uppercase tracking-wider text-right">TVQ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {finances?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-xs text-fog">
                  No transactions found.
                </td>
              </tr>
            ) : (
              finances?.map((entry: any) => (
                <tr key={entry._id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 text-sm text-silver">{entry.date}</td>
                  <td className="px-6 py-4 text-sm text-ivory font-medium">{entry.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-dusk text-fog border border-white/5">
                      {entry.category}
                    </span>
                  </td>
                  <td className={cn("px-6 py-4 text-sm font-semibold text-right", entry.type === 'income' ? 'text-sage' : 'text-ember')}>
                    {entry.type === 'income' ? '+' : '-'}{fmt(entry.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-fog text-right">{fmt(entry.tps)}</td>
                  <td className="px-6 py-4 text-sm text-fog text-right">{fmt(entry.tvq)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add Entry Modal - Notion Minimalist */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-midnight border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-serif text-ivory mb-6">New Transaction</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-fog">Type</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={form.type === 'income' ? 'default' : 'outline'}
                    className="flex-1 rounded-lg"
                    onClick={() => setForm({ ...form, type: 'income' })}
                  >Income</Button>
                  <Button 
                    variant={form.type === 'expense' ? 'default' : 'outline'}
                    className="flex-1 rounded-lg"
                    onClick={() => setForm({ ...form, type: 'expense' })}
                  >Expense</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-fog">Description</Label>
                <Input 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Client Monthly Retainer"
                  className="bg-obsidian border-white/5"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-fog">Amount (CAD)</Label>
                <Input 
                  type="number"
                  value={form.amount} 
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="bg-obsidian border-white/5"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-ivory text-obsidian hover:bg-ivory/90">Add Transaction</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
