import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { isDemoMode } from '@/lib/demo';

function resolveTokens(str: string, ctx: Record<string, unknown>): string {
  return str.replace(/\{\{([\w.]+)\}\}/g, (_match, path: string) => {
    const value = path.split('.').reduce<unknown>((obj, key) => {
      if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
      return undefined;
    }, ctx);
    return value != null ? String(value) : '';
  });
}

async function executeSteps(
  supabase: Awaited<ReturnType<typeof createClient>>,
  steps: any[],
  context: Record<string, unknown>,
  runId: string,
  workspaceId: string,
): Promise<{ stepsLog: any[]; paused: boolean; pauseAt?: string }> {
  const stepsLog: any[] = [];
  let paused = false;
  let pauseAt: string | undefined;

  for (const step of steps) {
    const ts = new Date().toISOString();
    const cfg = step.config as Record<string, unknown>;

    try {
      switch (step.step_type) {
        case 'validate_required_fields': {
          const fields = (cfg.fields as string[]) ?? [];
          const missing = fields.filter(f => {
            const val = f.split('.').reduce<unknown>((o, k) => {
              if (o && typeof o === 'object') return (o as Record<string, unknown>)[k];
              return undefined;
            }, context);
            return val == null || val === '';
          });
          if (missing.length > 0) {
            stepsLog.push({ stepOrder: step.step_order, action: 'validate_required_fields', result: `failed: missing ${missing.join(', ')}`, ts });
            await supabase.from('workflow_runs').update({ status: 'failed', error_message: `Missing required fields: ${missing.join(', ')}`, completed_at: ts }).eq('id', runId);
            return { stepsLog, paused: false };
          }
          stepsLog.push({ stepOrder: step.step_order, action: 'validate_required_fields', result: 'ok', ts });
          break;
        }

        case 'condition': {
          const field = resolveTokens(String(cfg.field ?? ''), context);
          const operator = String(cfg.operator ?? 'equals');
          const expected = String(cfg.value ?? '');
          const actual = field;
          let pass = false;
          if (operator === 'equals') pass = actual === expected;
          else if (operator === 'not_equals') pass = actual !== expected;
          else if (operator === 'greater_than') pass = parseFloat(actual) > parseFloat(expected);
          else if (operator === 'less_than') pass = parseFloat(actual) < parseFloat(expected);
          else if (operator === 'contains') pass = actual.includes(expected);
          stepsLog.push({ stepOrder: step.step_order, action: 'condition', result: pass ? 'pass' : 'skip_remaining', ts });
          if (!pass) return { stepsLog, paused: false };
          break;
        }

        case 'create_task': {
          const title = resolveTokens(String(cfg.title ?? 'Task'), context);
          const role = String(cfg.assigneeRole ?? '');
          const dueDays = Number(cfg.dueDays ?? 3);
          const priority = String(cfg.priority ?? 'medium');
          const dueDate = new Date(Date.now() + dueDays * 86400000).toISOString().split('T')[0];

          let assigneeId: string | null = null;
          if (role) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('user_id')
              .eq('workspace_id', workspaceId)
              .eq('role', role)
              .maybeSingle();
            assigneeId = profile?.user_id ?? null;
          }

          await supabase.from('tasks').insert({
            workspace_id: workspaceId,
            title,
            project_id: context.projectId ?? null,
            assignee_id: assigneeId,
            due_date: dueDate,
            priority,
            status: 'todo',
            workflow_run_id: runId,
          });
          stepsLog.push({ stepOrder: step.step_order, action: 'create_task', result: `created: ${title}`, ts });
          break;
        }

        case 'send_notification': {
          const role = String(cfg.role ?? '');
          const message = resolveTokens(String(cfg.message ?? ''), context);
          const severity = String(cfg.severity ?? 'info');

          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .eq('role', role);

          const targets = (profiles ?? []).map((p: { user_id: string }) => p.user_id);
          for (const userId of targets) {
            await supabase.from('notifications').insert({
              workspace_id: workspaceId,
              user_id: userId,
              type: severity === 'high' ? 'warning' : 'info',
              message,
              entity_type: String(context.entityType ?? ''),
              entity_id: String(context.entityId ?? ''),
              read: false,
            });
          }

          if (severity === 'high' || severity === 'escalation') {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/functions/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ workspaceId, role, message, severity }),
            }).catch(() => null);
          }
          stepsLog.push({ stepOrder: step.step_order, action: 'send_notification', result: `sent to ${targets.length} user(s) with role ${role}`, ts });
          break;
        }

        case 'escalate': {
          const role = String(cfg.role ?? 'owner');
          const reason = resolveTokens(String(cfg.reason ?? ''), context);

          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .eq('role', role);

          const targets = (profiles ?? []).map((p: { user_id: string }) => p.user_id);
          for (const userId of targets) {
            await supabase.from('notifications').insert({
              workspace_id: workspaceId,
              user_id: userId,
              type: 'escalation',
              message: reason || `Escalated: requires your attention`,
              entity_type: String(context.entityType ?? ''),
              entity_id: String(context.entityId ?? ''),
              read: false,
            });
          }

          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/functions/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId, role, message: reason, severity: 'escalation' }),
          }).catch(() => null);

          stepsLog.push({ stepOrder: step.step_order, action: 'escalate', result: `escalated to ${role} (${targets.length} user(s))`, ts });
          break;
        }

        case 'delay': {
          const minutes = Number(cfg.minutes ?? 60);
          const resumeAt = new Date(Date.now() + minutes * 60000).toISOString();
          await supabase.from('workflow_runs').update({ status: 'paused', resume_at: resumeAt, current_step: step.step_order }).eq('id', runId);
          stepsLog.push({ stepOrder: step.step_order, action: 'delay', result: `paused until ${resumeAt}`, ts });
          paused = true;
          pauseAt = resumeAt;
          return { stepsLog, paused, pauseAt };
        }

        case 'create_handoff': {
          const fromStage = String(cfg.fromStage ?? 'sales');
          const toStage = String(cfg.toStage ?? 'pm');
          const requiredFields = (cfg.requiredFields as string[]) ?? [];
          await supabase.from('handoffs').insert({
            workspace_id: workspaceId,
            project_id: context.projectId ?? null,
            from_stage: fromStage,
            to_stage: toStage,
            status: 'pending',
            required_fields: requiredFields.map((f: string) => ({ field: f, label: f, satisfied: false })),
          });
          stepsLog.push({ stepOrder: step.step_order, action: 'create_handoff', result: `${fromStage} -> ${toStage}`, ts });
          break;
        }

        case 'set_sla': {
          const entity = String(cfg.entity ?? 'approval');
          const responseHours = Number(cfg.responseHours ?? 48);
          const deadline = new Date(Date.now() + responseHours * 3600000).toISOString();
          const entityId = String(context.entityId ?? '');
          if (entity === 'approval' && entityId) {
            await supabase.from('approvals').update({ sla_deadline: deadline }).eq('id', entityId);
          } else if (entity === 'ticket' && entityId) {
            await supabase.from('tickets').update({ sla_deadline: deadline }).eq('id', entityId);
          }
          stepsLog.push({ stepOrder: step.step_order, action: 'set_sla', result: `deadline=${deadline}`, ts });
          break;
        }

        case 'update_status': {
          const entity = String(cfg.entity ?? 'project');
          const newStatus = String(cfg.status ?? 'active');
          const entityId = String(context.entityId ?? '');
          if (entityId) {
            await supabase.from(entity + 's').update({ status: newStatus }).eq('id', entityId);
          }
          stepsLog.push({ stepOrder: step.step_order, action: 'update_status', result: `${entity} -> ${newStatus}`, ts });
          break;
        }

        case 'assign_to': {
          const role = String(cfg.role ?? '');
          const entity = String(cfg.entity ?? 'task');
          const entityId = String(context.entityId ?? '');
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .eq('role', role)
            .maybeSingle();
          if (profile && entityId) {
            await supabase.from(entity + 's').update({ assignee_id: profile.user_id }).eq('id', entityId);
          }
          stepsLog.push({ stepOrder: step.step_order, action: 'assign_to', result: `assigned to ${role}`, ts });
          break;
        }

        default:
          stepsLog.push({ stepOrder: step.step_order, action: step.step_type, result: 'skipped (unknown type)', ts });
      }
    } catch (err) {
      stepsLog.push({ stepOrder: step.step_order, action: step.step_type, result: `error: ${String(err)}`, ts });
    }

    await supabase.from('workflow_runs').update({ current_step: step.step_order, steps_log: stepsLog }).eq('id', runId);
  }

  return { stepsLog, paused };
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const body = (await req.json()) as {
      event: string;
      entityType?: string;
      entityId?: string;
      workspaceId: string;
      context?: Record<string, unknown>;
    };
    const { event, entityType, entityId, workspaceId, context = {} } = body;

    if (!event || !workspaceId) {
      return NextResponse.json({ error: 'event and workspaceId are required' }, { status: 400 });
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

    const { data: workflows } = await supabase
      .from('workflows')
      .select('*, workflow_steps(*)')
      .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
      .eq('trigger_event', event)
      .eq('is_active', true);

    if (!workflows || workflows.length === 0) {
      return NextResponse.json({ message: 'No active workflows for this event', runs: [] });
    }

    const ctx: Record<string, unknown> = { ...context, entityType, entityId };

    const results: { workflowId: string; runId: string; status: string; stepsExecuted: number }[] = [];

    for (const workflow of workflows) {
      const { data: run } = await supabase
        .from('workflow_runs')
        .insert({
          workspace_id: workspaceId,
          workflow_id: workflow.id,
          trigger_event: event,
          entity_type: entityType,
          entity_id: entityId,
          status: 'running',
          current_step: 0,
          steps_log: [],
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!run) continue;

      const steps = (workflow.workflow_steps ?? []).sort((a: any, b: any) => a.step_order - b.step_order);
      const { stepsLog, paused } = await executeSteps(supabase, steps, ctx, run.id, workspaceId);

      if (!paused) {
        await supabase
          .from('workflow_runs')
          .update({ status: 'completed', steps_log: stepsLog, completed_at: new Date().toISOString() })
          .eq('id', run.id);
      }

      results.push({
        workflowId: workflow.id,
        runId: run.id,
        status: paused ? 'paused' : 'completed',
        stepsExecuted: stepsLog.length,
      });
    }

    return NextResponse.json({ runs: results });
  } catch (err) {
    console.error('[workflow/execute]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
