import { NextResponse } from 'next/server';
import { validatePortalToken } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_DECISIONS } from '@/lib/mock-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 });

    const authResult = await validatePortalToken(token);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error, expired: authResult.expired }, { status: 401 });
    }
    if (!authResult.verifiedEmail) {
      return NextResponse.json({ error: 'needs_verification' }, { status: 403 });
    }

    const { client_id: clientId } = authResult.tokenData!;
    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const { data, error } = await supabaseAdmin
          .from('portal_decisions')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return NextResponse.json(data.map(r => ({
            id: r.id,
            workspaceId: r.workspace_id,
            clientId: r.client_id,
            objectType: r.object_type,
            objectId: r.object_id,
            objectName: r.object_name,
            decision: r.decision,
            note: r.note,
            decidedBy: r.decided_by,
            timestamp: r.created_at,
          })));
        }
      } catch (e) {
        console.warn('Supabase decisions query failed, falling back to mock:', e);
      }
    }

    const mock = MOCK_DECISIONS.filter(d => d.clientId === clientId);
    return NextResponse.json(mock);
  } catch (err: any) {
    console.error('Portal decisions GET error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, clientId, objectType, objectId, objectName, decision, note, decidedBy } = body;

    if (!workspaceId || !clientId || !objectType || !objectId || !objectName || !decision || !decidedBy) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (hasCredentials) {
      try {
        const { error } = await supabaseAdmin.from('portal_decisions').insert({
          workspace_id: workspaceId,
          client_id: clientId,
          object_type: objectType,
          object_id: objectId,
          object_name: objectName,
          decision,
          note: note || null,
          decided_by: decidedBy,
        });
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase decision insert failed:', e);
      }
    } else {
      console.log(`[Decision logged] ${clientId} — ${objectName}: ${decision}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Portal decisions POST error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
