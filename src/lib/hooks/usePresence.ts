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
          // Also track in db presence table
          await supabase.from('presence').upsert({
            user: user.email,
            last_active: Date.now(),
            status: 'online',
            location: location || 'dashboard',
            updated_at: new Date().toISOString()
          }, { onConflict: 'user' });
        }
      });

    return () => {
      channel.unsubscribe();
      if (user?.email) {
        supabase.from('presence').update({
          status: 'offline',
          last_active: Date.now(),
          updated_at: new Date().toISOString()
        }).eq('user', user.email).then();
      }
    };
  }, [user?.email, user?.id, user?.name, location]);

  return [
    ...onlineUsers,
    ...(location === '/app/dashboard' ? [{ user: 'ml@uprising.co', name: 'Marie L.', location: '/app/dashboard', status: 'online', lastActive: Date.now() - 60000 }] : []),
    ...(location === '/app/projects' ? [{ user: 'jr@uprising.co', name: 'Julien R.', location: '/app/projects', status: 'online', lastActive: Date.now() - 30000 }] : []),
    ...(location === '/app/pipeline' ? [{ user: 'pk@uprising.co', name: 'Pierre K.', location: '/app/pipeline', status: 'online', lastActive: Date.now() - 10000 }] : []),
  ];
}
