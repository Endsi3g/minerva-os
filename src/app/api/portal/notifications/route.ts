import { NextResponse } from 'next/server';
import { validatePortalToken } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_PORTAL_NOTIFICATIONS } from '@/lib/mock-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) return NextResponse.json([], { status: 200 });

    const authResult = await validatePortalToken(token);
    if (!authResult.valid || !authResult.verifiedEmail) return NextResponse.json([]);

    const { client_id: clientId } = authResult.tokenData!;
    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const { data, error } = await supabaseAdmin
          .from('portal_notifications')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          return NextResponse.json(data.map(r => ({
            id: r.id,
            clientId: r.client_id,
            workspaceId: r.workspace_id,
            type: r.type,
            title: r.title,
            message: r.message,
            read: r.read,
            targetPath: r.target_path,
            createdAt: r.created_at,
          })));
        }
      } catch (e) {
        console.warn('Supabase notifications query failed, falling back to mock:', e);
      }
    }

    return NextResponse.json(MOCK_PORTAL_NOTIFICATIONS.filter(n => n.clientId === clientId));
  } catch (err: any) {
    console.error('Portal notifications GET error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { token, ids } = await request.json();

    if (!token || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    const authResult = await validatePortalToken(token);
    if (!authResult.valid || !authResult.verifiedEmail) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { client_id: clientId } = authResult.tokenData!;
    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        await supabaseAdmin
          .from('portal_notifications')
          .update({ read: true })
          .eq('client_id', clientId)
          .in('id', ids);
      } catch (e) {
        console.warn('Supabase mark-read failed:', e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Portal notifications PATCH error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
