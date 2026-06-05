import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { isDemoMode } from '@/lib/demo';

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (!isDemoMode()) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('workspace_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!profile?.workspace_id || profile.workspace_id !== workspaceId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const supabase = await createClient();

    const [{ data: logs }, { data: clients }] = await Promise.all([
      supabase
        .from('portal_activity_log')
        .select('client_id, event, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false }),
      supabase
        .from('clients')
        .select('id, company, contact')
        .eq('workspace_id', workspaceId),
    ]);

    const clientMap = new Map<string, { company: string; contact: string }>(
      (clients ?? []).map((c: any) => [c.id, { company: c.company, contact: c.contact }])
    );

    const byClient = new Map<string, {
      clientId: string;
      clientName: string;
      visits: number;
      lastSeen: string | null;
      proposals: number;
      files: number;
      approvals: number;
    }>();

    for (const log of (logs ?? [])) {
      if (!byClient.has(log.client_id)) {
        const info = clientMap.get(log.client_id);
        byClient.set(log.client_id, {
          clientId: log.client_id,
          clientName: info?.contact || info?.company || 'Unknown',
          visits: 0,
          lastSeen: null,
          proposals: 0,
          files: 0,
          approvals: 0,
        });
      }
      const row = byClient.get(log.client_id)!;

      if (!row.lastSeen || log.created_at > row.lastSeen) {
        row.lastSeen = log.created_at;
      }

      switch (log.event) {
        case 'portal_accessed':
        case 'page_viewed':
          row.visits++;
          break;
        case 'proposal_viewed':
        case 'proposal_signed':
        case 'proposal_declined':
          row.proposals++;
          break;
        case 'file_downloaded':
          row.files++;
          break;
        case 'approval_approved':
        case 'approval_revision':
          row.approvals++;
          break;
      }
    }

    const analytics = Array.from(byClient.values()).sort((a, b) => {
      if (!a.lastSeen) return 1;
      if (!b.lastSeen) return -1;
      return b.lastSeen.localeCompare(a.lastSeen);
    });

    return NextResponse.json({ analytics });
  } catch (err) {
    console.error('[portal-analytics]', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
