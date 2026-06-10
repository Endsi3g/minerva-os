import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, role, workspaceId } = body as {
      email: string;
      role: string;
      workspaceId: string;
    };

    if (!email || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // DB constraint: role must be 'owner' | 'member'
    const dbRole = role === 'owner' ? 'owner' : 'member';

    // Include the intended granular role in the token so the accept page can use it.
    const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 15)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin.from('invitations').insert({
      workspace_id: workspaceId,
      email: email.toLowerCase(),
      role: dbRole,
      token,
      expires_at: expiresAt,
    });

    if (error) throw error;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    // Append intended_role as query param so the invite page can pre-set it.
    const inviteUrl = `${appUrl}/invite/${token}?role=${encodeURIComponent(role)}`;

    return NextResponse.json({ success: true, inviteUrl, token });
  } catch (err) {
    console.error('[team/invite] error:', err);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
