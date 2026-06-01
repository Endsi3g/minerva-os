import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

const PORTAL_COOKIE = 'minerva_portal_email';

interface PortalTokenData {
  id: string;
  workspace_id: string;
  client_id: string;
  token: string;
  expires_at: string;
  scopes: string[];
}

interface PortalAuthResult {
  valid: boolean;
  expired?: boolean;
  tokenData?: PortalTokenData;
  clientEmail?: string;
  verifiedEmail?: string;
  error?: string;
}

/**
 * Validates a portal token and checks email verification.
 * Returns token data + verified email if the cookie matches the client's email.
 */
export async function validatePortalToken(token: string): Promise<PortalAuthResult> {
  if (!token) return { valid: false, error: 'missing_token' };

  const { data: tokenRow, error } = await supabaseAdmin
    .from('portal_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error || !tokenRow) return { valid: false, error: 'invalid_token' };

  // Check expiry
  if (new Date(tokenRow.expires_at) < new Date()) {
    return { valid: false, expired: true, error: 'token_expired' };
  }

  // Fetch client email
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('email')
    .eq('id', tokenRow.client_id)
    .maybeSingle();

  const clientEmail = client?.email || '';

  // Check email cookie
  const cookieStore = await cookies();
  const emailCookie = cookieStore.get(PORTAL_COOKIE)?.value;
  const verifiedEmail = emailCookie && emailCookie.toLowerCase() === clientEmail.toLowerCase()
    ? emailCookie
    : undefined;

  return {
    valid: true,
    tokenData: tokenRow as PortalTokenData,
    clientEmail,
    verifiedEmail,
  };
}

/**
 * Sets the portal email verification cookie.
 */
export async function setPortalEmailCookie(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_COOKIE, email.toLowerCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/portal',
  });
}

/**
 * Logs a portal activity event.
 */
export async function logPortalActivity(params: {
  workspaceId: string;
  tokenId: string;
  clientId: string;
  event: string;
  metadata?: Record<string, unknown>;
  request?: Request;
}) {
  const ip = params.request?.headers.get('x-forwarded-for')
    || params.request?.headers.get('x-real-ip')
    || null;
  const ua = params.request?.headers.get('user-agent') || null;

  await supabaseAdmin.from('portal_activity_log').insert({
    workspace_id: params.workspaceId,
    token_id: params.tokenId,
    client_id: params.clientId,
    event: params.event,
    metadata: params.metadata || {},
    ip_address: ip,
    user_agent: ua,
  });
}

/**
 * Creates notifications for all team members in a workspace.
 */
export async function notifyWorkspace(
  workspaceId: string,
  title: string,
  message: string,
  targetUrl?: string
) {
  const { data: users } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('workspace_id', workspaceId);

  if (users && users.length > 0) {
    const notificationsToInsert = users.map(u => ({
      workspace_id: workspaceId,
      user_id: u.id,
      title,
      message,
      type: 'status_change',
      read: false,
      target_url: targetUrl || null,
    }));

    await supabaseAdmin.from('notifications').insert(notificationsToInsert);
  }
}
