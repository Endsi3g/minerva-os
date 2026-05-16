import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useConvexAuth, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

interface UserProfile {
  _id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => undefined,
  signOut: async () => undefined,
  changePassword: async () => undefined,
});

const TOKEN_KEY = 'minerva_auth_token';

// SecureStore adapter for @convex-dev/auth storage persistence
export const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading: convexAuthLoading, isAuthenticated: convexIsAuthenticated } = useConvexAuth();
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();

  const profile = useQuery(
    api.userProfiles.viewer,
    convexIsAuthenticated ? {} : 'skip'
  ) as UserProfile | null | undefined;

  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = convexAuthLoading || localLoading;
  const isAuthenticated = convexIsAuthenticated;
  const user = profile ?? null;

  async function signIn(email: string, password: string) {
    setLocalLoading(true);
    try {
      await convexSignIn('password', { email, password, flow: 'signIn' });
      await SecureStore.setItemAsync(TOKEN_KEY, 'authenticated');
    } finally {
      setLocalLoading(false);
    }
  }

  async function signOut() {
    await convexSignOut();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!user?.email) throw new Error('No user email');
    // Re-authenticate then update — Convex Auth password flow
    await convexSignIn('password', {
      email: user.email,
      password: currentPassword,
      flow: 'signIn',
    });
    await convexSignIn('password', {
      email: user.email,
      password: newPassword,
      flow: 'signUp', // update existing credential
      name: user.name,
    });
  }

  useEffect(() => {
    // On mount, check if we have a persisted token hint
    SecureStore.getItemAsync(TOKEN_KEY).then(token => {
      if (!token && !convexIsAuthenticated && !convexAuthLoading) {
        // No token — user needs to sign in
      }
    });
  }, [convexIsAuthenticated, convexAuthLoading]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, signIn, signOut, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AuthContext);
}
