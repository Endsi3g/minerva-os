'use client';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  async function handleAccept() {
    setError('');
    setLoading(true);
    try {
      const { data: inv } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (!inv) throw new Error('Invitation not found or expired');

      const { error } = await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', token);

      if (error) throw error;

      setAccepted(true);
      setTimeout(() => router.push('/app/dashboard'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] text-center">
        {accepted ? (
          <>
            <div className="text-5xl mb-4">&#10003;</div>
            <h1 className="text-[22px] font-semibold text-emerald-600 mb-2">Invitation accepted</h1>
            <p className="text-sm text-muted-foreground">Redirecting you to the dashboard...</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">&#9993;</div>
            <h1 className="text-[22px] font-semibold text-foreground mb-2">You have been invited</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Accept this invitation to join the workspace. You must be signed in to continue.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-[13px] text-red-500 m-0">{error}</p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={loading}
              className="bg-foreground text-background border-none rounded-xl px-8 py-3 text-sm font-semibold transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Accepting...' : 'Accept invitation'}
            </button>

            <p className="text-xs text-muted-foreground mt-4">
              Not signed in?{' '}
              <a href={`/login?next=/invite/${token}`} className="text-foreground hover:underline">Sign in first</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
