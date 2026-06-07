'use client';
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';

const SMB_TEAM_SIZES = ['solo', '2-5', '6-15'];

const WEEK1_ITEMS = ['profile', 'client', 'portal', 'proposal', 'invoice'];
const WEEK2_ITEMS = ['services', 'project', 'deliverable', 'retainer'];
const LEGACY_ITEMS = [
  { id: 'workspace', label: 'Set up your workspace' },
  { id: 'team', label: 'Invite your team' },
  { id: 'client', label: 'Add your first client' },
  { id: 'project', label: 'Create your first project' },
  { id: 'invoice', label: 'Send your first invoice' },
];

export function GettingStartedChecklist() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const { t } = useLang();
  const [profile, setProfile] = useState<any>(null);

  const isSMB = SMB_TEAM_SIZES.includes(workspace?.teamSize ?? '');
  const s = t.smb.checklist;

  useEffect(() => {
    if (!user?.email) return;
    supabase
      .from('user_profiles')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (data) {
          setProfile({ ...data, completedChecklist: data.completed_checklist || [] });
        }
      });
  }, [user]);

  const completed: string[] = profile?.completedChecklist ?? [];

  const allSMBItems = [...WEEK1_ITEMS, ...WEEK2_ITEMS];
  const allLegacyItems = LEGACY_ITEMS.map(i => i.id);

  const totalItems = isSMB ? allSMBItems.length : allLegacyItems.length;
  const relevantCompleted = isSMB
    ? completed.filter(id => allSMBItems.includes(id))
    : completed.filter(id => allLegacyItems.includes(id));
  const progress = (relevantCompleted.length / totalItems) * 100;

  if (relevantCompleted.length >= totalItems) return null;

  async function handleMark(itemId: string) {
    const newChecklist = [...completed, itemId];
    setProfile((prev: any) => ({ ...(prev ?? {}), completedChecklist: newChecklist }));
    if (user?.email && profile) {
      await supabase
        .from('user_profiles')
        .update({ completed_checklist: newChecklist })
        .eq('email', user.email);
    }
  }

  if (!isSMB) {
    return (
      <div className="bg-midnight border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-ivory text-sm font-semibold m-0">Getting started</p>
            <p className="text-fog text-[11px] mt-0.5 mb-0">{relevantCompleted.length} of {totalItems} completed</p>
          </div>
          <span className="text-sage text-sm font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="h-[3px] bg-white/5 rounded-full mb-4">
          <div className="h-full bg-sage rounded-full transition-[width] duration-500" ref={(node) => { if (node) node.style.width = `${progress}%`; }} />
        </div>
        <div className="flex flex-col gap-2">
          {LEGACY_ITEMS.map(item => {
            const done = completed.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => !done && handleMark(item.id)}
                className={cn('flex items-center gap-2.5', done ? 'cursor-default opacity-60' : 'cursor-pointer')}
              >
                <div className={cn('w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200', done ? 'border-sage bg-sage' : 'border-border bg-transparent')}>
                  {done && <Check size={11} className="text-obsidian" strokeWidth={3} />}
                </div>
                <span className={cn('text-xs', done ? 'text-fog line-through' : 'text-silver')}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const week1Done = WEEK1_ITEMS.filter(id => completed.includes(id));
  const week1Complete = week1Done.length >= WEEK1_ITEMS.length;

  return (
    <div className="bg-midnight border border-border rounded-2xl p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-ivory text-sm font-semibold m-0">{s.title}</p>
          <p className="text-fog text-[11px] mt-0.5 mb-0">
            {s.completedOf.replace('{{done}}', String(relevantCompleted.length)).replace('{{total}}', String(totalItems))}
          </p>
        </div>
        <span className="text-sage text-sm font-semibold">{Math.round(progress)}%</span>
      </div>

      <div className="h-[3px] bg-white/5 rounded-full mb-4">
        <div className="h-full bg-sage rounded-full transition-[width] duration-500" ref={(node) => { if (node) node.style.width = `${progress}%`; }} />
      </div>

      {/* Week 1 track */}
      <p className="text-[9px] uppercase font-bold tracking-wider text-fog mb-2">{s.week1Title}</p>
      <div className="flex flex-col gap-2 mb-4">
        {WEEK1_ITEMS.map(id => {
          const done = completed.includes(id);
          const label = s.items[id as keyof typeof s.items] ?? id;
          return (
            <div
              key={id}
              onClick={() => !done && handleMark(id)}
              className={cn('flex items-center gap-2.5', done ? 'cursor-default opacity-60' : 'cursor-pointer')}
            >
              <div className={cn('w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200', done ? 'border-sage bg-sage' : 'border-border bg-transparent')}>
                {done && <Check size={11} className="text-obsidian" strokeWidth={3} />}
              </div>
              <span className={cn('text-xs', done ? 'text-fog line-through' : 'text-silver')}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Week 2-4 track — only shown once week 1 is complete */}
      {week1Complete && (
        <>
          <p className="text-[9px] uppercase font-bold tracking-wider text-fog mb-2">{s.week2Title}</p>
          <div className="flex flex-col gap-2">
            {WEEK2_ITEMS.map(id => {
              const done = completed.includes(id);
              const label = s.items[id as keyof typeof s.items] ?? id;
              return (
                <div
                  key={id}
                  onClick={() => !done && handleMark(id)}
                  className={cn('flex items-center gap-2.5', done ? 'cursor-default opacity-60' : 'cursor-pointer')}
                >
                  <div className={cn('w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200', done ? 'border-sage bg-sage' : 'border-border bg-transparent')}>
                    {done && <Check size={11} className="text-obsidian" strokeWidth={3} />}
                  </div>
                  <span className={cn('text-xs', done ? 'text-fog line-through' : 'text-silver')}>{label}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Tease week 2-4 if week 1 not done */}
      {!week1Complete && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[9px] uppercase font-bold tracking-wider text-fog/40 mb-1">{s.week2Title}</p>
          <p className="text-[10px] text-fog/40">{WEEK2_ITEMS.length} more steps unlocked after week 1</p>
        </div>
      )}
    </div>
  );
}
