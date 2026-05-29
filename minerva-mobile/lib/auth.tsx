import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => undefined,
  signOut: async () => undefined,
  changePassword: async () => undefined,
});

// SecureStore adapter (kept for compatibility)
export const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

function mapProfile(authUser: User, dbProfile: any): UserProfile {
  return {
    _id: dbProfile?.id ?? authUser.id,
    id: dbProfile?.id ?? authUser.id,
    email: authUser.email ?? '',
    name: dbProfile?.name ?? authUser.email?.split('@')[0] ?? '',
    role: dbProfile?.role ?? 'member',
    avatar: dbProfile?.avatar_url ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user) {
        fetchProfile(data.session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      if (newSession?.user) {
        fetchProfile(newSession.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  async function fetchProfile(authUser: User) {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();
      setUser(mapProfile(authUser, data));
    } catch {
      setUser(mapProfile(authUser, null));
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  async function changePassword(_currentPassword: string, newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAuthenticated: Boolean(session), signIn, signOut, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AuthContext);
}
