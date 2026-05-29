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
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0D14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        {accepted ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h1 style={{ color: '#7FA38A', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Invitation accepted</h1>
            <p style={{ color: '#8A9099', fontSize: 14 }}>Redirecting you to the dashboard...</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉</div>
            <h1 style={{ color: '#F5F1E8', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>You have been invited</h1>
            <p style={{ color: '#8A9099', fontSize: 14, marginBottom: 32 }}>
              Accept this invitation to join the workspace. You must be signed in to continue.
            </p>

            {error && (
              <div style={{ backgroundColor: 'rgba(168,106,106,0.12)', border: '1px solid rgba(168,106,106,0.3)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <p style={{ color: '#A86A6A', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={loading}
              style={{
                backgroundColor: '#F5F1E8',
                color: '#0A0D14',
                border: 'none',
                borderRadius: 12,
                padding: '13px 32px',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Accepting...' : 'Accept invitation'}
            </button>

            <p style={{ color: '#8A9099', fontSize: 12, marginTop: 16 }}>
              Not signed in?{' '}
              <a href={`/login?next=/invite/${token}`} style={{ color: '#F5F1E8' }}>Sign in first</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
