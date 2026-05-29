/**
 * Lightweight Supabase REST client for the MCP server.
 * Calls Supabase PostgREST and RPC endpoints directly using fetch.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[minerva-mcp] SUPABASE_URL or SUPABASE_KEY not set — data tools will return empty results');
}

const headers = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer': 'return=representation',
});

export async function supabaseSelect(table: string, params: Record<string, string> = {}): Promise<unknown[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { method: 'GET', headers: headers() });
  if (!res.ok) {
    console.error(`[minerva-mcp] supabaseSelect(${table}) failed: ${res.status} ${await res.text()}`);
    return [];
  }
  return (await res.json()) as unknown[];
}

export async function supabaseInsert(table: string, row: Record<string, unknown>): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase not configured');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers(), 'Prefer': 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`supabaseInsert(${table}) failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as unknown[];
  return data[0];
}

export async function supabasePatch(
  table: string,
  filter: Record<string, string>,
  updates: Record<string, unknown>,
): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase not configured');
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(filter)) {
    url.searchParams.set(k, `eq.${v}`);
  }
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`supabasePatch(${table}) failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as unknown[];
  return data[0] ?? null;
}

/** Get the first workspace ID from the workspaces table. */
export async function getWorkspaceId(): Promise<string | null> {
  const rows = await supabaseSelect('workspaces', { limit: '1' }) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}
