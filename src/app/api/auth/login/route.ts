import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email: string; password: string };

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name ?? '',
    },
  });
}
