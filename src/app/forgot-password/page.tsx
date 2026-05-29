'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0D14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ color: '#F5F1E8', fontSize: 26, fontWeight: 600, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
          Reset your password
        </h1>
        <p style={{ color: '#8A9099', fontSize: 14, marginBottom: 32 }}>
          Enter your email and we will send you a reset link.
        </p>

        {submitted ? (
          <div style={{ backgroundColor: 'rgba(127,163,138,0.12)', border: '1px solid rgba(127,163,138,0.3)', borderRadius: 12, padding: 20 }}>
            <p style={{ color: '#7FA38A', fontSize: 14, margin: 0 }}>
              Check your inbox. If this email exists in our system, you will receive a reset link shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#B8BDC7', fontSize: 13, display: 'block', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  backgroundColor: '#111522',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: '#F5F1E8',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#A86A6A', fontSize: 13, marginBottom: 16 }}>{error}</p>
            )}

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
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <p style={{ color: '#8A9099', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
          Remembered it?{' '}
          <Link href="/login" style={{ color: '#F5F1E8', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
