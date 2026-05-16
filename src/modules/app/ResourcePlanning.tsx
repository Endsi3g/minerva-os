'use client';
import { useState } from 'react';
import { Plus, Users, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLang } from '@/i18n';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

type Member = Record<string, unknown>;
type Task = Record<string, unknown>;

function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color = pct >= 100 ? '#A86A6A' : pct >= 80 ? '#B89B6A' : '#7FA38A';
  const overloaded = used > total;
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-fog mb-1">
        <span>{used}h / {total}h</span>
        <span className={cn(overloaded && 'text-ember font-medium')}>
          {Math.round(pct)}%{overloaded && ' ⚠'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function AddMemberForm({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
  const { t } = useLang();
  const f = t.app.resources.form;
  const upsert = useMutation(api.resources.upsertMember as Parameters<typeof useMutation>[0]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [hours, setHours] = useState('40');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    const userId = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    await upsert({ workspaceId, userId, displayName: name, weeklyHours: Number(hours), role: role || undefined });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ivory">{f.title}</h2>
          <button type="button" onClick={onClose}><X size={14} className="text-fog hover:text-ivory" /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={f.namePlaceholder}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder={f.rolePlaceholder}
            className="w-full px-3 py-2 rounded-lg text-sm text-ivory placeholder:text-fog outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <div className="flex items-center gap-3">
            <label className="text-xs text-fog shrink-0">{f.weeklyCapacity}</label>
            <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="1" max="80"
              className="flex-1 px-3 py-2 rounded-lg text-sm text-ivory outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-xs text-fog hover:text-silver">{f.cancel}</button>
          <Button type="submit" size="sm" className="flex-1" disabled={saving}>{f.save}</Button>
        </div>
      </form>
    </div>
  );
}

export default function ResourcePlanning() {
  const { t } = useLang();
  const res = t.app.resources;
  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const members = useQuery(api.resources.listMembers as Parameters<typeof useQuery>[0], workspaceId ? { workspaceId } : 'skip') ?? [];
  const tasks = useQuery(api.tasks.get as Parameters<typeof useQuery>[0], workspaceId ? { workspaceId } : 'skip') ?? [];
  const removeMember = useMutation(api.resources.removeMember as Parameters<typeof useMutation>[0]);

  const [showForm, setShowForm] = useState(false);

  const typedMembers = members as Member[];
  const typedTasks = tasks as Task[];

  // Compute assigned hours per member (from tasks with assignedTo). Assumes 2h per open task.
  function getAssignedHours(displayName: string): number {
    return typedTasks.filter(
      (task) => task.assignedTo === displayName && task.status !== 'done'
    ).length * 2;
  }

  const overloaded = typedMembers.filter(m => getAssignedHours(m.displayName as string) > (m.weeklyHours as number));
  const totalCapacity = typedMembers.reduce((acc, m) => acc + (m.weeklyHours as number), 0);
  const totalAssigned = typedMembers.reduce((acc, m) => acc + getAssignedHours(m.displayName as string), 0);

  const kpis = [
    { label: res.kpis.totalCapacity, value: `${totalCapacity}h`, color: 'text-ivory' },
    { label: res.kpis.assigned, value: `${totalAssigned}h`, color: 'text-warm' },
    { label: res.kpis.utilization, value: totalCapacity > 0 ? `${Math.round(totalAssigned / totalCapacity * 100)}%` : '0%', color: totalAssigned / totalCapacity > 0.9 ? 'text-ember' : 'text-sage' },
    { label: res.kpis.overloaded, value: String(overloaded.length), color: overloaded.length > 0 ? 'text-ember' : 'text-sage' },
  ];

  return (
    <>
      {showForm && workspaceId && (
        <AddMemberForm workspaceId={workspaceId} onClose={() => setShowForm(false)} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ivory">{res.title}</h1>
          <p className="text-sm text-fog mt-0.5">
            {res.memberCount.replace('{{count}}', String(typedMembers.length)).replace('{{capacity}}', String(Math.round(totalCapacity)))}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} disabled={!workspaceId}>
          <Plus size={14} />
          {res.addMember}
        </Button>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {kpis.map(kpi => (
          <div key={kpi.label} className="rounded-xl p-4 border border-border bg-card">
            <p className={cn('text-2xl font-semibold tabular-nums', kpi.color)}>{kpi.value}</p>
            <p className="text-xs text-fog mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Overload alert */}
      {overloaded.length > 0 && (
        <div className="rounded-xl p-4 border border-ember/20 bg-ember/5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} className="text-ember" />
            <span className="text-xs font-medium text-ember">{res.overloadAlert}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {overloaded.map(m => (
              <span key={m._id as string} className="text-xs text-ember bg-ember/10 px-2 py-0.5 rounded-full">{m.displayName as string}</span>
            ))}
          </div>
        </div>
      )}

      {/* Member capacity bars */}
      {typedMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Users size={36} className="text-fog/30" />
          <p className="text-sm text-fog">{res.noMembers}</p>
          {workspaceId && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <Plus size={12} />{res.addMember}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {typedMembers.map((member) => {
            const assigned = getAssignedHours(member.displayName as string);
            return (
              <div
                key={member._id as string}
                className="rounded-xl p-4 border border-border bg-card group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-dusk border border-white/10 flex items-center justify-center text-xs font-medium text-silver">
                      {(member.displayName as string).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ivory">{member.displayName as string}</p>
                      {member.role && <p className="text-[10px] text-fog">{member.role as string}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeMember({ id: member._id as Parameters<typeof removeMember>[0]['id'] })}
                    className="opacity-0 group-hover:opacity-100 text-fog hover:text-ember transition-all h-6 w-6 flex items-center justify-center rounded"
                  >
                    <X size={11} />
                  </button>
                </div>
                <CapacityBar used={assigned} total={member.weeklyHours as number} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
