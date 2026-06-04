'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { AgencyType } from '@/lib/types';

const AGENCY_TYPES: { value: AgencyType; label: string }[] = [
  { value: 'branding',        label: 'Branding' },
  { value: 'paid_media',      label: 'Paid Media' },
  { value: 'content',         label: 'Content' },
  { value: 'dev_shop',        label: 'Dev Shop' },
  { value: 'full_service',    label: 'Full Service' },
  { value: 'fractional_team', label: 'Fractional Team' },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewWorkspaceModal({ open, onClose }: Props) {
  const { t } = useLang();
  const { user } = useAuth();
  const { switchWorkspace, refreshWorkspace } = useWorkspace();
  const wc = t.app.workspace.create;

  const [name, setName] = useState('');
  const [agencyType, setAgencyType] = useState<AgencyType>('full_service');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !user) return;
    setSubmitting(true);
    try {
      const newId = crypto.randomUUID();
      await supabase.from('workspaces').insert({
        id: newId,
        name: name.trim(),
        slug: slugify(name.trim()),
        owner_user_id: user.id,
        settings: {
          currency: 'USD',
          language: 'en',
          timezone: 'America/New_York',
          workspace_tier: 'starter',
          agency_type: agencyType,
          setup_kit_applied: false,
        }
      });
      await supabase.from('user_profiles').insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        workspace_id: newId,
        role: 'owner',
        email: user.email,
        name: user.name,
      });
      await refreshWorkspace();
      switchWorkspace(newId);
      setName('');
      onClose();
    } catch (err) {
      console.error('Failed to create workspace', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-80 bg-midnight border-l border-white/8 p-0 flex flex-col">
        <SheetHeader className="px-5 pt-6 pb-4 border-b border-white/8">
          <SheetTitle className="text-base font-semibold text-ivory">{wc.title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-silver">{wc.name}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={wc.namePlaceholder}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-white/20 bg-obsidian border border-white/8 text-ivory"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-silver">{wc.type}</label>
            <select
              value={agencyType}
              onChange={e => setAgencyType(e.target.value as AgencyType)}
              className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all appearance-none bg-obsidian border border-white/8 text-ivory"
            >
              {AGENCY_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 pb-6">
          <button
            onClick={handleCreate}
            disabled={!name.trim() || submitting}
            className={cn(
              'w-full h-10 rounded-xl text-sm font-medium transition-all',
              name.trim() && !submitting
                ? 'bg-ivory text-obsidian hover:opacity-90 active:scale-[0.98]'
                : 'bg-ivory/30 text-obsidian/50 cursor-not-allowed'
            )}
          >
            {submitting ? '...' : wc.cta}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
