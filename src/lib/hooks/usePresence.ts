'use client';
import { useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';

export function usePresence(location?: string) {
  const { user } = useAuth();
  const updatePresence = useMutation(api.presence.update);
  const activeUsers = useQuery(api.presence.list, { location });

  useEffect(() => {
    if (!user?.email) return;

    // Initial heartbeat
    updatePresence({
      user: user.email,
      status: 'online',
      location,
    });

    // Heartbeat every 10 seconds
    const interval = setInterval(() => {
      updatePresence({
        user: user.email,
        status: 'online',
        location,
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [user?.email, location, updatePresence]);

  return activeUsers ?? [];
}
