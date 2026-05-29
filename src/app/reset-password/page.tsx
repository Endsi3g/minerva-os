'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired reset link');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#111522',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '12px 16px',
    color: '#F5F1E8',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0D14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ color: '#F5F1E8', fontSize: 26, fontWeight: 600, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
          Choose a new password
        </h1>
        <p style={{ color: '#8A9099', fontSize: 14, marginBottom: 32 }}>
          Pick a strong password you have not used before.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#B8BDC7', fontSize: 13, display: 'block', marginBottom: 6 }}>New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#B8BDC7', fontSize: 13, display: 'block', marginBottom: 6 }}>Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={inputStyle} />
          </div>

          {error && <p style={{ color: '#A86A6A', fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#F5F1E8',
              color: '#0A0D14',
              border: 'none',
              borderRadius: 12,
              padding: '13px 0',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <p style={{ color: '#8A9099', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
          <Link href="/login" style={{ color: '#F5F1E8', textDecoration: 'none' }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
