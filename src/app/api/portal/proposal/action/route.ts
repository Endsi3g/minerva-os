import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { notifyWorkspace, validatePortalToken } from '@/lib/portal-auth';
import { MOCK_PROPOSALS } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Supports two formats:
    // Portal format: { token: portalToken, proposalId, action: 'sign' | 'decline' }
    // Legacy format: { token: proposalToken, status: 'signed' | 'declined', signedBy? }
    const isPortalFormat = !!body.proposalId;

    let portalClientId: string | null = null;
    let portalClientName = 'Client';
    let proposalId: string | null = null;
    let status: 'signed' | 'declined';
    let signedBy: string | undefined;

    if (isPortalFormat) {
      const authResult = await validatePortalToken(body.token);
      if (!authResult.valid || !authResult.verifiedEmail) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      portalClientId = authResult.tokenData!.client_id;
      const hasC = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (hasC) {
        try {
          const { data: c } = await supabaseAdmin.from('clients').select('company, contact').eq('id', portalClientId).maybeSingle();
          if (c) portalClientName = c.contact || c.company || 'Client';
        } catch {}
      } else {
        const { MOCK_CLIENTS } = await import('@/lib/mock-data');
        const mc = MOCK_CLIENTS.find(c => c.id === portalClientId);
        if (mc) portalClientName = mc.contact || mc.company || 'Client';
      }
      proposalId = body.proposalId;
      status = body.action === 'sign' ? 'signed' : 'declined';
      // Prefer explicit signer name from modal; fall back to portal client name
      signedBy = body.signerName?.trim() || portalClientName;
    } else {
      const { token: propToken, status: s, signedBy: sb } = body;
      if (!propToken || !s) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
      if (s !== 'signed' && s !== 'declined') return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
      status = s;
      signedBy = sb;
      proposalId = null;
    }

    if (status === 'signed' && (!signedBy || !signedBy.trim())) {
      return NextResponse.json({ error: 'missing_signer_name' }, { status: 400 });
    }

    // 1. Fetch proposal
    let proposal: any = null;
    let isMock = false;

    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const query = isPortalFormat
          ? supabaseAdmin.from('proposals').select('*').eq('id', proposalId).maybeSingle()
          : supabaseAdmin.from('proposals').select('*').eq('token', body.token).maybeSingle();

        const { data: dbProposal, error: propErr } = await query;
        if (!propErr && dbProposal) {
          proposal = dbProposal;
          if (portalClientId && proposal.client_id !== portalClientId) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch proposal from Supabase, falling back to mock:', e);
      }
    }

    if (!proposal) {
      const mockProp = isPortalFormat
        ? MOCK_PROPOSALS.find(p => p.id === proposalId)
        : MOCK_PROPOSALS.find(p => p.token === body.token);
      if (mockProp) {
        proposal = mockProp;
        isMock = true;
      }
    }

    if (!proposal) {
      return NextResponse.json({ error: 'proposal_not_found' }, { status: 404 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const ua = request.headers.get('user-agent') || null;
    const signer = (signedBy || '').trim();

    // 2. Perform updates
    if (status === 'signed') {
      if (!isMock && hasCredentials) {
        try {
          const { error: updateErr } = await supabaseAdmin
            .from('proposals')
            .update({ status: 'signed', signed_at: new Date().toISOString(), signed_by: signer })
            .eq('id', proposal.id);

          if (updateErr) throw updateErr;

          await supabaseAdmin.from('portal_activity_log').insert({
            workspace_id: proposal.workspace_id,
            client_id: proposal.client_id,
            event: 'proposal_signed',
            metadata: { proposalId: proposal.id, title: proposal.title, signedBy: signer },
            ip_address: ip,
            user_agent: ua,
          });
        } catch (e) {
          console.warn('Failed to sign proposal in Supabase:', e);
        }
      } else {
        proposal.status = 'signed';
        proposal.signed_by = signer;
        proposal.signed_at = new Date().toISOString();
        console.log(`[Proposal Signed] ID: ${proposal.id}, SignedBy: ${signer}`);
      }

      await notifyWorkspace(
        proposal.workspace_id,
        'Proposal Signed',
        `Proposal "${proposal.title}" has been signed by ${signer}`,
        `/app/proposals`
      );
    } else {
      if (!isMock && hasCredentials) {
        try {
          const { error: updateErr } = await supabaseAdmin
            .from('proposals')
            .update({ status: 'declined' })
            .eq('id', proposal.id);

          if (updateErr) throw updateErr;

          await supabaseAdmin.from('portal_activity_log').insert({
            workspace_id: proposal.workspace_id,
            client_id: proposal.client_id,
            event: 'proposal_declined',
            metadata: { proposalId: proposal.id, title: proposal.title },
            ip_address: ip,
            user_agent: ua,
          });
        } catch (e) {
          console.warn('Failed to decline proposal in Supabase:', e);
        }
      } else {
        proposal.status = 'declined';
        console.log(`[Proposal Declined] ID: ${proposal.id}`);
      }

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
