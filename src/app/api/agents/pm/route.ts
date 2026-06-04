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

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, client_name, status, due_date, budget, health_score, active_risk_flags, created_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active'),
    supabase
      .from('tasks')
      .select('id, project_id, title, status, priority, due_date, created_at')
      .eq('workspace_id', workspaceId)
      .in('status', ['todo', 'in_progress', 'blocked']),
  ]);

  if (!projects || projects.length === 0) {
    return NextResponse.json({ alerts: [], ran_at: new Date().toISOString() });
  }

  const now = new Date().toISOString().slice(0, 10);

  const projectsSummary = projects.map((p: any) => {
    const tasksForProject = (tasks || []).filter((t: any) => t.project_id === p.id);
    const blockedTasks = tasksForProject.filter((t: any) => t.status === 'blocked').length;
    const totalTasks = tasksForProject.length;
    const dueDaysLeft = p.due_date
      ? Math.floor((new Date(p.due_date).getTime() - Date.now()) / 86400000)
      : null;
    const ageInDays = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000);
    const tasksAddedAfterDay3 = tasksForProject.filter((t: any) => {
      const taskAge = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000);
      return ageInDays > 3 && taskAge < ageInDays - 2;
    }).length;

    return {
      id: p.id,
      name: p.name,
      client: p.client_name,
      due_days_left: dueDaysLeft,
      health_score: p.health_score,
      risk_flags: p.active_risk_flags?.length || 0,
      blocked_tasks: blockedTasks,
      total_tasks: totalTasks,
      tasks_added_late: tasksAddedAfterDay3,
    };
  });

  const prompt = `You are an expert project management agent for a creative agency. Today is ${now}.

Analyze these active projects and identify risks. Focus on:
- Projects with due dates within 7 days and low completion
- Projects with blocked tasks that may stall delivery
- Scope drift (tasks added late in the project lifecycle)
- Low health scores (below 70)

Projects data:
${JSON.stringify(projectsSummary, null, 2)}

Return a JSON array (max 5 most critical alerts). Each alert must exactly match this schema:
{
  "alert_type": "overdue_risk" | "blocked_tasks" | "scope_drift" | "low_health",
  "severity": "info" | "amber" | "rose",
  "title": "<max 55 chars>",
  "description": "<actionable next step, max 100 chars>",
  "entity_type": "project",
  "entity_id": "<id from the data>",
  "entity_name": "<project name>",
  "href": "/app/projects"
}

Return ONLY the JSON array with no markdown, no explanation.`;

  let alerts: AgentAlert[] = [];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a PM analysis agent. Return only valid JSON.',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      alerts = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('[PM Agent] Claude error:', err);
  }

  if (alerts.length > 0 && user) {
    const rows = alerts.map(a => ({
      workspace_id: workspaceId,
      agent_id: null,
      action: 'pm_agent_alert',
      details: a,
      timestamp: new Date().toISOString(),
    }));
    await supabase.from('agent_audit').insert(rows);
  }

  await supabase.from('agent_audit').insert({
    workspace_id: workspaceId,
    agent_id: null,
    action: 'pm_agent_run',
    details: { alerts_generated: alerts.length, user_id: user.id },
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ alerts, ran_at: new Date().toISOString() });
}
