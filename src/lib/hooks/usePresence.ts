'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ActiveUserPresence {
  user: string;
  name: string;
  location?: string;
  status: string;
  lastActive: number;
}

export function usePresence(location?: string) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<ActiveUserPresence[]>([]);

  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase.channel(`presence:location:${location || 'global'}`, {
      config: {
        presence: {
          key: user.id || user.email,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state)
          .flat()
          .map((p: any) => ({
            user: p.user_email || 'User',
            name: p.user_name || 'Anonymous',
            location: p.location,
            status: 'online',
            lastActive: p.online_at ? new Date(p.online_at).getTime() : Date.now(),
          }));
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_email: user.email,
            user_name: user.name,
            location: location || 'dashboard',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.email, user?.id, user?.name, location]);

  return onlineUsers;
}
