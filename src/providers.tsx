'use client';
import { ThemeProvider } from '@/theme';
import { LangProvider } from '@/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? 'https://placeholder.convex.cloud'
);

export function Providers({ children }: { children: React.ReactNode }) {
  console.log('Providers rendering');
  return (
    <ConvexAuthProvider client={convex}>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </ConvexAuthProvider>
  );
}
