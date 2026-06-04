'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { useAuth } from '@/contexts/AuthContext';

const STEPS = [
  { id: 'workspace', label: 'Workspace', description: 'Set up your workspace identity' },
  { id: 'team', label: 'Team', description: 'Invite your first team members' },
  { id: 'client', label: 'Client', description: 'Add your first client' },
  { id: 'project', label: 'Project', description: 'Create your first project' },
];

function ProgressBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 48 }}>
      {STEPS.map((step, i) => (
        <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: i < current ? '#7FA38A' : i === current ? '#F5F1E8' : 'rgba(255,255,255,0.08)',
            color: i < current ? '#0A0D14' : i === current ? '#0A0D14' : '#8A9099',
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0,
            transition: 'all 0.3s ease',
          }}>
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              flex: 1,
              height: 1,
              backgroundColor: i < current ? '#7FA38A' : 'rgba(255,255,255,0.08)',
              margin: '0 8px',
              transition: 'background-color 0.3s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#111522',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '12px 16px',
  color: '#F5F1E8',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  color: '#B8BDC7',
  fontSize: 13,
  display: 'block',
  marginBottom: 6,
};

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
          await supabase
            .from('user_profiles')
            .update({ workspace_id: ws.id })
            .eq('user_id', user.id);
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
      <h2 style={{ color: '#F5F1E8', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Name your workspace</h2>
      <p style={{ color: '#8A9099', fontSize: 14, marginBottom: 32 }}>This is how your workspace will appear to your team and clients.</p>
      <label style={labelStyle}>Workspace name</label>
      <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Uprising Studio" />
      <button onClick={handleNext} disabled={loading} style={primaryBtn}>
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
      <h2 style={{ color: '#F5F1E8', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Invite your team</h2>
      <p style={{ color: '#8A9099', fontSize: 14, marginBottom: 32 }}>They will receive an email to join your workspace.</p>
      <label style={labelStyle}>Email address</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input style={{ ...inputStyle, marginBottom: 0, flex: 1 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@example.com" type="email" />
        <button onClick={handleInvite} disabled={loading || !email} style={{ ...primaryBtn, flexShrink: 0, marginBottom: 0 }}>
          Invite
        </button>
      </div>
      {sent.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {sent.map((e) => (
            <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7FA38A', fontSize: 13, marginBottom: 4 }}>
              <Check size={14} /> {e}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={onBack} style={ghostBtn}><ArrowLeft size={16} /> Back</button>
        <button onClick={onNext} style={primaryBtn}>Continue <ArrowRight size={16} /></button>
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
      await supabase.from('clients').insert({
        workspace_id: workspaceId,
        company,
        contact,
        email,
        status: 'active',
      });
      setLoading(false);
    }
    onNext();
  }

  return (
    <div>
      <h2 style={{ color: '#F5F1E8', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Add your first client</h2>
      <p style={{ color: '#8A9099', fontSize: 14, marginBottom: 32 }}>You can always add more clients later.</p>
      <label style={labelStyle}>Company name</label>
      <input style={inputStyle} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" />
      <label style={labelStyle}>Contact name</label>
      <input style={inputStyle} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Jane Doe" />
      <label style={labelStyle}>Contact email</label>
      <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" type="email" />
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={ghostBtn}><ArrowLeft size={16} /> Back</button>
        <button onClick={handleNext} disabled={loading} style={primaryBtn}>{loading ? 'Saving...' : 'Continue'} <ArrowRight size={16} /></button>
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
      <h2 style={{ color: '#F5F1E8', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Create your first project</h2>
      <p style={{ color: '#8A9099', fontSize: 14, marginBottom: 32 }}>Get your team aligned from day one.</p>
      <label style={labelStyle}>Project name</label>
      <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand Identity Refresh" />
      <label style={labelStyle}>Client name</label>
      <input style={inputStyle} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Corp" />
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={ghostBtn}><ArrowLeft size={16} /> Back</button>
        <button onClick={handleNext} disabled={loading} style={primaryBtn}>{loading ? 'Saving...' : 'Finish setup'} <Check size={16} /></button>
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  backgroundColor: '#F5F1E8',
  color: '#0A0D14',
  border: 'none',
  borderRadius: 12,
  padding: '12px 24px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: 0,
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  backgroundColor: 'transparent',
  color: '#B8BDC7',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: '12px 24px',
  fontSize: 14,
  cursor: 'pointer',
};

export function OnboardingWizard() {
  const router = useRouter();
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
        // Gate: ensure discovery onboarding was completed first
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_responses')
          .select('completed_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (active) {
          if (onboardingError) {
            console.error("Error fetching onboarding completion status:", onboardingError);
            setDiscoveryChecked(true);
          } else if (!onboardingData?.completed_at) {
            router.replace('/onboarding/discover');
            return;
          } else {
            setDiscoveryChecked(true);
          }
        }
      } catch (err) {
        console.error("Error in onboarding completion status query:", err);
        if (active) setDiscoveryChecked(true);
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('workspace_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!active) return;
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          return;
        }

        if (profile?.workspace_id) {
          setWorkspaceId(profile.workspace_id);
        } else {
          const { data: wsData, error: wsError } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_user_id', userId)
            .limit(1);

          if (!active) return;
          if (wsError) {
            console.error("Error fetching workspaces:", wsError);
            return;
          }
          if (wsData && wsData.length > 0) {
            setWorkspaceId(wsData[0].id);
          }
        }
      } catch (err) {
        console.error("Error in user profile query:", err);
      }
    }

    checkOnboardingAndWorkspace();

    return () => {
      active = false;
    };
  }, [user, router]);

  if (!discoveryChecked) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A0D14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#F5F1E8', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  async function handleComplete() {
    if (user) {
      const { data: onb } = await supabase
        .from('onboarding_responses')
        .select('team_size')
        .eq('user_id', user.id)
        .maybeSingle();

      if (onb?.team_size && workspaceId) {
        await supabase
          .from('workspaces')
          .update({ team_size: onb.team_size })
          .eq('id', workspaceId);
      }

      await supabase
        .from('user_profiles')
        .update({ onboarding_complete: true })
        .eq('user_id', user.id);
    }
    router.push('/app/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0D14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Flickering grid background */}
      <FlickeringGrid
        className="absolute inset-0 z-0"
        color="#ffffff"
        maxOpacity={0.12}
        squareSize={4}
        gridGap={7}
        flickerChance={0.06}
      />
      {/* Radial vignette */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, #0A0D14 100%)',
        }}
      />
      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 2 }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ color: '#F5F1E8', fontSize: 14, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            Minerva OS
          </h1>
          <p style={{ color: '#8A9099', fontSize: 13 }}>Step {step + 1} of {STEPS.length}: {STEPS[step].description}</p>
        </div>
        <ProgressBar current={step} />
        {step === 0 && (
          <WorkspaceStep
            onNext={(id) => {
              if (id) setWorkspaceId(id);
              setStep(1);
            }}
          />
        )}
        {step === 1 && <TeamStep onNext={() => setStep(2)} onBack={() => setStep(0)} workspaceId={workspaceId} />}
        {step === 2 && <ClientStep onNext={() => setStep(3)} onBack={() => setStep(1)} workspaceId={workspaceId} />}
        {step === 3 && <ProjectStep onNext={handleComplete} onBack={() => setStep(2)} workspaceId={workspaceId} />}
        <button
          onClick={handleComplete}
          style={{ background: 'none', border: 'none', color: '#8A9099', fontSize: 12, cursor: 'pointer', marginTop: 24, display: 'block' }}
        >
          Skip setup
        </button>
      </div>
    </div>
  );
}
