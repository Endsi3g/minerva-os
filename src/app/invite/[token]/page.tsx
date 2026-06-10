'use client';
import { useState, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Mail } from 'lucide-react';

function InviteContent({ token }: { token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intendedRole = searchParams.get('role') ?? 'project_manager';

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [accepted, setAccepted] = useState(false);

  async function handleAccept() {
    setError('');
    setLoading(true);
    try {
      const { data: inv, error: fetchErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (fetchErr || !inv) throw new Error('Invitation not found or expired');
      if (inv.accepted_at) throw new Error('This invitation has already been accepted');
      if (new Date(inv.expires_at) < new Date()) throw new Error('This invitation has expired');

      const { error: updateErr } = await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', token);

      if (updateErr) throw updateErr;

      // Apply the granular role from query param to the user's profile.
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase
          .from('user_profiles')
          .update({
            workspace_id: inv.workspace_id,
            role: intendedRole,
          })
          .eq('user_id', authUser.id);
      }

      setAccepted(true);
      setTimeout(() => router.push('/app/dashboard'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        {accepted ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-success" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-foreground">You are in.</h1>
            <p className="text-sm text-muted-foreground">Taking you to the dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                  <Mail size={28} className="text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="text-xl font-semibold text-foreground">You have been invited</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Accept this invitation to join the workspace.<br />
                You must be signed in to continue.
              </p>
            </div>

            {error && (
              <div className="bg-danger/8 border border-danger/20 rounded-xl p-4">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Accepting...' : 'Accept invitation'}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Not signed in?{' '}
              <a
                href={`/login?next=/invite/${token}`}
                className="text-primary hover:underline font-medium"
              >
                Sign in first
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <InviteContent token={token} />
    </Suspense>
  );
}
