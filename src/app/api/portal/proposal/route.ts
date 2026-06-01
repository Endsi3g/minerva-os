import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_PROPOSALS } from '@/lib/mock-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 });
    }

    let proposal: any = null;
    let isMock = false;

    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const { data, error: propErr } = await supabaseAdmin
          .from('proposals')
          .select('*')
          .eq('token', token)
          .maybeSingle();

        if (!propErr && data) {
          proposal = data;
        }
      } catch (e) {
        console.warn('Failed to fetch proposal from Supabase, falling back to mock:', e);
      }
    }

    if (!proposal) {
      const mockProp = MOCK_PROPOSALS.find(p => p.token === token);
      if (mockProp) {
        proposal = mockProp;
        isMock = true;
      }
    }

    if (!proposal) {
      return NextResponse.json({ error: 'proposal_not_found' }, { status: 404 });
    }

    // Log viewing activity
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const ua = request.headers.get('user-agent') || null;

    if (!isMock && hasCredentials) {
      try {
        await supabaseAdmin.from('portal_activity_log').insert({
          workspace_id: proposal.workspace_id,
          client_id: proposal.client_id,
          event: 'proposal_viewed',
          metadata: { proposalId: proposal.id, title: proposal.title },
          ip_address: ip,
          user_agent: ua,
        });
      } catch (e) {
        console.warn('Failed to insert proposal view log into Supabase:', e);
      }
    } else {
      console.log(`[Proposal Viewed] ID: ${proposal.id}, Title: ${proposal.title}, IP: ${ip}, UA: ${ua}`);
    }

    return NextResponse.json({
      ...proposal,
      _id: proposal.id,
      totalAmount: Number(proposal.total_amount),
      validUntil: proposal.valid_until,
      signedBy: proposal.signed_by,
    });
  } catch (err: any) {
    console.error('Proposal portal fetch error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
