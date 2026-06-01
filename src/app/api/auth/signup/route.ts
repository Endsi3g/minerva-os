import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { firstName, lastName, email, password } = await req.json() as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };

  if (!email || !password || !firstName) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 422 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: `${firstName} ${lastName}` },
    },
  });

  if (error) {
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 400 });
  }

  return NextResponse.json(
    { user: { id: data.user?.id, email: data.user?.email } },
    { status: 201 }
  );
}
