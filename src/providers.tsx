'use client';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from '@/theme';
import { LangProvider } from '@/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { Toaster } from '@/components/ui/sonner';

function ToastWithTheme() {
  const { theme } = useTheme();
  return <Toaster theme={theme as 'dark' | 'light'} position="bottom-right" richColors />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log('Unregistered service worker in dev mode');
              window.location.reload();
            }
          });
        }
      });
    }
  }, []);

  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <WorkspaceProvider>
            {children}
            <ToastWithTheme />
          </WorkspaceProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
