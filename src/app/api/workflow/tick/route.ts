import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  let resumed = 0;
  let slaBreached = 0;
  let invoicesMarked = 0;

  // 1. Resume paused workflow runs
  const { data: pausedRuns } = await supabase
    .from('workflow_runs')
    .select('*, workflows(workflow_steps(*))')
    .eq('status', 'paused')
    .lte('resume_at', now);

  for (const run of pausedRuns ?? []) {
    const allSteps = (run.workflows?.workflow_steps ?? []).sort((a: any, b: any) => a.step_order - b.step_order);
    const remainingSteps = allSteps.filter((s: any) => s.step_order > run.current_step);

    if (remainingSteps.length === 0) {
      await supabase.from('workflow_runs').update({ status: 'completed', completed_at: now }).eq('id', run.id);
      continue;
    }

    await supabase.from('workflow_runs').update({ status: 'running' }).eq('id', run.id);

    await fetch(`${baseUrl}/api/workflow/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: run.trigger_event,
        entityType: run.entity_type,
        entityId: run.entity_id,
        workspaceId: run.workspace_id,
        context: {},
      }),
    }).catch(() => null);

    resumed++;
  }

  // 2. Check SLA breaches on approvals
  const { data: slaApprovals } = await supabase
    .from('approvals')
    .select('id, workspace_id')
    .lte('sla_deadline', now)
    .eq('sla_breached', false)
    .eq('status', 'pending');

  for (const approval of slaApprovals ?? []) {
    await supabase.from('approvals').update({ sla_breached: true }).eq('id', approval.id);
    await fetch(`${baseUrl}/api/workflow/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'approval_overdue',
        entityType: 'approval',
        entityId: approval.id,
        workspaceId: approval.workspace_id,
      }),
    }).catch(() => null);
    slaBreached++;
  }

  // 3. Check SLA breaches on tickets
  const { data: slaTickets } = await supabase
    .from('tickets')
    .select('id, workspace_id')
    .lte('sla_deadline', now)
    .not('status', 'in', '("resolved","closed")');

  for (const ticket of slaTickets ?? []) {
    await fetch(`${baseUrl}/api/workflow/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'ticket_sla_breached',
        entityType: 'ticket',
        entityId: ticket.id,
        workspaceId: ticket.workspace_id,
      }),
    }).catch(() => null);
    slaBreached++;
  }

  // 4. Mark overdue invoices and trigger workflows
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, workspace_id')
    .lt('due_date', now.split('T')[0])
    .eq('status', 'sent');

  for (const invoice of overdueInvoices ?? []) {
    await supabase.from('invoices').update({ status: 'overdue' }).eq('id', invoice.id);
    await fetch(`${baseUrl}/api/workflow/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'invoice_overdue',
        entityType: 'invoice',
        entityId: invoice.id,
        workspaceId: invoice.workspace_id,
      }),
    }).catch(() => null);
    invoicesMarked++;
  }

  return NextResponse.json({ resumed, slaBreached, invoicesMarked });
}
