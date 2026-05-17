'use client';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CHECKLIST_STEPS = [
  { id: 'workspace', label: 'Set up your workspace' },
  { id: 'team', label: 'Invite your team' },
  { id: 'client', label: 'Add your first client' },
  { id: 'project', label: 'Create your first project' },
  { id: 'invoice', label: 'Send your first invoice' },
];

export function GettingStartedChecklist() {
  const { user } = useAuth();
  const profile = useQuery(
    api.userProfiles.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const markItem = useMutation(api.userProfiles.markChecklistItem);

  const completed: string[] = (profile as { completedChecklist?: string[] } | null)?.completedChecklist ?? [];
  const progress = (completed.length / CHECKLIST_STEPS.length) * 100;

  if (!profile || completed.length >= CHECKLIST_STEPS.length) return null;

  async function handleMark(itemId: string) {
    if (!user?.email) return;
    await markItem({ email: user.email, itemId });
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
