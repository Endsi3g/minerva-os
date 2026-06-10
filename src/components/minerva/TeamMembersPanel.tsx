'use client';
import React, { useState } from 'react';
import { useTeamMembers, type TeamMember } from '@/lib/hooks/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mail, Check, Crown, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/contexts/AuthContext';

const ROLE_OPTIONS: UserRole[] = [
  'owner',
  'strategist',
  'project_manager',
  'designer',
  'developer',
  'finance',
];

const ROLE_BADGE: Record<string, string> = {
  owner:           'bg-amber-50 text-amber-700 border-amber-200',
  strategist:      'bg-purple-50 text-purple-700 border-purple-200',
  project_manager: 'bg-blue-50  text-blue-700  border-blue-200',
  designer:        'bg-pink-50  text-pink-700  border-pink-200',
  developer:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  finance:         'bg-orange-50 text-orange-700 border-orange-200',
};

function memberInitials(name: string) {
  return (name || 'U')
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function TeamMembersPanel() {
  const { t } = useLang();
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const { members, isLoading, refreshMembers } = useTeamMembers();

  const s = t.app.settings.team;
  const roleLabels = s.roles as Record<string, string>;

  const [inviteEmail, setInviteEmail]   = useState('');
  const [inviteRole, setInviteRole]     = useState<string>('project_manager');
  const [inviting, setInviting]         = useState(false);
  const [inviteLink, setInviteLink]     = useState('');
  const [linkCopied, setLinkCopied]     = useState(false);

  const isOwner = user?.role === 'owner';

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inviteEmail.trim() || !workspace?.id) return;
    setInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          workspaceId: workspace.id,
        }),
      });
      if (!res.ok) throw new Error('Invite failed');
      const data = await res.json();
      setInviteLink(data.inviteUrl ?? '');
      setInviteEmail('');
      toast.success(`Invitation created for ${inviteEmail.trim()}`);
    } catch {
      toast.error('Failed to create invitation');
    } finally {
      setInviting(false);
    }
  }

  function handleCopyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', memberId);
    if (error) {
      toast.error('Failed to update role');
    } else {
      refreshMembers();
      toast.success('Role updated');
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Invite form ─────────────────────────────────────────────── */}
      {isOwner && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <UserPlus size={15} className="text-primary" strokeWidth={1.75} />
              <h3 className="text-sm font-semibold text-foreground">{s.inviteLabel}</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Generate a secure invite link to share with your collaborator.
            </p>
          </div>

          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder={s.invitePlaceholder}
              value={inviteEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
              className="flex-1 h-9 text-sm"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-36 h-9 text-xs shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(r => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {roleLabels[r] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              size="sm"
              disabled={!inviteEmail.trim() || inviting}
              className="shrink-0 gap-1.5"
            >
              <Mail size={13} strokeWidth={1.75} />
              {s.inviteButton}
            </Button>
          </form>

          {inviteLink && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-soft border border-primary-soft-border">
              <p className="flex-1 text-xs text-primary truncate font-mono">{inviteLink}</p>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-active transition-colors shrink-0"
              >
                {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                {linkCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Member list ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
          {isLoading ? 'Members' : `${members.length} ${members.length === 1 ? 'Member' : 'Members'}`}
        </p>

        <div className="space-y-0.5">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
              ))
            : members.map((member: TeamMember) => {
                const initials = memberInitials(member.name);
                const isSelf = member.email === user?.email;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-alt transition-colors"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      {member.avatarUrl && (
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                      )}
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                        {isSelf && (
                          <span className="text-[9px] font-semibold text-muted-foreground bg-border px-1.5 py-0.5 rounded-full shrink-0">
                            You
                          </span>
                        )}
                        {member.role === 'owner' && !isSelf && (
                          <Crown size={11} className="text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>

                    {isOwner && !isSelf ? (
                      <select
                        defaultValue={member.role}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleRoleChange(member.id, e.target.value)}
                        title={s.changeRole}
                        className={cn(
                          'text-[11px] font-semibold px-2.5 py-1 rounded-lg border appearance-none',
                          'focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-colors',
                          ROLE_BADGE[member.role] ?? 'bg-border text-muted-foreground border-border'
                        )}
                      >
                        {ROLE_OPTIONS.map(r => (
                          <option key={r} value={r}>
                            {roleLabels[r] ?? r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg border shrink-0',
                          ROLE_BADGE[member.role] ?? 'bg-border text-muted-foreground border-border'
                        )}
                      >
                        {roleLabels[member.role] ?? member.role}
                      </span>
                    )}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
