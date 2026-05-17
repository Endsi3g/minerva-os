/**
 * Lightweight Convex HTTP client for the MCP server.
 * Calls Convex query/mutation/action HTTP endpoints directly.
 */

const CONVEX_URL = process.env.CONVEX_URL ?? '';

if (!CONVEX_URL) {
  console.warn('[minerva-mcp] CONVEX_URL not set — Convex tools will return empty results');
}

type ConvexArgs = Record<string, unknown>;

export async function convexQuery(name: string, args: ConvexArgs = {}): Promise<unknown> {
  if (!CONVEX_URL) return null;
  const url = `${CONVEX_URL}/api/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: name, args }),
  });
  if (!res.ok) throw new Error(`Convex query ${name} failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as { value: unknown };
  return data.value;
}

export async function convexMutation(name: string, args: ConvexArgs = {}): Promise<unknown> {
  if (!CONVEX_URL) throw new Error('CONVEX_URL not configured');
  const url = `${CONVEX_URL}/api/mutation`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: name, args }),
  });
  if (!res.ok) throw new Error(`Convex mutation ${name} failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as { value: unknown };
  return data.value;
}
