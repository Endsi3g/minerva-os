'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';

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

function WorkspaceStep({ onNext, workspaceId }: { onNext: () => void; workspaceId: string }) {
  const updateWorkspace = useMutation(api.workspaces.update);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    setLoading(true);
    if (name && workspaceId) {
      await updateWorkspace({ id: workspaceId as Parameters<typeof updateWorkspace>[0]['id'], name });
    }
    setLoading(false);
    onNext();
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
  const createInvitation = useMutation(api.invitations.create);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!email || !workspaceId) return;
    setLoading(true);
    try {
      await createInvitation({ workspaceId: workspaceId as Parameters<typeof createInvitation>[0]['workspaceId'], email, role: 'member' });
      setSent([...sent, email]);
      setEmail('');
    } catch { /* ignore */ }
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
  const addClient = useMutation(api.clients.add);
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (company && workspaceId) {
      setLoading(true);
      await addClient({ workspaceId: workspaceId as Parameters<typeof addClient>[0]['workspaceId'], company, contact, email, status: 'active' });
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
  const addProject = useMutation(api.projects.add);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (name && workspaceId) {
      setLoading(true);
      await addProject({
        workspaceId: workspaceId as Parameters<typeof addProject>[0]['workspaceId'],
        name,
        clientName: clientName || 'TBD',
        status: 'active',
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
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
  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id ?? '';

  function handleComplete() {
    router.push('/app/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0D14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ color: '#F5F1E8', fontSize: 14, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            Minerva OS
          </h1>
          <p style={{ color: '#8A9099', fontSize: 13 }}>Step {step + 1} of {STEPS.length}: {STEPS[step].description}</p>
        </div>
        <ProgressBar current={step} />
        {step === 0 && <WorkspaceStep onNext={() => setStep(1)} workspaceId={workspaceId} />}
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
