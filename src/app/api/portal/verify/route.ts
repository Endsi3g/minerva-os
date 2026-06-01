import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setPortalEmailCookie, logPortalActivity } from '@/lib/portal-auth';
import { MOCK_PORTAL_TOKENS, MOCK_CLIENTS } from '@/lib/mock-data';
import { isDemoMode } from '@/lib/demo';

export async function POST(request: Request) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    // 1. Fetch token
    let tokenRow: any = null;
    let isMock = false;

    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const { data, error: tokenErr } = await supabaseAdmin
          .from('portal_tokens')
          .select('*')
          .eq('token', token)
          .maybeSingle();

        if (!tokenErr && data) {
          tokenRow = data;
        }
      } catch (e) {
        console.warn('Supabase token verify lookup failed, falling back to mock:', e);
      }
    }

    if (!tokenRow && (isDemoMode() || process.env.NODE_ENV !== 'production')) {
      const mockToken = MOCK_PORTAL_TOKENS.find(t => t.token === token);
      if (mockToken) {
        tokenRow = {
          id: mockToken.token,
          workspace_id: 'mock-workspace-123',
          client_id: mockToken.clientId,
          token: mockToken.token,
          expires_at: mockToken.expiresAt,
          scopes: mockToken.scopes,
        };
        isMock = true;
      }
    }

    if (!tokenRow) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    // Check expiry
    if (new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }

    // 2. Fetch client email
    let client: any = null;

    if (!isMock && hasCredentials) {
      try {
        const { data: dbClient, error: clientErr } = await supabaseAdmin
          .from('clients')
          .select('id, email, workspace_id')
          .eq('id', tokenRow.client_id)
          .maybeSingle();

        if (!clientErr && dbClient) {
          client = dbClient;
        }
      } catch (e) {
        console.warn('Supabase client verify lookup failed:', e);
      }
    }

    if (!client && (isDemoMode() || process.env.NODE_ENV !== 'production')) {
      const mockClient = MOCK_CLIENTS.find(c => c.id === tokenRow.client_id);
      if (mockClient) {
        client = {
          id: mockClient.id,
          email: mockClient.email,
          workspace_id: 'mock-workspace-123',
        };
      }
    }

    if (!client) {
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
