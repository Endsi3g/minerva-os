'use client';
import { useState, useEffect } from 'react';
import { Plus, Users, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TextAnimate } from '@/components/ui/text-animate';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';

type Member = {
  id: string;
  _id: string;
  display_name: string;
  displayName: string;
  weekly_hours: number;
  weeklyHours: number;
  role?: string;
};

type Task = {
  assignee?: string;
  assignedTo?: string;
  status?: string;
  estimatedHours?: number;
};

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

function AddMemberForm({
  workspaceId,
  onClose,
  onAdd,
}: {
  workspaceId: string;
  onClose: () => void;
  onAdd: (m: Member) => void;
}) {
  const { t } = useLang();
  const f = t.app.resources.form;
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [hours, setHours] = useState('40');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    try {
      // 1. Create a user profile first to satisfy foreign key constraint
      const { data: profile, error: pError } = await supabase
        .from('user_profiles')
        .insert({
          workspace_id: workspaceId,
          name,
          role: 'developer',
          email: `member_${Date.now()}@uprisingstudio.com`,
          onboarding_completed: true,
        })
        .select()
        .single();

      if (pError) throw pError;

      if (profile) {
        // 2. Create the member availability
        const { data: member, error: mError } = await supabase
          .from('member_availability')
          .insert({
            workspace_id: workspaceId,
            user_id: profile.id,
            display_name: name,
            weekly_hours: Number(hours),
            role: role || undefined,
          })
          .select()
          .single();

        if (mError) throw mError;

        if (member) {
          onAdd({
            id: member.id,
            _id: member.id,
            display_name: member.display_name,
            displayName: member.display_name,
            weekly_hours: Number(member.weekly_hours),
            weeklyHours: Number(member.weekly_hours),
            role: member.role || undefined,
          });
        }
      }
    } catch (err) {
      console.error('Failed to add member:', err);
    } finally {
      setSaving(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4 bg-midnight border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <h3 className="text-sm font-semibold text-ivory">{f.title}</h3>
          <button type="button" onClick={onClose} className="text-fog hover:text-ivory"><X size={14} /></button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-fog uppercase tracking-wider">{f.namePlaceholder}</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs bg-midnight border border-white/5 rounded-lg px-3 py-2 text-ivory outline-none focus:border-sage"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-fog uppercase tracking-wider">{f.rolePlaceholder}</label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full text-xs bg-midnight border border-white/5 rounded-lg px-3 py-2 text-ivory outline-none focus:border-sage"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-fog uppercase tracking-wider">{f.weeklyCapacity}</label>
            <input
              type="number"
              required
              value={hours}
              onChange={e => setHours(e.target.value)}
              className="w-full text-xs bg-midnight border border-white/5 rounded-lg px-3 py-2 text-ivory outline-none focus:border-sage"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
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

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) setWorkspaces(data);
    });
  }, []);

  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (!workspaceId) return;
    async function fetchData() {
      const [{ data: mData }, { data: tData }] = await Promise.all([
        supabase.from('member_availability').select('*').eq('workspace_id', workspaceId),
        supabase.from('tasks').select('*').eq('workspace_id', workspaceId),
      ]);
      if (mData) {
        setMembers(mData.map(m => ({
          id: m.id,
          _id: m.id,
          display_name: m.display_name,
          displayName: m.display_name,
          weekly_hours: Number(m.weekly_hours),
          weeklyHours: Number(m.weekly_hours),
          role: m.role || undefined,
        })));
      }
      if (tData) {
        setTasks(tData.map(t => ({
          assignee: t.assignee,
          assignedTo: t.assignee,
          status: t.status,
          estimatedHours: t.estimated_hours ? Number(t.estimated_hours) : 2,
        })));
      }
    }
    fetchData();
  }, [workspaceId]);

  async function removeMember(id: string) {
    await supabase.from('member_availability').delete().eq('id', id);
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  // Compute assigned hours per member (from tasks with assignee or assignedTo).
  function getAssignedHours(displayName: string): number {
    return tasks
      .filter((task) => (task.assignee === displayName || task.assignedTo === displayName) && task.status !== 'done')
      .reduce((sum, t) => sum + (t.estimatedHours ?? 2), 0);
  }

  const overloaded = members.filter(m => getAssignedHours(m.displayName) > m.weeklyHours);
  const totalCapacity = members.reduce((acc, m) => acc + m.weeklyHours, 0);
  const totalAssigned = members.reduce((acc, m) => acc + getAssignedHours(m.displayName), 0);

  const kpis = [
    { label: res.kpis.totalCapacity, value: `${totalCapacity}h`, color: 'text-ivory' },
    { label: res.kpis.assigned, value: `${totalAssigned}h`, color: 'text-warm' },
    { label: res.kpis.utilization, value: totalCapacity > 0 ? `${Math.round(totalAssigned / totalCapacity * 100)}%` : '0%', color: totalAssigned / totalCapacity > 0.9 ? 'text-ember' : 'text-sage' },
    { label: res.kpis.overloaded, value: String(overloaded.length), color: overloaded.length > 0 ? 'text-ember' : 'text-sage' },
  ];

  return (
    <>
      {showForm && workspaceId && (
        <AddMemberForm
          workspaceId={workspaceId}
          onClose={() => setShowForm(false)}
          onAdd={(newMember) => setMembers(prev => [...prev, newMember])}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <TextAnimate text={res.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
          <p className="text-sm text-fog mt-0.5">
            {res.memberCount.replace('{{count}}', String(members.length)).replace('{{capacity}}', String(Math.round(totalCapacity)))}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
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
              <span key={m._id} className="text-xs text-ember bg-ember/10 px-2 py-0.5 rounded-full">{m.displayName}</span>
            ))}
          </div>
        </div>
      )}

      {/* Member capacity bars */}
      {members.length === 0 ? (
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
          {members.map((member) => {
            const assigned = getAssignedHours(member.displayName);
            return (
              <div
                key={member._id}
                className="rounded-xl p-4 border border-border bg-card group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-dusk border border-white/10 flex items-center justify-center text-xs font-medium text-silver">
                      {member.displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ivory">{member.displayName}</p>
                      {Boolean(member.role) && <p className="text-[10px] text-fog">{member.role}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeMember(member._id)}
                    className="opacity-0 group-hover:opacity-100 text-fog hover:text-ember transition-all h-6 w-6 flex items-center justify-center rounded"
                  >
                    <X size={11} />
                  </button>
                </div>
                <CapacityBar used={assigned} total={member.weeklyHours} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
