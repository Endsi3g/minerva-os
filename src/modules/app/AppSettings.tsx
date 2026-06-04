'use client';
import { useState, useEffect } from 'react';
import { Check, Copy, Download, Minus } from 'lucide-react';
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
import { LockedFeaturePage } from '@/components/minerva/LockedFeaturePage';
import { isFeatureVisibleForTier } from '@/lib/tier';
import type { ApiKey, FeatureKey, WorkspaceTier } from '@/lib/types';

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

const BRAND_PRESETS = [
  { color: '#7FA38A', name: 'Sage' },
  { color: '#B89B6A', name: 'Amber' },
  { color: '#6A8AB8', name: 'Blue' },
  { color: '#9B8AB8', name: 'Mauve' },
  { color: '#8A9099', name: 'Slate' },
];

function WorkspaceTab() {
  const { t, setLang, lang } = useLang();
  const s = t.app.settings.workspace;
  const { workspace, setWorkspaceProfile } = useWorkspace();

  const [wsRow, setWsRow] = useState<any>(null);
  const [studioName, setStudioName] = useState('Uprising Studio');
  const [timezone, setTimezone] = useState('America/Montreal');
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [brandColor, setBrandColor] = useState(workspace?.brandColor ?? '#7FA38A');
  const [customDomain, setCustomDomain] = useState(workspace?.customDomain ?? '');
  const [domainCopied, setDomainCopied] = useState(false);

  useEffect(() => {
    if (!workspace?.id) return;
    supabase.from('workspaces').select('*').eq('id', workspace.id).maybeSingle().then(({ data }) => {
      if (data) {
        setWsRow(data);
        setStudioName(data.name ?? 'Uprising Studio');
        setTimezone(data.settings?.timezone ?? 'America/Montreal');
        setBrandColor(data.branding?.primaryColor ?? data.settings?.brand_color ?? '#7FA38A');
        setCustomDomain(data.settings?.custom_domain ?? '');
      }
    });
  }, [workspace?.id]);

  async function handleSave() {
    if (wsRow?.id) {
      await supabase
        .from('workspaces')
        .update({
          name: studioName,
          settings: {
            ...wsRow.settings,
            timezone,
            language: lang,
            brand_color: brandColor,
            custom_domain: customDomain,
          },
        })
        .eq('id', wsRow.id);
      setWorkspaceProfile({ name: studioName, brandColor, customDomain: customDomain || undefined });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !wsRow?.id) return;
    try {
      setLogoUploading(true);
      const ext = file.name.split('.').pop();
      const fileName = `workspace-${wsRow.id}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('workspaces').update({ logo_url: publicUrl }).eq('id', wsRow.id);
      setWorkspaceProfile({ logoUrl: publicUrl });
    } catch (err) {
      console.error('Logo upload error', err);
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleColorSelect(color: string) {
    setBrandColor(color);
    if (wsRow?.id) {
      await supabase.from('workspaces').update({
        settings: { ...wsRow.settings, brand_color: color },
      }).eq('id', wsRow.id);
      setWorkspaceProfile({ brandColor: color });
    }
  }

  async function handleDomainBlur() {
    if (!wsRow?.id) return;
    await supabase.from('workspaces').update({
      settings: { ...wsRow.settings, custom_domain: customDomain },
    }).eq('id', wsRow.id);
    setWorkspaceProfile({ customDomain: customDomain || undefined });
  }

  function handleCopyDomain() {
    if (!customDomain) return;
    navigator.clipboard.writeText(customDomain).then(() => {
      setDomainCopied(true);
      setTimeout(() => setDomainCopied(false), 2000);
    });
  }

  const [cnameCopied, setCnameCopied] = useState(false);
  function handleCopyCname() {
    navigator.clipboard.writeText(s.dnsCnameValue).then(() => {
      setCnameCopied(true);
      setTimeout(() => setCnameCopied(false), 2000);
    });
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
          {workspace?.logoUrl && (
            <div className="pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={workspace.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
            </div>
          )}
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

          {/* Branding */}
          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-fog">{s.brandingHeading}</h4>

            <SettingsField label="Logo">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={logoUploading}
                className="text-xs text-silver file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ivory file:text-obsidian hover:file:opacity-90 file:cursor-pointer disabled:opacity-50"
              />
              {logoUploading && <p className="text-xs text-fog mt-1">Uploading...</p>}
            </SettingsField>

            <SettingsField label={s.brandColor}>
              <div className="flex gap-2 mt-0.5">
                {BRAND_PRESETS.map(p => (
                  <button
                    key={p.color}
                    title={p.name}
                    onClick={() => handleColorSelect(p.color)}
                    className="h-6 w-6 rounded-full transition-all"
                    style={{
                      backgroundColor: p.color,
                      outline: brandColor === p.color ? `2px solid ${p.color}` : 'none',
                      outlineOffset: brandColor === p.color ? '2px' : '0',
                    }}
                  />
                ))}
              </div>
            </SettingsField>

            <SettingsField label={s.customDomain}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customDomain}
                  onChange={e => setCustomDomain(e.target.value)}
                  onBlur={handleDomainBlur}
                  placeholder="portal.myagency.com"
                  className="flex-1 rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-white/20 bg-midnight border border-border text-foreground"
                />
                <button
                  onClick={handleCopyDomain}
                  disabled={!customDomain}
                  className="h-10 px-3 rounded-xl border border-border text-xs text-silver hover:text-ivory transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Copy size={12} />
                  {domainCopied ? s.copied : s.copyDomain}
                </button>
              </div>
              <p className="text-[10px] text-fog mt-1">{s.domainHint}</p>
              {customDomain && (
                <div className="mt-3 rounded-xl border border-white/6 p-4 space-y-3 bg-obsidian">
                  <p className="text-[11px] font-semibold text-silver">{s.dnsSetupTitle}</p>
                  <p className="text-[11px] text-fog leading-relaxed">{s.dnsSetupDesc}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg px-3 py-2 border border-white/8 bg-midnight">
                      <p className="text-[9px] text-fog uppercase tracking-widest mb-0.5">{s.dnsCnameLabel}</p>
                      <code className="text-xs text-silver">{s.dnsCnameValue}</code>
                    </div>
                    <button
                      onClick={handleCopyCname}
                      className="flex items-center gap-1.5 h-[52px] px-3 rounded-xl border border-white/8 text-[11px] text-silver hover:text-ivory transition-colors"
                    >
                      {cnameCopied ? <Check size={11} className="text-sage" /> : <Copy size={11} />}
                      {cnameCopied ? s.dnsCopied : s.dnsCopy}
                    </button>
                  </div>
                  <p className="text-[10px] text-fog">{s.dnsNote}</p>
                </div>
              )}
            </SettingsField>
          </div>
        </div>
      </div>
    </Section>
  );
}

function TeamTab() {
  const { t } = useLang();
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const s = t.app.settings.team;
  const roleLabels = s.roles as Record<string, string>;
  const [inviteEmail, setInviteEmail] = useState('');
  const [invited, setInvited] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const workspaceId = workspace?.id || null;
  const isOwner = user?.role === 'owner';

  useEffect(() => {
    if (!workspaceId) return;
    supabase.from('user_profiles').select('*').eq('workspace_id', workspaceId).then(({ data }) => {
      if (data) setMembers(data);
    });
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

  async function handleRoleChange(memberId: string, newRole: string) {
    await supabase.from('user_profiles').update({ role: newRole }).eq('id', memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
  }

  const ROLE_OPTIONS = ['owner', 'strategist', 'project_manager', 'designer', 'developer', 'finance'];

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
            const isSelf = member.user_id === user?.id || member.email === user?.email;
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
                {isOwner && !isSelf ? (
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg appearance-none bg-dusk border border-border text-silver focus:outline-none cursor-pointer"
                    title={s.changeRole}
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r} value={r}>{roleLabels[r] ?? r}</option>
                    ))}
                  </select>
                ) : (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: 'var(--muted)', color: 'var(--fog)' }}
                  >
                    {roleLabels[member.role] ?? member.role}
                  </span>
                )}
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

/* ── API tab ─────────────────────────────────────────────────────────────── */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function ApiTab() {
  const { t } = useLang();
  const { isFeatureVisible } = useTier();
  const { workspace } = useWorkspace();
  const s = t.app.settings.api;

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [scope, setScope] = useState<'read' | 'write'>('read');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!workspace?.id) return;
    supabase.from('api_keys').select('*').eq('workspace_id', workspace.id).then(({ data }) => {
      if (data) setKeys(data.map((k: any) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.key_prefix,
        scopes: k.scopes,
        createdAt: k.created_at,
        lastUsedAt: k.last_used_at,
        revokedAt: k.revoked_at,
      })));
    });
  }, [workspace?.id]);

  if (!isFeatureVisible('api_access')) return <LockedFeaturePage featureKey="api_access" />;

  async function handleGenerate() {
    if (!keyName.trim() || !workspace?.id) return;
    setGenerating(true);
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, '0')).join('');
    const fullKey = `mk_live_${rand}`;
    const prefix = fullKey.slice(0, 16);
    const id = crypto.randomUUID();
    await supabase.from('api_keys').insert({
      id,
      workspace_id: workspace.id,
      name: keyName.trim(),
      key_prefix: prefix,
      scopes: scope === 'write' ? ['read', 'write'] : ['read'],
      created_at: new Date().toISOString(),
      last_used_at: null,
      revoked_at: null,
    });
    setKeys(prev => [...prev, {
      id, name: keyName.trim(), keyPrefix: prefix,
      scopes: scope === 'write' ? ['read', 'write'] : ['read'],
      createdAt: new Date().toISOString(), lastUsedAt: null, revokedAt: null,
    }]);
    setNewKey(fullKey);
    setKeyName('');
    setGenerating(false);
  }

  async function handleRevoke(keyId: string) {
    const now = new Date().toISOString();
    await supabase.from('api_keys').update({ revoked_at: now }).eq('id', keyId);
    setKeys(prev => prev.map(k => k.id === keyId ? { ...k, revokedAt: now } : k));
  }

  function handleCopyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey).then(() => {
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    });
  }

  return (
    <Section title={s.heading} subtitle={s.subtitle}>
      <div className="w-full space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setSheetOpen(true)}
            className="h-9 px-4 rounded-xl text-sm font-medium bg-ivory text-obsidian hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {s.generate}
          </button>
        </div>

        {keys.length === 0 ? (
          <p className="text-sm text-fog text-center py-8">{s.noKeys}</p>
        ) : (
          <div className="rounded-xl overflow-hidden border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#0E1119', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-fog">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-fog">Key</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-fog">{s.created}</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-fog">{s.lastUsed}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {keys.map((k, i) => (
                  <tr
                    key={k.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? '#111522' : '#0E1119',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      opacity: k.revokedAt ? 0.45 : 1,
                    }}
                  >
                    <td className="px-4 py-3 text-silver">
                      <span>{k.name}</span>
                      {k.revokedAt && (
                        <span className="ml-2 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-rose/10 text-rose border border-rose/20">{s.revoked}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fog">{k.keyPrefix}&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</td>
                    <td className="px-4 py-3 text-xs text-fog">{relativeTime(k.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-fog">{k.lastUsedAt ? relativeTime(k.lastUsedAt) : s.never}</td>
                    <td className="px-4 py-3 text-right">
                      {!k.revokedAt && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          className="text-xs text-fog hover:text-rose transition-colors"
                        >
                          {s.revoke}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate key sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => { if (!newKey) setSheetOpen(false); }} />
          <div className="w-80 h-full bg-midnight border-l border-white/8 flex flex-col">
            <div className="px-5 pt-6 pb-4 border-b border-white/8 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ivory">{newKey ? s.keyWarning : s.generate}</h3>
              {newKey && (
                <button onClick={() => { setSheetOpen(false); setNewKey(null); }} className="text-fog hover:text-silver text-xs">Close</button>
              )}
            </div>
            {newKey ? (
              <div className="flex-1 px-5 py-5 space-y-4">
                <p className="text-xs text-amber leading-relaxed">{s.keyWarning}</p>
                <div className="rounded-xl bg-obsidian border border-border px-3 py-3">
                  <p className="font-mono text-xs text-sage break-all">{newKey}</p>
                </div>
                <button
                  onClick={handleCopyKey}
                  className="w-full h-9 rounded-xl text-sm font-medium bg-ivory text-obsidian hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Copy size={13} />
                  {keyCopied ? 'Copied!' : s.copyKey}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 px-5 py-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-silver">{s.keyName}</label>
                    <input
                      type="text"
                      value={keyName}
                      onChange={e => setKeyName(e.target.value)}
                      placeholder={t.app.settings.api.keyNamePlaceholder ?? ''}
                      className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20 bg-obsidian border border-border text-ivory"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-silver">Scope</label>
                    <div className="flex flex-col gap-2">
                      {(['read', 'write'] as const).map(v => (
                        <label key={v} className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="scope"
                            value={v}
                            checked={scope === v}
                            onChange={() => setScope(v)}
                            className="accent-sage"
                          />
                          <span className="text-sm text-silver">{s.scopes[v]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-6 flex gap-2">
                  <button
                    onClick={() => setSheetOpen(false)}
                    className="flex-1 h-10 rounded-xl text-sm font-medium border border-border text-silver hover:text-ivory transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={!keyName.trim() || generating}
                    className="flex-1 h-10 rounded-xl text-sm font-medium bg-ivory text-obsidian hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {generating ? '...' : s.generate}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}

/* ── Audit tab ───────────────────────────────────────────────────────────── */

function AuditTab() {
  const { t } = useLang();
  const { isFeatureVisible } = useTier();
  const { workspace } = useWorkspace();
  const s = t.app.settings.audit;

  const [period, setPeriod] = useState(30);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!workspace?.id) return;
    supabase
      .from('activity')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setEvents(data); });
  }, [workspace?.id]);

  if (!isFeatureVisible('governance')) return <LockedFeaturePage featureKey="governance" />;

  const cutoff = Date.now() - period * 86400000;
  const filtered = events.filter(e => new Date(e.created_at).getTime() >= cutoff);

  function initials(name: string) {
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  return (
    <Section title={s.heading} subtitle={s.subtitle}>
      <div className="w-full space-y-4">
        {/* Period filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-fog">{s.filter}:</span>
          {([7, 30, 90] as const).map(d => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={cn(
                'h-7 px-3 rounded-full text-xs font-medium transition-all border',
                period === d
                  ? 'bg-ivory text-obsidian border-transparent'
                  : 'border-border text-fog hover:text-silver'
              )}
            >
              {s.periods[`p${d}` as keyof typeof s.periods]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-fog text-center py-8">{s.noEvents}</p>
        ) : (
          <div className="space-y-1">
            {filtered.map(event => (
              <div
                key={event.id}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-midnight border border-border"
              >
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--dusk)', color: 'var(--silver)' }}
                >
                  {initials(event.username || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ivory">
                    <span className="text-silver">{event.username}</span>
                    {' '}
                    <span className="text-fog">{event.action_name}</span>
                    {event.target_name && (
                      <> <span className="text-silver">{event.target_name}</span></>
                    )}
                  </p>
                </div>
                <span className="text-[11px] text-fog shrink-0 mt-0.5">{relativeTime(event.created_at)}</span>
              </div>
            ))}
          </div>
        )}
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
    { id: 7, label: s.tabs.api,           content: <ApiTab /> },
    { id: 8, label: s.tabs.audit,         content: <AuditTab /> },
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
