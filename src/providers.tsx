'use client';
import { ThemeProvider } from '@/theme';
import { LangProvider } from '@/i18n';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
