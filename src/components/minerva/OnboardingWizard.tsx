'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'workspace', label: 'Workspace', description: 'Set up your workspace identity' },
  { id: 'team', label: 'Team', description: 'Invite your first team members' },
  { id: 'client', label: 'Client', description: 'Add your first client' },
  { id: 'project', label: 'Project', description: 'Create your first project' },
];

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-12">
      {STEPS.map((step, i) => (
        <div key={step.id} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold transition-all duration-300',
              i < current ? 'bg-[#7FA38A] text-[#0A0D14]' : i === current ? 'bg-[#F5F1E8] text-[#0A0D14]' : 'bg-white/8 text-fog'
            )}
          >
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                'flex-1 h-px mx-2 transition-colors duration-300',
                i < current ? 'bg-[#7FA38A]' : 'bg-white/8'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const inputCls = 'w-full bg-midnight border border-white/8 rounded-xl px-4 py-3 text-ivory text-sm outline-none focus:border-white/20 box-border mb-4';
const labelCls = 'block text-silver text-[13px] mb-1.5';
const primaryBtnCls = 'inline-flex items-center gap-2 bg-ivory text-obsidian border-none rounded-xl px-6 py-3 text-sm font-semibold cursor-pointer disabled:opacity-50 transition-opacity';
const ghostBtnCls = 'inline-flex items-center gap-2 bg-transparent text-silver border border-white/12 rounded-xl px-6 py-3 text-sm cursor-pointer transition-opacity hover:opacity-80';

function WorkspaceStep({ onNext }: { onNext: (id: string) => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  async function handleNext() {
    if (!name) return;
    setLoading(true);
    try {
      const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const ownerId = user?.id || 'demo-user-01';
      const { data: ws } = await supabase
        .from('workspaces')
        .insert({ name, slug, owner_user_id: ownerId })
        .select()
        .single();
      if (ws) {
        if (user) {
          await supabase.from('user_profiles').update({ workspace_id: ws.id }).eq('user_id', user.id);
        }
        onNext(ws.id);
      } else {
        onNext('');
      }
    } catch (e) {
      console.error(e);
      onNext('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-ivory text-[22px] font-semibold mb-2">Name your workspace</h2>
      <p className="text-fog text-sm mb-8">This is how your workspace will appear to your team and clients.</p>
      <label className={labelCls}>Workspace name</label>
      <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Uprising Studio" title="Workspace name" />
      <button onClick={handleNext} disabled={loading} className={primaryBtnCls}>
        {loading ? 'Saving...' : 'Continue'} <ArrowRight size={16} />
      </button>
    </div>
  );
}

function TeamStep({ onNext, onBack, workspaceId }: { onNext: () => void; onBack: () => void; workspaceId: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!email || !workspaceId) return;
    setLoading(true);
    try {
      await supabase.from('invitations').insert({
        workspace_id: workspaceId,
        email,
        role: 'member',
        token: Math.random().toString(36).substring(2, 15),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      setSent([...sent, email]);
      setEmail('');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-ivory text-[22px] font-semibold mb-2">Invite your team</h2>
      <p className="text-fog text-sm mb-8">They will receive an email to join your workspace.</p>
      <label className={labelCls}>Email address</label>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-midnight border border-white/8 rounded-xl px-4 py-3 text-ivory text-sm outline-none focus:border-white/20"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          type="email"
          title="Team member email"
        />
        <button onClick={handleInvite} disabled={loading || !email} className={primaryBtnCls}>
          Invite
        </button>
      </div>
      {sent.length > 0 && (
        <div className="mb-6">
          {sent.map((e) => (
            <div key={e} className="flex items-center gap-2 text-[#7FA38A] text-[13px] mb-1">
              <Check size={14} /> {e}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3 mt-2">
        <button onClick={onBack} className={ghostBtnCls}><ArrowLeft size={16} /> Back</button>
        <button onClick={onNext} className={primaryBtnCls}>Continue <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

function ClientStep({ onNext, onBack, workspaceId }: { onNext: () => void; onBack: () => void; workspaceId: string }) {
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (company && workspaceId) {
      setLoading(true);
      await supabase.from('clients').insert({ workspace_id: workspaceId, company, contact, email, status: 'active' });
      setLoading(false);
    }
    onNext();
  }

  return (
    <div>
      <h2 className="text-ivory text-[22px] font-semibold mb-2">Add your first client</h2>
      <p className="text-fog text-sm mb-8">You can always add more clients later.</p>
      <label className={labelCls}>Company name</label>
      <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" title="Company name" />
      <label className={labelCls}>Contact name</label>
      <input className={inputCls} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Jane Doe" title="Contact name" />
      <label className={labelCls}>Contact email</label>
      <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" type="email" title="Contact email" />
      <div className="flex gap-3">
        <button onClick={onBack} className={ghostBtnCls}><ArrowLeft size={16} /> Back</button>
        <button onClick={handleNext} disabled={loading} className={primaryBtnCls}>{loading ? 'Saving...' : 'Continue'} <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

function ProjectStep({ onNext, onBack, workspaceId }: { onNext: () => void; onBack: () => void; workspaceId: string }) {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (name && workspaceId) {
      setLoading(true);
      await supabase.from('projects').insert({
        workspace_id: workspaceId,
        name,
        client_name: clientName || 'TBD',
        status: 'active',
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        budget: 0,
      });
      setLoading(false);
    }
    onNext();
  }

  return (
    <div>
      <h2 className="text-ivory text-[22px] font-semibold mb-2">Create your first project</h2>
      <p className="text-fog text-sm mb-8">Get your team aligned from day one.</p>
      <label className={labelCls}>Project name</label>
      <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand Identity Refresh" title="Project name" />
      <label className={labelCls}>Client name</label>
      <input className={inputCls} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Corp" title="Client name" />
      <div className="flex gap-3">
        <button onClick={onBack} className={ghostBtnCls}><ArrowLeft size={16} /> Back</button>
        <button onClick={handleNext} disabled={loading} className={primaryBtnCls}>{loading ? 'Saving...' : 'Finish setup'} <Check size={16} /></button>
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [workspaceId, setWorkspaceId] = useState('');
  const [discoveryChecked, setDiscoveryChecked] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let active = true;

    async function checkOnboardingAndWorkspace() {
      try {
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_responses')
          .select('completed_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (active) {
          if (onboardingError) {
            console.error('Error fetching onboarding completion status:', onboardingError);
            setDiscoveryChecked(true);
          } else if (!onboardingData?.completed_at) {
            router.replace('/onboarding/discover');
            return;
          } else {
            setDiscoveryChecked(true);
          }
        }
      } catch (err) {
        console.error('Error in onboarding completion status query:', err);
        if (active) setDiscoveryChecked(true);
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('workspace_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!active) return;
        if (profileError) { console.error('Error fetching user profile:', profileError); return; }

        if (profile?.workspace_id) {
          setWorkspaceId(profile.workspace_id);
        } else {
          const { data: wsData, error: wsError } = await supabase
            .from('workspaces').select('id').eq('owner_user_id', userId).limit(1);
          if (!active) return;
          if (wsError) { console.error('Error fetching workspaces:', wsError); return; }
          if (wsData && wsData.length > 0) setWorkspaceId(wsData[0].id);
        }
      } catch (err) {
        console.error('Error in user profile query:', err);
      }
    }

    checkOnboardingAndWorkspace();
    return () => { active = false; };
  }, [user, router]);

  if (!discoveryChecked) {
    return (
      <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-ivory animate-spin" />
      </div>
    );
  }

  async function handleComplete() {
    if (user) {
      const { data: onb } = await supabase
        .from('onboarding_responses').select('team_size').eq('user_id', user.id).maybeSingle();
      if (onb?.team_size && workspaceId) {
        await supabase.from('workspaces').update({ team_size: onb.team_size }).eq('id', workspaceId);
      }
      await supabase.from('user_profiles').update({ onboarding_completed: true }).eq('user_id', user.id);
    }
    router.push('/app/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center p-6 relative overflow-hidden">
      <FlickeringGrid
        className="absolute inset-0 z-0"
        color="#ffffff"
        maxOpacity={0.12}
        squareSize={4}
        gridGap={7}
        flickerChance={0.06}
      />
      {/* Radial vignette */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,transparent_20%,#0A0D14_100%)]" />
      <div className="w-full max-w-[520px] relative z-[2]">
        <div className="mb-4">
          <h1 className="text-ivory text-[14px] font-semibold tracking-[2px] uppercase mb-1">Minerva OS</h1>
          <p className="text-fog text-[13px]">Step {step + 1} of {STEPS.length}: {STEPS[step].description}</p>
        </div>
        <ProgressBar current={step} />
        {step === 0 && (
          <WorkspaceStep onNext={(id) => { if (id) setWorkspaceId(id); setStep(1); }} />
        )}
        {step === 1 && <TeamStep onNext={() => setStep(2)} onBack={() => setStep(0)} workspaceId={workspaceId} />}
        {step === 2 && <ClientStep onNext={() => setStep(3)} onBack={() => setStep(1)} workspaceId={workspaceId} />}
        {step === 3 && <ProjectStep onNext={handleComplete} onBack={() => setStep(2)} workspaceId={workspaceId} />}
        {step >= 1 && (
          <button
            onClick={handleComplete}
            title={t.onboarding.skipTooltip}
            className="bg-transparent border-none text-fog text-xs cursor-pointer mt-6 block hover:text-silver transition-colors"
          >
            {t.onboarding.skipForNow}
          </button>
        )}
      </div>
    </div>
  );
}
