import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendPortalDigest } from '@/lib/portal-email';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasCredentials) {
    return NextResponse.json({ sent: 0, message: 'No Supabase credentials — skipping digest' });
  }

  try {
    const { data: prefs } = await supabaseAdmin
      .from('portal_notification_prefs')
      .select('client_id, frequency, enabled_types')
      .in('frequency', ['daily', 'weekly']);

    if (!prefs || prefs.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let sent = 0;
    for (const pref of prefs) {
      try {
        const { data: notifications } = await supabaseAdmin
          .from('portal_notifications')
          .select('*')
          .eq('client_id', pref.client_id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!notifications || notifications.length === 0) continue;

        const { data: client } = await supabaseAdmin
          .from('clients')
          .select('email, company')
          .eq('id', pref.client_id)
          .maybeSingle();

        if (!client?.email) continue;

        const { data: tokenRow } = await supabaseAdmin
          .from('portal_tokens')
          .select('token')
          .eq('client_id', pref.client_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const portalUrl = tokenRow ? `${baseUrl}/portal/${tokenRow.token}` : baseUrl;
        const workspaceName = process.env.WORKSPACE_NAME || 'Uprising Studio';

        const result = await sendPortalDigest(
          client.email,
          client.company,
          notifications.map(n => ({
            title: n.title,
            message: n.message,
            targetPath: n.target_path,
            createdAt: n.created_at,
          })),
          workspaceName,
          portalUrl,
        );

        if (result.ok) {
          await supabaseAdmin
            .from('portal_notifications')
            .update({ read: true })
            .eq('client_id', pref.client_id)
            .in('id', notifications.map(n => n.id));

          sent++;
        }
      } catch (e) {
        console.warn(`Digest failed for client ${pref.client_id}:`, e);
      }
    }

    return NextResponse.json({ sent });
  } catch (err: any) {
    console.error('Email digest error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
