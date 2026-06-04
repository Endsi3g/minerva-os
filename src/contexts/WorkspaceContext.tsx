'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkspaceProfile, WorkspaceTier, AgencyType } from '@/lib/types';

interface WorkspaceContextType {
  workspace: WorkspaceProfile | null;
  workspaces: WorkspaceProfile[];
  isLoading: boolean;
  refreshWorkspace: () => Promise<void>;
  setWorkspaceProfile: (patch: Partial<WorkspaceProfile>) => void;
  switchWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const LS_TIER_KEY = 'minerva_workspace_tier';
const LS_ACTIVE_KEY = 'minerva_active_workspace_id';

function getCachedTier(): WorkspaceTier | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(LS_TIER_KEY);
    if (v === 'starter' || v === 'growth' || v === 'scale') return v;
  } catch {
    // ignore
  }
  return null;
}

function setCachedTier(tier: WorkspaceTier) {
  try { localStorage.setItem(LS_TIER_KEY, tier); } catch { /* ignore */ }
}

function getCachedActiveId(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(LS_ACTIVE_KEY); } catch { return null; }
}

function setCachedActiveId(id: string) {
  try { localStorage.setItem(LS_ACTIVE_KEY, id); } catch { /* ignore */ }
}

function mapWorkspace(ws: any, onboardingComplete: boolean): WorkspaceProfile {
  const tier: WorkspaceTier = (ws.workspace_tier as WorkspaceTier) ?? 'scale';
  const brandColor = ws.branding?.primaryColor ?? ws.settings?.brand_color ?? undefined;
  const customDomain = ws.settings?.custom_domain ?? undefined;
  return {
    id: ws.id ?? '',
    name: ws.name ?? '',
    tier,
    agencyType: (ws.agency_type as AgencyType) ?? null,
    onboardingComplete,
    teamSize: ws.team_size ?? null,
    priorityGoals: ws.priority_goals ?? [],
    setupKitApplied: ws.setup_kit_applied ?? true,
    logoUrl: ws.logo_url ?? undefined,
    brandColor,
    customDomain,
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const cachedTier = getCachedTier();

  const [workspaces, setWorkspaces] = useState<WorkspaceProfile[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceProfile | null>(
    cachedTier ? {
      id: getCachedActiveId() ?? '', name: '', tier: cachedTier, agencyType: null,
      onboardingComplete: true, teamSize: null, priorityGoals: [],
      setupKitApplied: true,
    } : null
  );
  const [isLoading, setIsLoading] = useState(!cachedTier);

  async function fetchWorkspace() {
    if (!user) { setWorkspace(null); setWorkspaces([]); setIsLoading(false); return; }

    try {
      const [wsResult, profileResult] = await Promise.all([
        supabase.from('workspaces').select('*'),
        supabase.from('user_profiles').select('onboarding_complete').eq('user_id', user.id).maybeSingle(),
      ]);

      const onboardingComplete = profileResult.data?.onboarding_complete ?? true;
      const wsRows = wsResult.data ?? [];

      if (wsRows.length > 0) {
        const mapped = wsRows.map((ws: any) => mapWorkspace(ws, onboardingComplete));
        setWorkspaces(mapped);

        const cachedId = getCachedActiveId();
        const active = mapped.find((w: WorkspaceProfile) => w.id === cachedId) ?? mapped[0];
        setCachedTier(active.tier);
        setCachedActiveId(active.id);
        setWorkspace(active);
      } else {
        setWorkspaces([]);
        setWorkspace({
          id: '', name: '', tier: 'scale', agencyType: null,
          onboardingComplete: profileResult.data?.onboarding_complete ?? false,
          teamSize: null, priorityGoals: [], setupKitApplied: false,
        });
      }
    } catch (err) {
      console.error('WorkspaceContext fetch error', err);
      setWorkspace(prev => prev ?? {
        id: '', name: '', tier: 'scale', agencyType: null,
        onboardingComplete: true, teamSize: null, priorityGoals: [], setupKitApplied: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    fetchWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function setWorkspaceProfile(patch: Partial<WorkspaceProfile>) {
    setWorkspace(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (patch.tier) setCachedTier(patch.tier);
      return next;
    });
    // also update in the workspaces list
    setWorkspaces(prev => prev.map(w => w.id === workspace?.id ? { ...w, ...patch } : w));
  }

  function switchWorkspace(id: string) {
    const target = workspaces.find(w => w.id === id);
    if (!target) return;
    setCachedActiveId(id);
    setCachedTier(target.tier);
    setWorkspace(target);
  }

  return (
    <WorkspaceContext.Provider value={{
      workspace, workspaces, isLoading,
      refreshWorkspace: fetchWorkspace,
      setWorkspaceProfile,
      switchWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
