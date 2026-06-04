import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import type { AgentAlert } from '../crm/route';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { workspaceId } = await req.json() as { workspaceId: string };
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

  const supabase = await createClient();

  const [{ data: invoices }, { data: retainers }] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, client_id, invoice_number, amount, status, date, due_date, paid_date')
      .eq('workspace_id', workspaceId)
      .in('status', ['sent', 'overdue', 'draft']),
    supabase
      .from('retainers')
      .select('id, client_id, amount, cycle, status, renewal_date, hours_included, hours_used')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active'),
  ]);

  const now = new Date().toISOString().slice(0, 10);
  const nowMs = Date.now();

  const invoiceSummary = (invoices || []).map((i: any) => ({
    id: i.id,
    invoice_number: i.invoice_number,
    amount: i.amount,
    status: i.status,
    days_since_sent: i.date ? Math.floor((nowMs - new Date(i.date).getTime()) / 86400000) : null,
    days_overdue: i.due_date && i.status !== 'paid'
      ? Math.max(0, Math.floor((nowMs - new Date(i.due_date).getTime()) / 86400000))
      : 0,
    due_date: i.due_date,
  }));

  const retainerSummary = (retainers || []).map((r: any) => ({
    id: r.id,
    amount: r.amount,
    cycle: r.cycle,
    days_to_renewal: r.renewal_date
      ? Math.floor((new Date(r.renewal_date).getTime() - nowMs) / 86400000)
      : null,
    hours_used_pct: r.hours_included
      ? Math.round((r.hours_used / r.hours_included) * 100)
      : null,
  }));

  if (invoiceSummary.length === 0 && retainerSummary.length === 0) {
    return NextResponse.json({ alerts: [], ran_at: new Date().toISOString() });
  }

  const prompt = `You are an expert finance agent for a creative agency. Today is ${now}.

Analyze the financial data and identify issues. Focus on:
- Invoices unseen/unpaid for 7+ days after being sent (flag as not opened)
- Overdue invoices (severity based on amount and days overdue)
- Retainers renewing within 14 days (renewal reminder)
- Retainers at 90%+ hours utilization (overuse risk)

Invoices:
${JSON.stringify(invoiceSummary, null, 2)}

Retainers:
${JSON.stringify(retainerSummary, null, 2)}

Return a JSON array (max 5 most important alerts). Each alert must exactly match this schema:
{
  "alert_type": "invoice_not_viewed" | "invoice_overdue" | "retainer_renewal" | "retainer_overuse",
  "severity": "info" | "amber" | "rose",
  "title": "<max 55 chars>",
  "description": "<actionable next step, max 100 chars>",
  "entity_type": "invoice" | "retainer",
  "entity_id": "<id from the data>",
  "entity_name": "<invoice_number or retainer description>",
  "href": "/app/finance-hub"
}

Return ONLY the JSON array with no markdown, no explanation.`;

  let alerts: AgentAlert[] = [];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a finance analysis agent. Return only valid JSON.',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      alerts = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('[Finance Agent] Claude error:', err);
  }

  if (alerts.length > 0 && user) {
    const rows = alerts.map(a => ({
      workspace_id: workspaceId,
      agent_id: null,
      action: 'finance_agent_alert',
      details: a,
      timestamp: new Date().toISOString(),
    }));
    await supabase.from('agent_audit').insert(rows);
  }

  await supabase.from('agent_audit').insert({
    workspace_id: workspaceId,
    agent_id: null,
    action: 'finance_agent_run',
    details: { alerts_generated: alerts.length, user_id: user.id },
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ alerts, ran_at: new Date().toISOString() });
}
