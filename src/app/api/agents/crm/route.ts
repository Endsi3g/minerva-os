import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AgentAlert {
  alert_type: string;
  severity: 'info' | 'amber' | 'rose';
  title: string;
  description: string;
  entity_type: 'deal' | 'project' | 'invoice' | 'retainer';
  entity_id: string;
  entity_name: string;
  href: string;
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { workspaceId } = await req.json() as { workspaceId: string };
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

  const supabase = await createClient();

  const { data: deals } = await supabase
    .from('deals')
    .select('id, company, contact, email, value, stage, notes, last_contact, updated_at, created_at')
    .eq('workspace_id', workspaceId)
    .not('stage', 'in', '("won","lost")');

  if (!deals || deals.length === 0) {
    return NextResponse.json({ alerts: [], ran_at: new Date().toISOString() });
  }

  const now = new Date().toISOString().slice(0, 10);
  const dealsSummary = deals.map((d: any) => ({
    id: d.id,
    company: d.company,
    value: d.value,
    stage: d.stage,
    days_since_update: Math.floor((Date.now() - new Date(d.updated_at || d.created_at).getTime()) / 86400000),
    days_since_contact: d.last_contact
      ? Math.floor((Date.now() - new Date(d.last_contact).getTime()) / 86400000)
      : null,
  }));

  const prompt = `You are an expert CRM agent for a creative agency. Today is ${now}.

Analyze these pipeline deals and identify which ones need immediate attention. Focus on:
- Deals stalling (no update in 5+ days in proposal/negotiation stage)
- High-value deals at risk (large value + long time without contact)
- Deals stuck in new_lead for too long (10+ days)

Deals data:
${JSON.stringify(dealsSummary, null, 2)}

Return a JSON array (max 5 most important alerts). Each alert must exactly match this schema:
{
  "alert_type": "stale_deal" | "at_risk_deal" | "cold_lead",
  "severity": "info" | "amber" | "rose",
  "title": "<max 55 chars>",
  "description": "<actionable next step, max 100 chars>",
  "entity_type": "deal",
  "entity_id": "<id from the data>",
  "entity_name": "<company name>",
  "href": "/app/pipeline"
}

Return ONLY the JSON array with no markdown, no explanation.`;

  let alerts: AgentAlert[] = [];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a CRM analysis agent. Return only valid JSON.',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      alerts = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('[CRM Agent] Claude error:', err);
  }

  // Write alerts to agent_audit for dashboard consumption
  if (alerts.length > 0 && user) {
    const rows = alerts.map(a => ({
      workspace_id: workspaceId,
      agent_id: null,
      action: 'crm_agent_alert',
      details: a,
      timestamp: new Date().toISOString(),
    }));
    await supabase.from('agent_audit').insert(rows);
  }

  // Log the run itself
  await supabase.from('agent_audit').insert({
    workspace_id: workspaceId,
    agent_id: null,
    action: 'crm_agent_run',
    details: { alerts_generated: alerts.length, user_id: user.id },
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ alerts, ran_at: new Date().toISOString() });
}
