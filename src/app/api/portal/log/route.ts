import { NextResponse } from 'next/server';
import { validatePortalToken, logPortalActivity } from '@/lib/portal-auth';

const ALLOWED_EVENTS = [
  'page_viewed',
  'file_downloaded',
  'invoice_downloaded',
  'portal_accessed',
];

export async function POST(request: Request) {
  try {
    const { token, event, metadata } = await request.json();

    if (!token || !event) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    if (!ALLOWED_EVENTS.includes(event)) {
      return NextResponse.json({ error: 'invalid_event' }, { status: 400 });
    }

    // Validate token
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

    const { client_id: clientId, workspace_id: workspaceId, id: tokenId } = authResult.tokenData!;

    // Log the activity
    await logPortalActivity({
      workspaceId,
      tokenId,
      clientId,
      event,
      metadata: metadata || {},
      request,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Portal activity log route error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
