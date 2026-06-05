import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hermes@uprising.studio';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Minerva OS';

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendBriefingEmail(to: string, userName: string, sections: any[], workspaceName: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[workspace-digest] No RESEND_API_KEY — skipping email send (1 recipient)`);
    return true;
  }

  const sectionHtml = sections.map((s: any) => {
    const itemsHtml = s.items.length === 0
      ? `<p style="margin:0;font-size:12px;color:#8A9099;font-style:italic;">Nothing to report.</p>`
      : s.items.map((item: any) => `
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;">
          <span style="color:#8A9099;font-size:11px;margin-top:2px;">·</span>
          <p style="margin:0;font-size:12px;color:#B8BDC7;line-height:1.5;">${escapeHtml(item.label ?? '')}</p>
        </div>`).join('');
    return `
      <div style="margin-bottom:20px;padding:16px;background:#111522;border:1px solid rgba(255,255,255,0.07);border-radius:12px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#F5F1E8;">${escapeHtml(s.emoji ?? '')} ${escapeHtml(s.title ?? '')} <span style="font-size:11px;font-weight:400;color:#8A9099;">(${s.items.length})</span></p>
        ${itemsHtml}
        ${s.ai_summary ? `<p style="margin:10px 0 0;font-size:11px;color:#8A9099;font-style:italic;border-top:1px solid rgba(255,255,255,0.05);padding-top:8px;">${escapeHtml(s.ai_summary)}</p>` : ''}
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#0A0D14;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:40px auto;padding:0 20px;">
    <tr><td>
      <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#7FA38A;margin:0 0 12px;">${escapeHtml(workspaceName)} · ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:400;color:#F5F1E8;font-family:Georgia,serif;">☀️ Minerva Daily</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#8A9099;">Good morning, ${escapeHtml(userName)}. Here's your workspace briefing.</p>
      ${sectionHtml}
      <p style="margin:28px 0 0;font-size:11px;color:#8A9099;text-align:center;">Powered by Hermes · Minerva OS · <a href="#" style="color:#8A9099;">Manage preferences</a></p>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject: `☀️ Minerva Daily — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'cron_not_configured' }, { status: 500 });
  }
  const secret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ sent: 0, note: 'Supabase not configured' });
  }

  try {
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, name, email, workspace_id, notification_prefs')
      .not('notification_prefs->daily_briefing_email', 'is', null);

    const eligible = (profiles ?? []).filter(
      (p: any) => p.notification_prefs?.daily_briefing_email === true && p.email
    );

    let sent = 0;

    await Promise.allSettled(
      eligible.map(async (profile: any) => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/ai/daily-briefing`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-cron': process.env.CRON_SECRET ?? '',
            },
            body: JSON.stringify({
              workspaceId: profile.workspace_id,
              userRole: profile.notification_prefs?.role ?? 'owner',
              lang: profile.notification_prefs?.lang ?? 'en',
            }),
          });

          if (!res.ok) return;

          const briefing = await res.json();
          if (!briefing.sections) return;

          const { data: workspace } = await supabaseAdmin
            .from('workspaces')
            .select('name')
            .eq('id', profile.workspace_id)
            .maybeSingle();

          const ok = await sendBriefingEmail(
            profile.email,
            profile.name || 'there',
            briefing.sections,
            workspace?.name ?? 'Minerva OS',
          );

          if (ok) sent++;
        } catch (e) {
          console.error('[workspace-digest] error for profile', profile.id, e);
        }
      })
    );

    return NextResponse.json({ sent });
  } catch (err) {
    console.error('[workspace-digest]', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
