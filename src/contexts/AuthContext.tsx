'use client';
import { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'owner' | 'strategist' | 'project_manager' | 'designer' | 'developer' | 'finance' | 'client_stakeholder' | 'client_reviewer';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On mount, try to restore session from cookie (server validates on each request in middleware)
    const stored = sessionStorage.getItem('minerva_user');
    if (stored) {
      try { setUser(JSON.parse(stored) as AuthUser); } catch { /* corrupt storage */ }
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const { error } = await res.json() as { error: string };
      throw new Error(error);
    }
    const { user: authUser } = await res.json() as { user: AuthUser };
    setUser(authUser);
    sessionStorage.setItem('minerva_user', JSON.stringify(authUser));
  }

  async function signup(firstName: string, lastName: string, email: string, password: string) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    if (!res.ok) {
      const { error } = await res.json() as { error: string };
      throw new Error(error);
    }
    const { user: authUser } = await res.json() as { user: AuthUser };
    setUser(authUser);
    sessionStorage.setItem('minerva_user', JSON.stringify(authUser));
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    sessionStorage.removeItem('minerva_user');
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
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
