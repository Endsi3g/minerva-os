'use client';
import { useState, useEffect } from 'react';
import { User, Building2, Users, Bell, Shield, Check, Lock, Download } from 'lucide-react';
import { useLang, type Lang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
// Convex removed — Supabase is used instead.
import { supabase } from '@/lib/supabase';
import { MOCK_CLIENTS, MOCK_PROJECTS, MOCK_INVOICES } from '@/lib/mock-data';
const IS_TEST = process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === '1';

const MOCK_USER_PROFILE = { id: 'demo-user-id', name: 'Alex Martin', email: 'demo@uprisingstudio.com', role: 'owner', avatar: null, onboardingCompleted: true };
const MOCK_WORKSPACE = { id: 'mock-ws', name: 'Uprising Studio', _id: 'mock-ws' };

/* ── Types ───────────────────────────────────────────────────────────────── */

type Tab = 'profile' | 'workspace' | 'team' | 'notifications' | 'security' | 'privacy';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'Uprising Studio', email: 'studio@uprising.co', role: 'owner', initials: 'US' },
  { id: '2', name: 'Camille Dufresne', email: 'camille@uprising.co', role: 'project_manager', initials: 'CD' },
  { id: '3', name: 'Jordan Belfort', email: 'jordan@uprising.co', role: 'designer', initials: 'JB' },
  { id: '4', name: 'Priya Sharma', email: 'priya@uprising.co', role: 'developer', initials: 'PS' },
];

/* ── Sub-sections ────────────────────────────────────────────────────────── */

function ProfileTab() {
  const { t, setLang, lang } = useLang();
  const { user } = useAuth();
  const s = t.app.settings.profile;
  const ws = t.app.settings.workspace;
  const [name, setName] = useState(user?.name ?? 'Uprising Studio');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (IS_TEST) {
      setProfile({ ...MOCK_USER_PROFILE, _id: MOCK_USER_PROFILE.id, avatar_url: null });
      setName(MOCK_USER_PROFILE.name);
      return;
    }
    if (!user?.email) return;
    supabase
      .from('user_profiles')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({ ...data, _id: data.id, avatar: data.avatar_url });
          if (data.name) setName(data.name);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        }
      });
  }, [user]);

  async function handleSave() {
    if (IS_TEST) {
      setProfile((prev: any) => ({ ...prev, name, avatar_url: avatarUrl.trim() || null }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    if (profile?._id) {
      await supabase
        .from('user_profiles')
        .update({
          name,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq('id', profile._id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?._id || Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);

      // Save immediately to profile
      if (profile?._id) {
        await supabase
          .from('user_profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile._id);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setUploading(false);
    }
  }

  const roleLabels = t.app.settings.team.roles as Record<string, string>;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Section title={s.heading} subtitle={s.subtitle}>
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center text-lg font-semibold shrink-0 overflow-hidden"
          style={{ backgroundColor: '#1A1F32', color: '#F5F1E8', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : initials}
        </div>
        <div>
          <p className="text-sm font-medium text-ivory">{name}</p>
          <p className="text-xs text-fog mt-0.5">{user?.email ?? 'studio@uprising.co'}</p>
          {user?.role && (
            <span
              className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(127,163,138,0.12)', color: '#7FA38A', border: '1px solid rgba(127,163,138,0.2)' }}
            >
              {roleLabels[user.role] ?? user.role}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <SettingsField label={s.displayName}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
            style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }}
          />
        </SettingsField>

        <SettingsField label={s.avatarUrl}>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
              className="text-xs text-silver file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ivory file:text-obsidian hover:file:opacity-90 file:cursor-pointer disabled:opacity-50"
            />
            {uploading && <p className="text-xs text-fog">Uploading...</p>}
            {avatarUrl && (
              <p className="text-[10px] text-fog truncate">URL: {avatarUrl}</p>
            )}
          </div>
        </SettingsField>

        <SettingsField label={s.email}>
          <input
            type="email"
            value={user?.email ?? 'studio@uprising.co'}
            readOnly
            className="w-full rounded-xl h-10 px-3 text-sm opacity-50 cursor-not-allowed"
            style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }}
          />
        </SettingsField>

        <SettingsField label={ws.language}>
          <div className="flex gap-2">
            {(['en', 'fr'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'flex-1 h-10 rounded-xl text-sm font-medium transition-all',
                  lang === l ? 'text-obsidian' : 'text-silver hover:text-ivory'
                )}
                style={
                  lang === l
                    ? { backgroundColor: '#F5F1E8' }
                    : { backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {l === 'en' ? ws.langEn : ws.langFr}
              </button>
            ))}
          </div>
        </SettingsField>

        <SaveButton label={saved ? s.saved : s.saveChanges} saved={saved} onClick={handleSave} />
      </div>
    </Section>
  );
}

function WorkspaceTab() {
  const { t, setLang, lang } = useLang();
  const s = t.app.settings.workspace;
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [studioName, setStudioName] = useState('Uprising Studio');
  const [timezone, setTimezone] = useState('America/Montreal');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (IS_TEST) {
      setWorkspaces([MOCK_WORKSPACE]);
      setStudioName(MOCK_WORKSPACE.name);
      return;
    }
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setWorkspaces(data.map(w => ({ ...w, _id: w.id })));
        setStudioName(data[0].name ?? 'Uprising Studio');
        setTimezone(data[0].settings?.timezone ?? 'America/Montreal');
      }
    });
  }, []);

  const workspaceId = workspaces[0]?._id;
  const currentWorkspace = workspaces[0];

  async function handleSave() {
    if (IS_TEST) {
      setWorkspaces(prev => prev.map(w => w._id === workspaceId ? { ...w, name: studioName } : w));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    if (workspaceId && currentWorkspace) {
      await supabase
        .from('workspaces')
        .update({
          name: studioName,
          settings: {
            ...currentWorkspace.settings,
            timezone,
            language: lang,
          },
        })
        .eq('id', workspaceId);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Section title={s.heading} subtitle={s.subtitle}>
      <div className="space-y-4 max-w-md">
        <SettingsField label={s.studioName}>
          <input
            type="text"
            value={studioName}
            onChange={e => setStudioName(e.target.value)}
            className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
            style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }}
          />
        </SettingsField>

        <SettingsField label={s.timezone}>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all appearance-none"
            style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }}
          >
            <option value="America/Montreal">Montreal (ET)</option>
            <option value="America/Toronto">Toronto (ET)</option>
            <option value="America/Vancouver">Vancouver (PT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="America/New_York">New York (ET)</option>
          </select>
        </SettingsField>

        <SettingsField label={s.language}>
          <div className="flex gap-2">
            {(['en', 'fr'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'flex-1 h-10 rounded-xl text-sm font-medium transition-all',
                  lang === l
                    ? 'text-obsidian'
                    : 'text-silver hover:text-ivory'
                )}
                style={
                  lang === l
                    ? { backgroundColor: '#F5F1E8' }
                    : { backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {l === 'en' ? s.langEn : s.langFr}
              </button>
            ))}
          </div>
        </SettingsField>

        <SaveButton label={saved ? s.saved : s.saveChanges} saved={saved} onClick={handleSave} />
      </div>
    </Section>
  );
}

function TeamTab() {
  const { t } = useLang();
  const s = t.app.settings.team;
  const roleLabels = s.roles as Record<string, string>;
  const [inviteEmail, setInviteEmail] = useState('');
  const [invited, setInvited] = useState(false);

  function handleInvite() {
    if (!inviteEmail) return;
    setInvited(true);
    setInviteEmail('');
    setTimeout(() => setInvited(false), 3000);
  }

  return (
    <Section title={s.heading} subtitle={s.subtitle}>
      {/* Invite bar */}
      <div className="flex gap-2 mb-6 max-w-md">
        <input
          type="email"
          placeholder={s.invitePlaceholder}
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInvite()}
          className="flex-1 rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-white/20"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }}
        />
        <button
          onClick={handleInvite}
          className="px-4 h-10 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] shrink-0"
          style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
        >
          {invited ? <Check size={14} /> : s.inviteButton}
        </button>
      </div>

      {/* Member list */}
      <div className="space-y-2 max-w-lg">
        {MOCK_TEAM.map(member => (
          <div
            key={member.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ backgroundColor: '#1A1F32', color: '#B8BDC7' }}
            >
              {member.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ivory truncate">{member.name}</p>
              <p className="text-xs text-fog truncate">{member.email}</p>
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#8A9099' }}
            >
              {roleLabels[member.role] ?? member.role}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function NotificationsTab() {
  const { t } = useLang();
  const s = t.app.settings.notifications;

  const prefs = [
    { key: 'projectUpdates', label: s.projectUpdates, desc: s.projectUpdatesDesc, default: true },
    { key: 'approvalRequests', label: s.approvalRequests, desc: s.approvalRequestsDesc, default: true },
    { key: 'invoiceActivity', label: s.invoiceActivity, desc: s.invoiceActivityDesc, default: true },
    { key: 'riskAlerts', label: s.riskAlerts, desc: s.riskAlertsDesc, default: true },
  ];

  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(prefs.map(p => [p.key, p.default]))
  );

  return (
    <Section title={s.heading} subtitle={s.subtitle}>
      <div className="space-y-2 max-w-lg">
        {prefs.map(pref => (
          <div
            key={pref.key}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-colors hover:bg-white/[0.02]"
            style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
            onClick={() => setEnabled(prev => ({ ...prev, [pref.key]: !prev[pref.key] }))}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ivory">{pref.label}</p>
              <p className="text-xs text-fog mt-0.5">{pref.desc}</p>
            </div>
            <Toggle on={enabled[pref.key]} />
          </div>
        ))}
      </div>
    </Section>
  );
}

function SecurityTab() {
  const { t } = useLang();
  const s = t.app.settings.security;
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  function handleUpdatePassword() {
    if (!currentPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    setPwError('');
    setPwSaved(true);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => setPwSaved(false), 2500);
  }

  return (
    <Section title={s.heading} subtitle={s.subtitle}>
      <div className="space-y-6 max-w-md">
        {/* Change password */}
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm font-semibold text-ivory">{s.changePassword}</p>
          <SettingsField label={s.currentPassword}>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20" style={{ backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }} />
          </SettingsField>
          <SettingsField label={s.newPassword}>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20" style={{ backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }} />
          </SettingsField>
          <SettingsField label={s.confirmPassword}>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20" style={{ backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8' }} />
          </SettingsField>
          {pwError && <p className="text-xs" style={{ color: '#A86A6A' }}>{pwError}</p>}
          <SaveButton label={pwSaved ? 'Updated.' : s.updatePassword} saved={pwSaved} onClick={handleUpdatePassword} />
        </div>

        {/* 2FA */}
        <div
          className="rounded-2xl p-5 space-y-2"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ivory">{s.twoFactor}</p>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(184,155,106,0.12)', color: '#B89B6A', border: '1px solid rgba(184,155,106,0.2)' }}
            >
              {s.comingSoon}
            </span>
          </div>
          <p className="text-xs text-fog">{s.twoFactorDesc}</p>
          <button
            disabled
            className="mt-2 h-9 px-4 rounded-xl text-sm font-medium opacity-40 cursor-not-allowed"
            style={{ backgroundColor: '#1A1F32', color: '#B8BDC7', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {s.enable2fa}
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ── Shared primitives ───────────────────────────────────────────────────── */

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-ivory">{title}</h2>
        <p className="text-xs text-fog mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-silver">{label}</label>
      {children}
    </div>
  );
}

function SaveButton({ label, saved, onClick }: { label: string; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
      style={
        saved
          ? { backgroundColor: 'rgba(127,163,138,0.15)', color: '#7FA38A', border: '1px solid rgba(127,163,138,0.25)' }
          : { backgroundColor: '#F5F1E8', color: '#0A0D14' }
      }
    >
      {saved && <Check size={13} />}
      {label}
    </button>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className={cn('w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0', on ? 'bg-sage' : 'bg-white/10')}
    >
      <div
        className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200', on ? 'translate-x-4' : 'translate-x-0.5')}
      />
    </div>
  );
}

/* ── Privacy / GDPR Tab ──────────────────────────────────────────────────── */

function PrivacyTab() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const workspaceId = workspaces[0]?.id;

  useEffect(() => {
    if (IS_TEST) {
      setWorkspaces([MOCK_WORKSPACE]);
      setClients(MOCK_CLIENTS.map(c => ({ ...c, _id: c.id })));
      setProjects(MOCK_PROJECTS.map(p => ({ ...p, _id: p.id })));
      setInvoices(MOCK_INVOICES.map(i => ({ ...i, _id: i.id })));
      return;
    }
    async function loadData() {
      const { data: ws } = await supabase.from('workspaces').select('*');
      if (ws) {
        setWorkspaces(ws);
        const workspaceId = ws[0]?.id;
        if (workspaceId) {
          const { data: cl } = await supabase.from('clients').select('*').eq('workspace_id', workspaceId);
          if (cl) setClients(cl);

          const { data: pr } = await supabase.from('projects').select('*').eq('workspace_id', workspaceId);
          if (pr) setProjects(pr);

          const { data: inv } = await supabase.from('invoices').select('*').eq('workspace_id', workspaceId);
          if (inv) setInvoices(inv);
        }
      }
    }
    loadData();
  }, []);

  function handleExport() {
    setExporting(true);
    const data = {
      exportedAt: new Date().toISOString(),
      workspace: workspaces[0] ?? null,
      clients,
      projects,
      invoices,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minerva-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  }

  return (
    <Section title="Privacy & Data" subtitle="Manage your data and compliance settings.">
      <div className="space-y-4 max-w-md">
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <p className="text-sm font-semibold text-ivory mb-0.5">Export your data</p>
            <p className="text-xs text-fog">Download a complete JSON export of your workspace data (clients, projects, invoices).</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || !workspaceId}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: exported ? 'rgba(127,163,138,0.15)' : 'rgba(255,255,255,0.05)', color: exported ? '#7FA38A' : '#B8BDC7', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {exported ? <Check size={14} /> : <Download size={14} />}
            {exported ? 'Export downloaded' : exporting ? 'Preparing...' : 'Download JSON export'}
          </button>
        </div>

        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm font-semibold text-ivory">Data retention</p>
          <p className="text-xs text-fog leading-relaxed">
            Your workspace data is retained indefinitely while your account is active.
            Deleted records are permanently removed within 30 days.
          </p>
        </div>

        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ backgroundColor: 'rgba(168,106,106,0.05)', border: '1px solid rgba(168,106,106,0.2)' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#A86A6A' }}>Delete workspace</p>
          <p className="text-xs text-fog leading-relaxed">
            Permanently delete your workspace and all associated data. This action cannot be undone.
            Contact support to initiate account deletion.
          </p>
          <button
            disabled
            className="h-9 px-4 rounded-xl text-sm font-medium opacity-40 cursor-not-allowed"
            style={{ backgroundColor: 'rgba(168,106,106,0.15)', color: '#A86A6A', border: '1px solid rgba(168,106,106,0.2)' }}
          >
            Request deletion
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

const TAB_ICONS: Record<Tab, React.ElementType> = {
  profile: User,
  workspace: Building2,
  team: Users,
  notifications: Bell,
  security: Shield,
  privacy: Lock,
};

export default function AppSettings() {
  const { t } = useLang();
  const s = t.app.settings;
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile',       label: s.tabs.profile },
    { id: 'workspace',     label: s.tabs.workspace },
    { id: 'team',          label: s.tabs.team },
    { id: 'notifications', label: s.tabs.notifications },
    { id: 'security',      label: s.tabs.security },
    { id: 'privacy',       label: 'Privacy' },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ivory">{s.title}</h1>
        <p className="text-sm text-fog mt-1">{s.subtitle}</p>
      </div>

      <div className="flex gap-6">
        {/* Tab nav */}
        <nav className="w-44 shrink-0 space-y-0.5">
          {tabs.map(tab => {
            const Icon = TAB_ICONS[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  activeTab === tab.id
                    ? 'bg-white/[0.07] text-ivory'
                    : 'text-fog hover:text-silver hover:bg-white/[0.03]'
                )}
              >
                <Icon size={14} className="shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile'       && <ProfileTab />}
          {activeTab === 'workspace'     && <WorkspaceTab />}
          {activeTab === 'team'          && <TeamTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'security'      && <SecurityTab />}
          {activeTab === 'privacy'       && <PrivacyTab />}
        </div>
      </div>
    </div>
  );
}
