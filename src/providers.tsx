'use client';
import { ThemeProvider } from '@/theme';
import { LangProvider } from '@/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </ConvexAuthNextjsProvider>
  );
}
