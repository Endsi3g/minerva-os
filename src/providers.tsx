'use client';
import { ThemeProvider } from '@/theme';
import { LangProvider } from '@/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: '#111522',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#F5F1E8',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
              },
            }}
          />
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
