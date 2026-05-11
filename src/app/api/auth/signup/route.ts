import { NextRequest, NextResponse } from 'next/server';

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

  // TODO: hash password, insert user into DB (Prisma), send welcome email
  const mockUser = { id: `usr_${Date.now()}`, email, name: `${firstName} ${lastName}`, role: 'owner' };

  return NextResponse.json({ user: mockUser }, { status: 201 });
}
