import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { isDemoMode } from '@/lib/demo';

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { workspaceId, lang = 'en' } = (await req.json()) as { workspaceId: string; lang?: string };
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (!isDemoMode()) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('workspace_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile?.workspace_id && profile.workspace_id !== workspaceId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const supabase = await createClient();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000).toISOString();

    const [{ data: runs }, { data: workflows }, { data: handoffs }] = await Promise.all([
      supabase.from('workflow_runs').select('*').eq('workspace_id', workspaceId).gte('started_at', thirtyDaysAgo).order('started_at', { ascending: false }).limit(50),
      supabase.from('workflows').select('id, name, trigger_event, is_active').or(`workspace_id.eq.${workspaceId},workspace_id.is.null`),
      supabase.from('handoffs').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20),
    ]);

    const failedRuns = (runs ?? []).filter((r: any) => r.status === 'failed');
    const pausedLong = (runs ?? []).filter((r: any) => r.status === 'paused' && r.resume_at && new Date(r.resume_at) < new Date(Date.now() - 24 * 3600000));
    const coveredEvents = new Set((workflows ?? []).map((w: any) => w.trigger_event));
    const allEvents = ['proposal_signed', 'project_created', 'invoice_overdue', 'approval_overdue', 'scope_change_detected'];
    const uncoveredEvents = allEvents.filter(e => !coveredEvents.has(e));
    const rejectedHandoffs = (handoffs ?? []).filter((h: any) => h.status === 'rejected');

    const summary = [
      `Workflow runs (last 30 days): ${(runs ?? []).length} total, ${failedRuns.length} failed, ${pausedLong.length} stuck paused`,
      `Active workflows: ${(workflows ?? []).filter((w: any) => w.is_active).length}`,
      `Trigger events with no coverage: ${uncoveredEvents.join(', ') || 'none'}`,
      `Rejected handoffs: ${rejectedHandoffs.length}`,
      failedRuns.length > 0 ? `Most common failure: ${failedRuns.slice(0, 3).map((r: any) => r.trigger_event).join(', ')}` : '',
    ].filter(Boolean).join('\n');

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        suggestions: [
          { trigger: 'proposal_signed', suggestedName: 'Proposal Signed — Kickoff Checklist', rationale: 'No workflow covers proposal_signed. Automate kickoff tasks when a deal closes.', urgency: 'high' },
          { trigger: 'invoice_overdue', suggestedName: 'Overdue Invoice Follow-up', rationale: 'Automate follow-up sequences for overdue invoices to improve cash flow.', urgency: 'medium' },
          { trigger: 'approval_overdue', suggestedName: 'Approval Escalation', rationale: 'Escalate stalled client approvals automatically after 48h.', urgency: 'medium' },
        ]
      });
    }

    const client = new Anthropic();
    const systemPrompt = lang === 'fr'
      ? "Tu es un analyste de processus pour une agence créative. Analyse les données de workflow et propose 3 à 5 suggestions concrètes pour améliorer l'automatisation. Réponds en JSON uniquement."
      : "You are a process analyst for a creative agency. Analyse workflow data and propose 3-5 concrete suggestions to improve automation. Reply in JSON only.";

    const userPrompt = `Workspace workflow data:\n${summary}\n\nReturn a JSON array of suggestions with fields: trigger (string), suggestedName (string), rationale (string), urgency ("high"|"medium"|"low"). No other text.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    let suggestions;
    try {
      const match = text.match(/\[[\s\S]*\]/);
      suggestions = match ? JSON.parse(match[0]) : [];
    } catch {
      suggestions = [];
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('[ai/workflow-suggestions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
