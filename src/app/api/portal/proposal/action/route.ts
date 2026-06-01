import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { notifyWorkspace } from '@/lib/portal-auth';

export async function POST(request: Request) {
  try {
    const { token, status, signedBy } = await request.json();

    if (!token || !status) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    if (status !== 'signed' && status !== 'declined') {
      return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
    }

    // 1. Fetch proposal
    const { data: proposal, error: propErr } = await supabaseAdmin
      .from('proposals')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (propErr || !proposal) {
      return NextResponse.json({ error: 'proposal_not_found' }, { status: 404 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const ua = request.headers.get('user-agent') || null;

    // 2. Perform updates
    if (status === 'signed') {
      if (!signedBy || !signedBy.trim()) {
        return NextResponse.json({ error: 'missing_signer_name' }, { status: 400 });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('proposals')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_by: signedBy.trim(),
        })
        .eq('token', token);

      if (updateErr) throw updateErr;

      // Log activity
      await supabaseAdmin.from('portal_activity_log').insert({
        workspace_id: proposal.workspace_id,
        client_id: proposal.client_id,
        event: 'proposal_signed',
        metadata: { proposalId: proposal.id, title: proposal.title, signedBy: signedBy.trim() },
        ip_address: ip,
        user_agent: ua,
      });

      // Notify workspace
      await notifyWorkspace(
        proposal.workspace_id,
        'Proposal Signed',
        `Proposal "${proposal.title}" has been signed by ${signedBy.trim()}`,
        `/app/proposals`
      );
    } else {
      const { error: updateErr } = await supabaseAdmin
        .from('proposals')
        .update({
          status: 'declined',
        })
        .eq('token', token);

      if (updateErr) throw updateErr;

      // Log activity
      await supabaseAdmin.from('portal_activity_log').insert({
        workspace_id: proposal.workspace_id,
        client_id: proposal.client_id,
        event: 'proposal_declined',
        metadata: { proposalId: proposal.id, title: proposal.title },
        ip_address: ip,
        user_agent: ua,
      });

      // Notify workspace
      await notifyWorkspace(
        proposal.workspace_id,
        'Proposal Declined',
        `Proposal "${proposal.title}" was declined by client`,
        `/app/proposals`
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Proposal action error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
