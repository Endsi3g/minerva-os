import { NextResponse } from 'next/server';
import { validatePortalToken } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEFAULT_PREFS = {
  frequency: 'daily' as const,
  enabledTypes: ['approval_action', 'invoice_update', 'proposal_update', 'file_upload', 'comment'],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) return NextResponse.json(DEFAULT_PREFS);

    const authResult = await validatePortalToken(token);
    if (!authResult.valid || !authResult.verifiedEmail) return NextResponse.json(DEFAULT_PREFS);

    const { client_id: clientId } = authResult.tokenData!;
    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const { data } = await supabaseAdmin
          .from('portal_notification_prefs')
          .select('*')
          .eq('client_id', clientId)
          .maybeSingle();

        if (data) {
          return NextResponse.json({
            clientId: data.client_id,
            frequency: data.frequency,
            enabledTypes: data.enabled_types,
          });
        }
      } catch (e) {
        console.warn('Supabase notification prefs GET failed:', e);
      }
    }

    return NextResponse.json({ clientId, ...DEFAULT_PREFS });
  } catch (err: any) {
    console.error('notification-prefs GET error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { token, frequency, enabledTypes } = await request.json();

    if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 });

    const authResult = await validatePortalToken(token);
    if (!authResult.valid || !authResult.verifiedEmail) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { client_id: clientId } = authResult.tokenData!;
    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        await supabaseAdmin
          .from('portal_notification_prefs')
          .upsert({ client_id: clientId, frequency, enabled_types: enabledTypes }, { onConflict: 'client_id' });
      } catch (e) {
        console.warn('Supabase notification prefs PUT failed:', e);
      }
    } else {
      console.log(`[NotificationPrefs] ${clientId}: freq=${frequency}, types=${enabledTypes?.join(',')}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('notification-prefs PUT error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
