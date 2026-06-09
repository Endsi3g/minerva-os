'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

const BG_VIDEO = process.env.NEXT_PUBLIC_BG_VIDEO_URL || '/Plan_fixe_cinématique_Anime_c.mp4';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { setWorkspaceProfile } = useWorkspace();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    let active = true;

    async function autoSetup() {
      if (!user) return;
      try {
        const res = await fetch('/api/workspace/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skip: true, tier: 'scale' }),
        });
        if (!active) return;
        const json = await res.json();
        if (res.ok && json.workspaceId) {
          setWorkspaceProfile({
            onboardingComplete: true,
            id: json.workspaceId,
            tier: 'scale',
          });
          router.push('/app/dashboard');
        }
      } catch (err) {
        console.error('Failed to auto-skip onboarding:', err);
      }
    }

    autoSetup();

    return () => {
      active = false;
    };
  }, [user, setWorkspaceProfile, router]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090909]">
      <video
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={BG_VIDEO} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10" />
    </div>
  );
}
