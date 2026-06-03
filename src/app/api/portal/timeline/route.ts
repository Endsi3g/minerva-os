import { NextResponse } from 'next/server';
import { validatePortalToken } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_APPROVALS, MOCK_INVOICES, MOCK_DECISIONS, MOCK_FILES, MOCK_PROJECTS } from '@/lib/mock-data';
import type { TimelineEvent, TimelineEventType } from '@/lib/types';

const PAGE_SIZE = 50;

const CLIENT_NAMES: Record<string, string> = { c1: 'Stratum Labs', c2: 'Volta Interactive' };

function buildMockTimeline(clientId: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const clientName = CLIENT_NAMES[clientId] || clientId;
  const clientProjects = MOCK_PROJECTS.filter(p => p.clientId === clientId).map(p => p.name);

  MOCK_DECISIONS.filter(d => d.clientId === clientId).forEach(d => {
    const typeMap: Record<string, TimelineEventType> = {
      approved: 'approval_approved',
      revision: 'approval_revision',
      paid: 'invoice_paid',
      signed: 'proposal_signed',
    };
    const type = typeMap[d.decision];
    if (type) {
      events.push({ id: `tl-dec-${d.id}`, type, label: type, actor: d.decidedBy, targetName: d.objectName, timestamp: d.timestamp });
    }
  });

  MOCK_APPROVALS.filter(a => a.client === clientName).forEach(a => {
    events.push({ id: `tl-app-${a.id}`, type: 'approval_submitted', label: 'approval_submitted', actor: 'Uprising Studio', targetName: a.name, timestamp: a.submittedDate + 'T08:00:00Z' });
  });

  MOCK_FILES.filter(f => clientProjects.includes(f.project)).forEach(f => {
    events.push({ id: `tl-file-${f.id}`, type: 'file_uploaded', label: 'file_uploaded', actor: 'Uprising Studio', targetName: f.name, timestamp: f.uploadedDate + 'T10:00:00Z' });
  });

  MOCK_INVOICES.filter(i => i.clientId === clientId).forEach(i => {
    if (i.status === 'paid' && i.paidDate) {
      events.push({ id: `tl-inv-${i.id}`, type: 'invoice_paid', label: 'invoice_paid', actor: clientName, targetName: `INV-${i.number}`, timestamp: i.paidDate + 'T11:00:00Z' });
    }
  });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    if (!token) return NextResponse.json({ events: [], hasMore: false });

    const authResult = await validatePortalToken(token);
    if (!authResult.valid || !authResult.verifiedEmail) {
      return NextResponse.json({ events: [], hasMore: false });
    }

    const { client_id: clientId } = authResult.tokenData!;
    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabaseAdmin
          .from('portal_activity_log')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .range(from, to + 1);

        if (!error && data) {
          const hasMore = data.length > PAGE_SIZE;
          const events: TimelineEvent[] = data.slice(0, PAGE_SIZE).map(r => ({
            id: r.id,
            type: r.event as TimelineEventType,
            label: r.event,
            actor: r.metadata?.actorName || 'Uprising Studio',
            targetName: r.metadata?.targetName,
            timestamp: r.created_at,
            metadata: r.metadata,
          }));
          return NextResponse.json({ events, hasMore });
        }
      } catch (e) {
        console.warn('Supabase timeline query failed, falling back to mock:', e);
      }
    }

    const allEvents = buildMockTimeline(clientId);
    const from = (page - 1) * PAGE_SIZE;
    const slice = allEvents.slice(from, from + PAGE_SIZE);
    return NextResponse.json({ events: slice, hasMore: allEvents.length > from + PAGE_SIZE });
  } catch (err: any) {
    console.error('Portal timeline error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
