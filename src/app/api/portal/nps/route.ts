import { NextResponse } from 'next/server';
import { validatePortalToken, logPortalActivity, notifyWorkspace } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { token, score, reason, suggestion } = await request.json();

    if (!token || score === undefined || score === null) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      return NextResponse.json({ error: 'invalid_score' }, { status: 400 });
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

    if (!scopes.includes('nps')) {
      return NextResponse.json({ error: 'unauthorized_scope' }, { status: 403 });
    }

    // 2. Insert NPS response
    const { data: nps, error } = await supabaseAdmin
      .from('nps_responses')
      .insert({
        workspace_id: workspaceId,
        client_id: clientId,
        score: numericScore,
        reason: reason || null,
        suggestion: suggestion || null,
        trigger_event: 'manual',
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Log activity
    await logPortalActivity({
      workspaceId,
      tokenId,
      clientId,
      event: 'nps_submitted',
      metadata: { npsId: nps.id, score: numericScore },
      request,
    });

    // 4. Notify workspace
    const title = `New NPS Response`;
    const message = `Client rated satisfaction: ${numericScore}/10`;
    await notifyWorkspace(workspaceId, title, message, `/app/nps`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Portal NPS submission error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
