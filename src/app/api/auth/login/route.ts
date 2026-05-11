import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email: string; password: string };

  // TODO: validate against database (Prisma + bcrypt)
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  // Placeholder — replace with real DB lookup + JWT generation
  const mockUser = { id: 'usr_01', email, role: 'owner', name: 'Uprising Studio' };
  const token = Buffer.from(JSON.stringify(mockUser)).toString('base64');

  const res = NextResponse.json({ user: mockUser });
  res.cookies.set('minerva_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
