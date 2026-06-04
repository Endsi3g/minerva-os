'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkspaceProfile, WorkspaceTier, AgencyType } from '@/lib/types';

interface WorkspaceContextType {
  workspace: WorkspaceProfile | null;
  isLoading: boolean;
  refreshWorkspace: () => Promise<void>;
  setWorkspaceProfile: (patch: Partial<WorkspaceProfile>) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const LS_KEY = 'minerva_workspace_tier';

function getCachedTier(): WorkspaceTier | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === 'starter' || v === 'growth' || v === 'scale') return v;
  } catch {
    // ignore
  }
  return null;
}

function setCachedTier(tier: WorkspaceTier) {
  try { localStorage.setItem(LS_KEY, tier); } catch { /* ignore */ }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const cachedTier = getCachedTier();

  const [workspace, setWorkspace] = useState<WorkspaceProfile | null>(
    cachedTier ? {
      id: '', name: '', tier: cachedTier, agencyType: null,
      onboardingComplete: true, teamSize: null, priorityGoals: [],
      setupKitApplied: true,
    } : null
  );
  const [isLoading, setIsLoading] = useState(!cachedTier);

  async function fetchWorkspace() {
    if (!user) { setWorkspace(null); setIsLoading(false); return; }

    try {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('*')
        .limit(1)
        .maybeSingle();

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_complete')
        .eq('user_id', user.id)
        .maybeSingle();

      if (ws) {
        const tier: WorkspaceTier = (ws.workspace_tier as WorkspaceTier) ?? 'scale';
        setCachedTier(tier);
        setWorkspace({
          id: ws.id ?? '',
          name: ws.name ?? '',
          tier,
          agencyType: (ws.agency_type as AgencyType) ?? null,
          onboardingComplete: profile?.onboarding_complete ?? true,
          teamSize: ws.team_size ?? null,
          priorityGoals: ws.priority_goals ?? [],
          setupKitApplied: ws.setup_kit_applied ?? true,
          logoUrl: ws.logo_url ?? undefined,
        });
      } else {
        // No workspace row yet — treat as scale (all features visible) until onboarding sets it
        setWorkspace({
          id: '', name: '', tier: 'scale', agencyType: null,
          onboardingComplete: profile?.onboarding_complete ?? false,
          teamSize: null, priorityGoals: [], setupKitApplied: false,
        });
      }
    } catch (err) {
      console.error('WorkspaceContext fetch error', err);
      // Fail open: default to scale so existing users are never locked out
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
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, isLoading, refreshWorkspace: fetchWorkspace, setWorkspaceProfile }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
