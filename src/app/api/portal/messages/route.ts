import { NextResponse } from 'next/server';
import { validatePortalToken } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_MESSAGES } from '@/lib/mock-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) return NextResponse.json([]);

    const authResult = await validatePortalToken(token);
    if (!authResult.valid || !authResult.verifiedEmail) return NextResponse.json([]);

    const { client_id: clientId } = authResult.tokenData!;
    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const { data, error } = await supabaseAdmin
          .from('portal_messages')
          .select('*')
          .eq('client_id', clientId)
          .order('sent_at', { ascending: true });

        if (!error && data) {
          return NextResponse.json(data.map(r => ({
            id: r.id,
            clientId: r.client_id,
            workspaceId: r.workspace_id,
            fromWorkspace: r.from_workspace,
            authorName: r.author_name,
            body: r.body,
            sentAt: r.sent_at,
            readAt: r.read_at,
          })));
        }
      } catch {
        // fall through to mock
      }
    }

    return NextResponse.json(MOCK_MESSAGES.filter(m => m.clientId === clientId));
  } catch (err) {
    console.error('Portal messages error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
