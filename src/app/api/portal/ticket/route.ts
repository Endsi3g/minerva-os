import { NextResponse } from 'next/server';
import { validatePortalToken, logPortalActivity, notifyWorkspace } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { token, subject, description, priority, category } = await request.json();

    if (!token || !subject || !description || !priority || !category) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    // 1. Validate token
    const authResult = await validatePortalToken(token);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error, expired: authResult.expired },
        { status: 401 }
      );
    }

    if (!authResult.verifiedEmail) {
      return NextResponse.json({ error: 'needs_verification' }, { status: 403 });
    }

    const { scopes, client_id: clientId, workspace_id: workspaceId, id: tokenId } = authResult.tokenData!;

    if (!scopes.includes('tickets')) {
      return NextResponse.json({ error: 'unauthorized_scope' }, { status: 403 });
    }

    // 2. Insert ticket
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .insert({
        workspace_id: workspaceId,
        client_id: clientId,
        subject,
        description,
        priority,
        category,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Log activity
    await logPortalActivity({
      workspaceId,
      tokenId,
      clientId,
      event: 'ticket_created',
      metadata: { ticketId: ticket.id, subject },
      request,
    });

    // 4. Notify workspace
    const title = `New Support Request`;
    const message = `Client submitted ticket: "${subject}" (${priority})`;
    await notifyWorkspace(workspaceId, title, message, `/app/tickets`);

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        _id: ticket.id,
        clientId: ticket.client_id,
      },
    });
  } catch (err: any) {
    console.error('Portal ticket submission error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
