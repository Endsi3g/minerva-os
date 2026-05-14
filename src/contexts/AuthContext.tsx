import { createContext, useContext, useMemo } from 'react';
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  
  // Get full user profile from Convex
  const viewer = useQuery(api.userProfiles.viewer);
  
  const user = useMemo(() => {
    if (!isAuthenticated || !viewer) return null;
    return {
      id: viewer._id,
      email: viewer.email,
      name: viewer.name,
      role: (viewer.role || 'project_manager') as UserRole,
    };
  }, [isAuthenticated, viewer]);

  const isLoading = isAuthLoading || (isAuthenticated && viewer === undefined);

  async function login(email: string, password: string) {
    await signIn("password", { email, password, flow: "signIn" });
  }

  async function signup(firstName: string, lastName: string, email: string, password: string) {
    await signIn("password", { 
      email, 
      password, 
      name: `${firstName} ${lastName}`,
      flow: "signUp" 
    });
  }

  async function logout() {
    await signOut();
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
