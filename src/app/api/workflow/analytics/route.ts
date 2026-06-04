import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { AutomationAnalyticsSnapshot } from '@/lib/types';

type Period = 'day' | 'week' | 'month';

function mockSnapshot(period: Period): AutomationAnalyticsSnapshot {
  const labels: Record<Period, string> = { day: 'Today', week: 'This week', month: 'This month' };
  const series = Array.from({ length: period === 'day' ? 8 : period === 'week' ? 7 : 30 }, (_, i) => ({
    date: new Date(Date.now() - i * (period === 'day' ? 3600000 : 86400000)).toISOString().split('T')[0],
    executions: 8 + Math.floor(Math.random() * 12),
    failures: Math.floor(Math.random() * 2),
  })).reverse();

  const totalExecutions = series.reduce((s, d) => s + d.executions, 0);
  const failedExecutions = series.reduce((s, d) => s + d.failures, 0);
  const successfulExecutions = totalExecutions - failedExecutions;

  return {
    period,
    periodLabel: labels[period],
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    totalTimeSavedMinutes: totalExecutions * 4,
    avgSuccessRate: totalExecutions > 0 ? successfulExecutions / totalExecutions : 1,
    topWorkflows: [
      { workflowId: 'w1', workflowName: 'Invoice Overdue Alert', totalRuns: Math.floor(totalExecutions * 0.35), successRate: 0.97, avgDurationMs: 320, lastRunAt: new Date().toISOString(), timeSavedMinutes: Math.floor(totalExecutions * 0.35 * 3) },
      { workflowId: 'w2', workflowName: 'Proposal Signed Kickoff', totalRuns: Math.floor(totalExecutions * 0.28), successRate: 0.94, avgDurationMs: 580, lastRunAt: new Date(Date.now() - 3600000).toISOString(), timeSavedMinutes: Math.floor(totalExecutions * 0.28 * 6) },
      { workflowId: 'w3', workflowName: 'Task Overdue Escalation', totalRuns: Math.floor(totalExecutions * 0.22), successRate: 0.98, avgDurationMs: 210, lastRunAt: new Date(Date.now() - 7200000).toISOString(), timeSavedMinutes: Math.floor(totalExecutions * 0.22 * 2) },
    ],
    triggerBreakdown: {
      invoice_overdue: Math.floor(totalExecutions * 0.35),
      proposal_signed: Math.floor(totalExecutions * 0.28),
      task_overdue: Math.floor(totalExecutions * 0.22),
      manual: Math.floor(totalExecutions * 0.15),
    },
    dailySeries: series,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') ?? 'week') as Period;
    const validPeriods: Period[] = ['day', 'week', 'month'];
    const safePeriod = validPeriods.includes(period) ? period : 'week';

    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasCredentials) {
      try {
        const daysBack = safePeriod === 'day' ? 1 : safePeriod === 'week' ? 7 : 30;
        const since = new Date(Date.now() - daysBack * 86400000).toISOString();

        const { data, error } = await supabaseAdmin
          .from('workflow_runs')
          .select('id, workflow_id, status, started_at, completed_at')
          .gte('started_at', since)
          .order('started_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const total = data.length;
          const successes = data.filter((r: any) => r.status === 'completed').length;
          const failures = data.filter((r: any) => r.status === 'failed').length;

          const snapshot: AutomationAnalyticsSnapshot = {
            period: safePeriod,
            periodLabel: { day: 'Today', week: 'This week', month: 'This month' }[safePeriod],
            totalExecutions: total,
            successfulExecutions: successes,
            failedExecutions: failures,
            totalTimeSavedMinutes: total * 4,
            avgSuccessRate: total > 0 ? successes / total : 1,
            topWorkflows: [],
            triggerBreakdown: {},
            dailySeries: [],
          };
          return NextResponse.json(snapshot);
        }
      } catch (e) {
        console.warn('Analytics query failed, using mock:', e);
      }
    }

    return NextResponse.json(mockSnapshot(safePeriod));
  } catch (err) {
    console.error('Workflow analytics error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
