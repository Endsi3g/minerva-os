import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'owner' | 'strategist' | 'project_manager' | 'designer' | 'developer' | 'finance' | 'client_stakeholder' | 'client_reviewer';

export interface AuthUser {
  id: string;
  profileId?: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string, emailRedirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        if (session?.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (!active) return;
          if (profile) {
            setUser({
              id: session.user.id,
              profileId: profile.id,
              email: profile.email,
              name: profile.name,
              role: (profile.role || 'project_manager') as UserRole,
            });
          } else {
            // Fallback if profile not found yet
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || 'User',
              role: 'project_manager',
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session?.user) {
        setIsLoading(true);
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (!active) return;
          if (profile) {
            setUser({
              id: session.user.id,
              profileId: profile.id,
              email: profile.email,
              name: profile.name,
              role: (profile.role || 'project_manager') as UserRole,
            });
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || 'User',
              role: 'project_manager',
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (active) setIsLoading(false);
        }
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signup(firstName: string, lastName: string, email: string, password: string, emailRedirectTo?: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: `${firstName} ${lastName}` },
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      }
    });
    if (error) throw error;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    signup,
    logout
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

// Role-based permission helpers
export const PERMISSIONS: Record<UserRole, string[]> = {
  owner:              ['*'],
  strategist:         ['crm', 'discovery', 'proposals'],
  project_manager:    ['projects', 'tasks', 'files', 'approvals'],
  designer:           ['tasks', 'files', 'approvals'],
  developer:          ['tasks', 'files', 'specs'],
  finance:            ['billing', 'invoices', 'retainers'],
  client_stakeholder: ['portal.overview', 'portal.files', 'portal.invoices', 'portal.approvals'],
  client_reviewer:    ['portal.deliverables', 'portal.approvals'],
};

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  const perms = PERMISSIONS[user.role];
  return perms.includes('*') || perms.includes(permission) || perms.some(p => permission.startsWith(p));
}
