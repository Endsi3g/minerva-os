'use client';
import { useState, useEffect } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

  const [justCompleted, setJustCompleted] = useState(false);
  const completed: string[] = profile?.completedChecklist ?? [];
  const progress = (completed.length / CHECKLIST_STEPS.length) * 100;

  if (!profile) return null;

  if (justCompleted || completed.length >= CHECKLIST_STEPS.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(127,163,138,0.08)',
        border: '1px solid rgba(127,163,138,0.2)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(127,163,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={16} color="#7FA38A" />
        </div>
        <div>
          <p style={{ color: '#F5F1E8', fontSize: 13, fontWeight: 600, margin: 0 }}>Setup complete</p>
          <p style={{ color: '#8A9099', fontSize: 11, margin: '2px 0 0' }}>Your workspace is ready. You're all set.</p>
        </div>
      </div>
    );
  }

  async function handleMark(itemId: string) {
    if (!user?.email || !profile) return;
    const newChecklist = [...completed, itemId];
    const { error } = await supabase
      .from('user_profiles')
      .update({ completed_checklist: newChecklist })
      .eq('email', user.email);
    if (!error) {
      const step = CHECKLIST_STEPS.find(s => s.id === itemId);
      toast.success(step ? `"${step.label}" completed` : 'Step completed');
      setProfile((prev: any) => ({ ...prev, completedChecklist: newChecklist }));
      if (newChecklist.length >= CHECKLIST_STEPS.length) {
        setTimeout(() => setJustCompleted(true), 400);
      }
    } else {
      toast.error('Could not save progress. Please try again.');
    }
  }

  return (
    <div style={{
      backgroundColor: '#111522',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ color: '#F5F1E8', fontSize: 13, fontWeight: 600, margin: 0 }}>Getting started</p>
          <p style={{ color: '#8A9099', fontSize: 11, margin: '2px 0 0' }}>{completed.length} of {CHECKLIST_STEPS.length} completed</p>
        </div>
        <span style={{ color: '#7FA38A', fontSize: 13, fontWeight: 600 }}>{Math.round(progress)}%</span>
      </div>

      <div style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 16 }}>
        <div style={{ height: 3, width: `${progress}%`, backgroundColor: '#7FA38A', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CHECKLIST_STEPS.map((step) => {
          const done = completed.includes(step.id);
          return (
            <div
              key={step.id}
              onClick={() => !done && handleMark(step.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: done ? 'default' : 'pointer',
                opacity: done ? 0.6 : 1,
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `1.5px solid ${done ? '#7FA38A' : 'rgba(255,255,255,0.15)'}`,
                backgroundColor: done ? '#7FA38A' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}>
                {done && <Check size={11} color="#0A0D14" strokeWidth={3} />}
              </div>
              <span style={{
                fontSize: 13,
                color: done ? '#8A9099' : '#B8BDC7',
                textDecoration: done ? 'line-through' : 'none',
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
