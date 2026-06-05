import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function resolveApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const hash = await sha256Hex(token);
  const { data } = await supabaseAdmin
    .from('api_keys')
    .select('workspace_id, scopes, revoked_at')
    .eq('key_hash', hash)
    .maybeSingle();
  if (!data || data.revoked_at) return null;
  await supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', hash);
  return data as { workspace_id: string; scopes: string[] };
}

export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const keyData = await resolveApiKey(req.headers.get('Authorization'));
  if (!keyData) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('id, number, client_id, project_id, status, total_amount, due_date, paid_at, created_at')
    .eq('workspace_id', keyData.workspace_id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  return NextResponse.json({ data });
}
