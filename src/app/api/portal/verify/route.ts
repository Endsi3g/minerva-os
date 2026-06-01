import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setPortalEmailCookie, logPortalActivity } from '@/lib/portal-auth';

export async function POST(request: Request) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    // 1. Fetch token
    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from('portal_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (tokenErr || !tokenRow) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    // Check expiry
    if (new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }

    // 2. Fetch client email
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id, email, workspace_id')
      .eq('id', tokenRow.client_id)
      .maybeSingle();

    if (clientErr || !client) {
      return NextResponse.json({ error: 'client_not_found' }, { status: 404 });
    }

    const clientEmail = client.email || '';
    if (email.trim().toLowerCase() !== clientEmail.toLowerCase()) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 403 });
    }

    // 3. Set cookie
    await setPortalEmailCookie(clientEmail);

    // 4. Log activity
    await logPortalActivity({
      workspaceId: tokenRow.workspace_id,
      tokenId: tokenRow.id,
      clientId: tokenRow.client_id,
      event: 'email_verified',
      metadata: { email: clientEmail },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Portal verify error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
