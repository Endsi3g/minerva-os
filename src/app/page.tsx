'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        router.replace('/app/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen w-full bg-background" />

  );
}
