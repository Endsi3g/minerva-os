import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_PORTAL_TOKENS, MOCK_CLIENTS } from '@/lib/mock-data';

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

  let tokenRow: any = null;
  let isMock = false;

  const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (hasCredentials) {
    try {
      const { data, error } = await supabaseAdmin
        .from('portal_tokens')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (!error && data) {
        tokenRow = data;
      }
    } catch (e) {
      console.warn('Supabase token query failed, falling back to mock data:', e);
    }
  }

  // Fallback to mock data if DB failed or credentials are missing
  if (!tokenRow && process.env.NODE_ENV !== 'production') {
    const mockToken = MOCK_PORTAL_TOKENS.find(t => t.token === token);
    if (mockToken) {
      tokenRow = {
        id: mockToken.token,
        workspace_id: 'mock-workspace-123',
        client_id: mockToken.clientId,
        token: mockToken.token,
        expires_at: mockToken.expiresAt,
        scopes: mockToken.scopes,
      };
      isMock = true;
    }
  }

  if (!tokenRow) return { valid: false, error: 'invalid_token' };

  // Check expiry
  if (new Date(tokenRow.expires_at) < new Date()) {
    return { valid: false, expired: true, error: 'token_expired' };
  }

  // Fetch client email
  let clientEmail = '';
  if (!isMock && hasCredentials) {
    try {
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('email')
        .eq('id', tokenRow.client_id)
        .maybeSingle();
      if (client) {
        clientEmail = client.email || '';
      }
    } catch (e) {
      console.warn('Supabase client email query failed:', e);
    }
  }

  if (!clientEmail && process.env.NODE_ENV !== 'production') {
    const mockClient = MOCK_CLIENTS.find(c => c.id === tokenRow.client_id);
    clientEmail = mockClient?.email || '';
  }

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
    maxAge: 60 * 60 * 8, // 8 hours
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

  console.log(`[Portal Activity Log] Workspace: ${params.workspaceId}, Client: ${params.clientId}, Event: ${params.event}, IP: ${ip}, UA: ${ua}`, params.metadata);

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await supabaseAdmin.from('portal_activity_log').insert({
        workspace_id: params.workspaceId,
        token_id: params.tokenId,
        client_id: params.clientId,
        event: params.event,
        metadata: params.metadata || {},
        ip_address: ip,
        user_agent: ua,
      });
    } catch (e) {
      console.warn('Failed to insert log entry into Supabase:', e);
    }
  }
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
  console.log(`[Workspace Notification] Workspace: ${workspaceId}, Title: ${title}, Message: ${message}`);

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
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
    } catch (e) {
      console.warn('Failed to notify workspace in Supabase:', e);
    }
  }
}
