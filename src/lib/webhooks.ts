import { supabaseAdmin } from '@/lib/supabase/admin';

export type WebhookEvent =
  | 'proposal_signed'
  | 'invoice_paid'
  | 'approval_approved'
  | 'project_created'
  | 'client_created';

async function hmacSignature(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function dispatchWebhook(
  workspaceId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasCredentials) return;

  try {
    const { data: hooks } = await supabaseAdmin
      .from('webhooks')
      .select('id, url, events, secret')
      .eq('workspace_id', workspaceId)
      .eq('active', true);

    if (!hooks?.length) return;

    const matching = hooks.filter((h: any) => (h.events as string[]).includes(event));
    if (!matching.length) return;

    const body = JSON.stringify({ event, workspaceId, data: payload, timestamp: new Date().toISOString() });

    await Promise.allSettled(
      matching.map(async (hook: any) => {
        const sig = await hmacSignature(hook.secret, body);
        const now = new Date().toISOString();
        let status = 0;
        try {
          const res = await fetch(hook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Minerva-Signature': `sha256=${sig}`,
              'X-Minerva-Event': event,
            },
            body,
            signal: AbortSignal.timeout(8000),
          });
          status = res.status;
        } catch {
          status = 0;
        }
        await supabaseAdmin
          .from('webhooks')
          .update({ last_delivery_at: now, last_status: status })
          .eq('id', hook.id);
      })
    );
  } catch (err) {
    console.error('[webhooks] dispatch error:', err);
  }
}
