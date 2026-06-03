'use client';
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const CHECKLIST_STEPS = [
  { id: 'workspace', label: 'Set up your workspace' },
  { id: 'team', label: 'Invite your team' },
  { id: 'client', label: 'Add your first client' },
  { id: 'project', label: 'Create your first project' },
  { id: 'invoice', label: 'Send your first invoice' },
];

export function GettingStartedChecklist() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user?.email) return;
    supabase
      .from('user_profiles')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({ ...data, completedChecklist: data.completed_checklist || [] });
        }
      });
  }, [user]);

  const completed: string[] = profile?.completedChecklist ?? [];
  const progress = (completed.length / CHECKLIST_STEPS.length) * 100;

  if (completed.length >= CHECKLIST_STEPS.length) return null;

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

  return (
    <div className="bg-midnight border border-border rounded-2xl p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-ivory text-sm font-semibold m-0">Getting started</p>
          <p className="text-fog text-[11px] mt-0.5 mb-0">{completed.length} of {CHECKLIST_STEPS.length} completed</p>
        </div>
        <span className="text-sage text-sm font-semibold">{Math.round(progress)}%</span>
      </div>

      <div className="h-[3px] bg-white/5 rounded-full mb-4">
        <div className="h-full bg-sage rounded-full transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-col gap-2">
        {CHECKLIST_STEPS.map((step) => {
          const done = completed.includes(step.id);
          return (
            <div
              key={step.id}
              onClick={() => !done && handleMark(step.id)}
              className={cn(
                "flex items-center gap-2.5",
                done ? "cursor-default opacity-60" : "cursor-pointer"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200",
                done ? "border-sage bg-sage" : "border-border bg-transparent"
              )}>
                {done && <Check size={11} className="text-obsidian" strokeWidth={3} />}
              </div>
              <span className={cn(
                "text-xs",
                done ? "text-fog line-through" : "text-silver"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
