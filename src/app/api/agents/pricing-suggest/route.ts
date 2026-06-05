import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;
  void user;

  const { workspaceId, serviceType, budget } = await req.json() as {
    workspaceId: string;
    serviceType: string;
    budget?: number;
  };

  if (!workspaceId || !serviceType) {
    return NextResponse.json({ error: 'workspaceId and serviceType required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Query past proposals for similar service types (match on title keywords)
  const keywords = serviceType.toLowerCase().split(/[\s/]+/).filter(w => w.length > 2);
  const orFilter = keywords.map(k => `title.ilike.%${k}%`).join(',');

  const [{ data: proposals }, { data: projects }] = await Promise.all([
    supabase
      .from('proposals')
      .select('title, total_amount, status')
      .eq('workspace_id', workspaceId)
      .or(orFilter || 'status.eq.draft')
      .in('status', ['sent', 'signed'])
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('projects')
      .select('name, budget')
      .eq('workspace_id', workspaceId)
      .or(orFilter || 'status.eq.active')
      .gt('budget', 0)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const amounts: number[] = [];

  (proposals || []).forEach((p: any) => {
    if (p.total_amount > 0) amounts.push(Number(p.total_amount));
  });
  (projects || []).forEach((p: any) => {
    if (p.budget > 0) amounts.push(Number(p.budget));
  });

  if (amounts.length === 0) {
    // No history — return a sensible default based on service type
    const defaults: Record<string, [number, number]> = {
      'brand identity': [8000, 18000],
      'web design': [6000, 15000],
      'web development': [10000, 25000],
      'content strategy': [3000, 8000],
      'ux audit': [4000, 10000],
      'development': [8000, 20000],
      'retainer': [2000, 6000],
    };
    const key = Object.keys(defaults).find(k => serviceType.toLowerCase().includes(k)) ?? '';
    const [min, max] = defaults[key] ?? [5000, 15000];
    return NextResponse.json({
      suggested_min: min,
      suggested_max: max,
      based_on_count: 0,
      insight: `No past projects found for this service type. Showing market estimate.`,
    });
  }

  amounts.sort((a, b) => a - b);
  const p25 = amounts[Math.floor(amounts.length * 0.25)] ?? amounts[0];
  const p75 = amounts[Math.floor(amounts.length * 0.75)] ?? amounts[amounts.length - 1];
  const median = amounts[Math.floor(amounts.length / 2)];

  // If client provided a budget, flag if it's below the lower quartile
  let insight = `Based on ${amounts.length} past project${amounts.length !== 1 ? 's' : ''} · Median: $${median.toLocaleString()}`;
  if (budget && budget < p25 * 0.7) {
    insight += ` · Budget appears below typical range`;
  }

  return NextResponse.json({
    suggested_min: Math.round(p25 / 500) * 500,
    suggested_max: Math.round(p75 / 500) * 500,
    based_on_count: amounts.length,
    insight,
  });
}
