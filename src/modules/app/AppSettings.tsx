'use client';
import { useState, useEffect } from 'react';
import { Check, Download, Minus } from 'lucide-react';
import { useLang, type Lang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
// Convex removed — Supabase is used instead.
import { supabase } from '@/lib/supabase';
import { DirectionAwareTabs } from '@/components/ui/direction-aware-tabs';
import { TextAnimate } from '@/components/ui/text-animate';
import { useTier } from '@/lib/hooks/useTier';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { UpgradeModal, TIER_BADGE_COLORS } from '@/components/minerva/UpgradeModal';
import { isFeatureVisibleForTier } from '@/lib/tier';
import type { FeatureKey, WorkspaceTier } from '@/lib/types';

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start w-full">
        {/* Left Column - Avatar & Info Card */}
        <div className="md:col-span-1 rounded-2xl p-6 bg-midnight border border-border flex flex-col items-center text-center space-y-4">
          <div
            className="h-24 w-24 rounded-2xl flex items-center justify-center text-2xl font-semibold shrink-0 overflow-hidden"
            style={{ backgroundColor: 'var(--dusk)', color: 'var(--ivory)', border: '1px solid var(--border)' }}
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
                className="inline-block mt-2.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(127,163,138,0.12)', color: '#7FA38A', border: '1px solid rgba(127,163,138,0.2)' }}
              >
                {roleLabels[user.role] ?? user.role}
              </span>
            )}
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="md:col-span-2 space-y-4 w-full">
          <SettingsField label={s.displayName}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all bg-midnight border border-border text-foreground"
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
              className="w-full rounded-xl h-10 px-3 text-sm opacity-50 cursor-not-allowed bg-midnight border border-border text-foreground"
            />
          </SettingsField>

          <SettingsField label={ws.language}>
            <div className="flex gap-2">
              {(['en', 'fr'] as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    'flex-1 h-10 rounded-xl text-sm font-medium transition-all border',
                    lang === l
                      ? 'bg-ivory border-transparent text-obsidian'
                      : 'bg-midnight border-border text-silver hover:text-ivory'
                  )}
                >
                  {l === 'en' ? ws.langEn : ws.langFr}
                </button>
              ))}
            </div>
          </SettingsField>

          <div className="pt-2">
            <SaveButton label={saved ? s.saved : s.saveChanges} saved={saved} onClick={handleSave} />
          </div>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start w-full">
        {/* Left Column - Info Card */}
        <div className="md:col-span-1 rounded-2xl p-6 bg-midnight border border-border space-y-3">
          <h4 className="text-sm font-semibold text-ivory">Studio Details</h4>
          <p className="text-xs text-fog leading-relaxed">
            Configure your global studio workspace variables. These settings apply to all active projects, invoices, and operations.
          </p>
        </div>

        {/* Right Column - Form */}
        <div className="md:col-span-2 space-y-4 w-full">
          <SettingsField label={s.studioName}>
            <input
              type="text"
              value={studioName}
              onChange={e => setStudioName(e.target.value)}
              className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all bg-midnight border border-border text-foreground"
            />
          </SettingsField>

          <SettingsField label={s.timezone}>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all appearance-none bg-midnight border border-border text-foreground"
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
                    'flex-1 h-10 rounded-xl text-sm font-medium transition-all border',
                    lang === l
                      ? 'bg-ivory border-transparent text-obsidian'
                      : 'bg-midnight border-border text-silver hover:text-ivory'
                  )}
                >
                  {l === 'en' ? s.langEn : s.langFr}
                </button>
              ))}
            </div>
          </SettingsField>

          <div className="pt-2">
            <SaveButton label={saved ? s.saved : s.saveChanges} saved={saved} onClick={handleSave} />
          </div>
        </div>
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

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('workspaces').select('id').limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setWorkspaceId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    async function fetchMembers() {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (data) {
        setMembers(data);
      }
    }
    fetchMembers();
  }, [workspaceId]);

  async function handleInvite() {
    if (!inviteEmail || !workspaceId) return;
    try {
      const { error } = await supabase.from('invitations').insert({
        workspace_id: workspaceId,
        email: inviteEmail,
        role: 'member',
        token: Math.random().toString(36).substring(2, 15),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      if (error) throw error;
      setInvited(true);
      setInviteEmail('');
      setTimeout(() => setInvited(false), 3000);
    } catch (err) {
      console.error('Failed to send invite:', err);
    }
  }

  return (
    <Section title={s.heading} subtitle={s.subtitle}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start w-full">
        {/* Left Column - Invite Form */}
        <div className="md:col-span-1 rounded-2xl p-6 bg-midnight border border-border space-y-4">
          <h4 className="text-sm font-semibold text-ivory">{s.inviteButton}</h4>
          <p className="text-xs text-fog leading-relaxed">
            Invite new collaborators to your studio. Invited users will receive an email with a secure registration link.
          </p>
          <div className="space-y-2">
            <input
              type="email"
              placeholder={s.invitePlaceholder}
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-white/20 bg-obsidian border border-border text-foreground"
            />
            <button
              onClick={handleInvite}
              className="w-full h-10 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center bg-ivory text-obsidian"
            >
              {invited ? <Check size={14} /> : s.inviteButton}
            </button>
          </div>
        </div>

        {/* Right Column - Member List */}
        <div className="md:col-span-2 space-y-2 w-full">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-fog px-1 mb-2">Team Members</h4>
          {members.map(member => {
            const initials = (member.name || '')
              .split(' ')
              .map((w: string) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'U';
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-midnight border border-border"
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ backgroundColor: 'var(--dusk)', color: 'var(--silver)' }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ivory truncate">{member.name}</p>
                  <p className="text-xs text-fog truncate">{member.email}</p>
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--muted)', color: 'var(--fog)' }}
                >
                  {roleLabels[member.role] ?? member.role}
                </span>
              </div>
            );
          })}
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {prefs.map(pref => (
          <div
            key={pref.key}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-colors hover:bg-white/[0.02] bg-midnight border border-border"
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

  async function handleUpdatePassword() {
    if (!currentPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    setPwError('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwSaved(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password.');
    }
  }

  return (
    <Section title={s.heading} subtitle={s.subtitle}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full">
        {/* Change password */}
        <div
          className="rounded-2xl p-5 space-y-3 bg-midnight border border-border"
        >
          <p className="text-sm font-semibold text-ivory">{s.changePassword}</p>
          <SettingsField label={s.currentPassword}>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20 bg-obsidian border border-border text-foreground" />
          </SettingsField>
          <SettingsField label={s.newPassword}>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20 bg-obsidian border border-border text-foreground" />
          </SettingsField>
          <SettingsField label={s.confirmPassword}>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20 bg-obsidian border border-border text-foreground" />
          </SettingsField>
          {pwError && <p className="text-xs text-ember">{pwError}</p>}
          <div className="pt-2">
            <SaveButton label={pwSaved ? 'Updated.' : s.updatePassword} saved={pwSaved} onClick={handleUpdatePassword} />
          </div>
        </div>

        {/* 2FA */}
        <div
          className="rounded-2xl p-5 space-y-2 bg-midnight border border-border"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ivory">{s.twoFactor}</p>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-warm/10 text-warm border border-warm/20"
            >
              {s.comingSoon}
            </span>
          </div>
          <p className="text-xs text-fog leading-relaxed">{s.twoFactorDesc}</p>
          <button
            disabled
            className="mt-2 h-9 px-4 rounded-xl text-sm font-medium opacity-40 cursor-not-allowed bg-dusk text-silver border border-border"
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
        <TextAnimate text={title} type="fadeIn" className="text-base font-semibold text-ivory" />
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
      className={cn(
        "flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] border",
        saved
          ? "bg-sage/15 border-sage/20 text-sage"
          : "bg-ivory border-transparent text-obsidian"
      )}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full">
        {/* Left Column */}
        <div
          className="rounded-2xl p-5 space-y-4 bg-midnight border border-border"
        >
          <div>
            <p className="text-sm font-semibold text-ivory mb-0.5">Export your data</p>
            <p className="text-xs text-fog">Download a complete JSON export of your workspace data (clients, projects, invoices).</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || !workspaceId}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-colors border",
              exported
                ? "bg-sage/15 border-sage/20 text-sage"
                : "bg-dusk border-border text-silver"
            )}
          >
            {exported ? <Check size={14} /> : <Download size={14} />}
            {exported ? 'Export downloaded' : exporting ? 'Preparing...' : 'Download JSON export'}
          </button>
        </div>

        {/* Right Column */}
        <div className="space-y-4 w-full">
          <div
            className="rounded-2xl p-5 space-y-3 bg-midnight border border-border"
          >
            <p className="text-sm font-semibold text-ivory">Data retention</p>
            <p className="text-xs text-fog leading-relaxed">
              Your workspace data is retained indefinitely while your account is active.
              Deleted records are permanently removed within 30 days.
            </p>
          </div>

          <div
            className="rounded-2xl p-5 space-y-3 bg-ember/5 border border-ember/20"
          >
            <p className="text-sm font-semibold text-ember">Delete workspace</p>
            <p className="text-xs text-fog leading-relaxed">
              Permanently delete your workspace and all associated data. This action cannot be undone.
              Contact support to initiate account deletion.
            </p>
            <button
              disabled
              className="h-9 px-4 rounded-xl text-sm font-medium opacity-40 cursor-not-allowed bg-ember/15 text-ember border border-ember/20"
            >
              Request deletion
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── Plan tab ────────────────────────────────────────────────────────────── */

const FEATURE_GROUPS: { label: string; keys: FeatureKey[] }[] = [
  { label: 'Revenue',      keys: ['pipeline', 'proposals'] },
  { label: 'Delivery',     keys: ['workflows', 'time_tracking', 'resources'] },
  { label: 'Finance',      keys: ['finance_hub', 'expenses', 'profitability'] },
  { label: 'Intelligence', keys: ['intelligence', 'reports', 'scorecards', 'nps', 'knowledge'] },
  { label: 'Admin',        keys: ['support_hub', 'marketplace', 'agent_ops'] },
];

const TIERS: WorkspaceTier[] = ['starter', 'growth', 'scale'];

const NEXT_TIER: Record<WorkspaceTier, WorkspaceTier | null> = {
  starter: 'growth',
  growth: 'scale',
  scale: null,
};

function PlanTab() {
  const { t } = useLang();
  const { tier } = useTier();
  const { workspace } = useWorkspace();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const u = t.upgrade;
  const next = NEXT_TIER[tier];
  const tierColors = TIER_BADGE_COLORS[tier];
  const upgradeFeatureKey: FeatureKey = next === 'scale' ? 'agent_ops' : 'intelligence';

  return (
    <div className="space-y-8 w-full">
      {/* Current plan card */}
      <div
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs text-fog uppercase tracking-widest">{u.plan.current}</p>
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-semibold px-3 py-1.5 rounded-full capitalize"
            style={tierColors}
          >
            {tier}
          </span>
          {workspace?.teamSize && (
            <span className="text-sm text-silver">{workspace.teamSize} people</span>
          )}
          {workspace?.agencyType && (
            <span className="text-sm text-fog capitalize">{workspace.agencyType.replace('_', ' ')}</span>
          )}
        </div>
        {next && (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="self-start h-9 px-5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
          >
            {u.plan.upgrade.replace('{tier}', next)}
          </button>
        )}
      </div>

      {/* Feature comparison table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Header row */}
        <div
          className="grid grid-cols-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest"
          style={{ backgroundColor: '#0E1119', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-fog">Feature</span>
          {TIERS.map(t => (
            <span
              key={t}
              className="text-center capitalize"
              style={{ color: tier === t ? TIER_BADGE_COLORS[t].color : '#8A9099' }}
            >
              {t}
            </span>
          ))}
        </div>

        {FEATURE_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {/* Group header */}
            <div
              className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-fog"
              style={{
                backgroundColor: '#0E1119',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderTop: gi > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined,
              }}
            >
              {group.label}
            </div>
            {group.keys.map((key, ki) => (
              <div
                key={key}
                className="grid grid-cols-4 px-5 py-3 text-sm items-center"
                style={{
                  backgroundColor: ki % 2 === 0 ? '#111522' : '#0E1119',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span className="text-silver text-[13px]">
                  {(u.plan.featureLabels as Record<string, string>)[key]}
                </span>
                {TIERS.map(t => {
                  const included = isFeatureVisibleForTier(key, t);
                  return (
                    <div key={t} className="flex justify-center">
                      {included ? (
                        <Check
                          size={14}
                          style={{ color: tier === t ? TIER_BADGE_COLORS[t].color : '#7FA38A' }}
                        />
                      ) : (
                        <Minus size={14} className="text-fog opacity-30" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {next && (
        <UpgradeModal
          featureKey={upgradeFeatureKey}
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

export default function AppSettings() {
  const { t } = useLang();
  const s = t.app.settings;

  const settingsTabs = [
    { id: 0, label: s.tabs.profile,       content: <ProfileTab /> },
    { id: 1, label: s.tabs.workspace,     content: <WorkspaceTab /> },
    { id: 2, label: s.tabs.team,          content: <TeamTab /> },
    { id: 3, label: s.tabs.notifications, content: <NotificationsTab /> },
    { id: 4, label: s.tabs.security,      content: <SecurityTab /> },
    { id: 5, label: 'Privacy',            content: <PrivacyTab /> },
    { id: 6, label: s.tabs.plan,          content: <PlanTab /> },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div>
        <TextAnimate text={s.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
        <p className="text-sm text-fog mt-1">{s.subtitle}</p>
      </div>

      <DirectionAwareTabs tabs={settingsTabs} />
    </div>
  );
}
