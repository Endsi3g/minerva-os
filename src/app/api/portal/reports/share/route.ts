import { NextResponse } from 'next/server';
import { validatePortalToken } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

const SHARE_TTL_HOURS = 72;

export async function POST(request: Request) {
  try {
    const { token, data } = await request.json();

    if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 });

    const authResult = await validatePortalToken(token);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error, expired: authResult.expired }, { status: 401 });
    }
    if (!authResult.verifiedEmail) {
      return NextResponse.json({ error: 'needs_verification' }, { status: 403 });
    }

    const { client_id: clientId, workspace_id: workspaceId, scopes } = authResult.tokenData!;

    if (!scopes.includes('reports')) {
      return NextResponse.json({ error: 'unauthorized_scope' }, { status: 403 });
    }

    const shareToken = randomUUID();
    const expiresAt = new Date(Date.now() + SHARE_TTL_HOURS * 3600 * 1000).toISOString();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/reports/${shareToken}`;

    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const { error } = await supabaseAdmin.from('portal_report_shares').insert({
          share_token: shareToken,
          workspace_id: workspaceId,
          client_id: clientId,
          snapshot_data: data,
          expires_at: expiresAt,
        });
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase report share insert failed:', e);
      }
    } else {
      console.log(`[Report Share] token=${shareToken}, clientId=${clientId}, expires=${expiresAt}`);
    }

    return NextResponse.json({ shareUrl, expiresAt });
  } catch (err: any) {
    console.error('Portal reports share POST error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    if (!shareToken) return NextResponse.json({ error: 'missing_token' }, { status: 400 });

    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const { data, error } = await supabaseAdmin
          .from('portal_report_shares')
          .select('*')
          .eq('share_token', shareToken)
          .maybeSingle();

        if (!error && data) {
          if (new Date(data.expires_at) < new Date()) {
            return NextResponse.json({ error: 'report_expired' }, { status: 410 });
          }
          return NextResponse.json({ data: data.snapshot_data, generatedAt: data.created_at, expiresAt: data.expires_at });
        }
      } catch (e) {
        console.warn('Supabase report share fetch failed:', e);
      }
    }

    return NextResponse.json({ error: 'report_not_found' }, { status: 404 });
  } catch (err: any) {
    console.error('Portal reports share GET error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
