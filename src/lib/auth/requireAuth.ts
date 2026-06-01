import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { isDemoMode, DEMO_USER_ID } from '@/lib/demo';

type AuthSuccess = { user: User; error: null };
type AuthFailure = { user: null; error: NextResponse };

const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@uprising.studio',
  aud: 'authenticated',
  role: 'authenticated',
  user_metadata: { name: 'Demo User' },
  app_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
} as unknown as User;

export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  if (isDemoMode()) {
    return { user: DEMO_USER, error: null };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}
