'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface TeamMember {
  id: string;
  userId?: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export function useTeamMembers() {
  const { workspace } = useWorkspace();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!workspace?.id) return;
    setIsLoading(true);
    supabase
      .from('user_profiles')
      .select('id, user_id, email, name, role, avatar_url')
      .eq('workspace_id', workspace.id)
      .then(({ data }: { data: any[] | null }) => {
        if (data) {
          setMembers(
            data.map((m: any) => ({
              id: m.id,
              userId: m.user_id ?? undefined,
              email: m.email,
              name: m.name,
              role: m.role,
              avatarUrl: m.avatar_url ?? undefined,
            }))
          );
        }
        setIsLoading(false);
      });
  }, [workspace?.id]);

  function refreshMembers() {
    if (!workspace?.id) return;
    supabase
      .from('user_profiles')
      .select('id, user_id, email, name, role, avatar_url')
      .eq('workspace_id', workspace.id)
      .then(({ data }: { data: any[] | null }) => {
        if (data) {
          setMembers(
            data.map((m: any) => ({
              id: m.id,
              userId: m.user_id ?? undefined,
              email: m.email,
              name: m.name,
              role: m.role,
              avatarUrl: m.avatar_url ?? undefined,
            }))
          );
        }
      });
  }

  return { members, isLoading, refreshMembers };
}
