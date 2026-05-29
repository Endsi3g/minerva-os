'use client';
import { ThemeProvider } from '@/theme';
import { LangProvider } from '@/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors />
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
