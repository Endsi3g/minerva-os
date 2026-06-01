import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 });
    }

    const { data: proposal, error: propErr } = await supabaseAdmin
      .from('proposals')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (propErr || !proposal) {
      return NextResponse.json({ error: 'proposal_not_found' }, { status: 404 });
    }

    // Log viewing activity
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const ua = request.headers.get('user-agent') || null;

    await supabaseAdmin.from('portal_activity_log').insert({
      workspace_id: proposal.workspace_id,
      client_id: proposal.client_id,
      event: 'proposal_viewed',
      metadata: { proposalId: proposal.id, title: proposal.title },
      ip_address: ip,
      user_agent: ua,
    });

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
