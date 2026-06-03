import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/requireAuth';

const SCOPE_CREEP_THRESHOLD = 0.20; // 20% over budget triggers flag

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { workspaceId } = (await req.json()) as { workspaceId: string };
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('workspace_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (profile?.workspace_id && profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, budget, scope_flagged')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    if (!projects?.length) {
      return NextResponse.json({ flagged: [] });
    }

    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('project_id, duration, hourly_rate')
      .eq('workspace_id', workspaceId)
      .in('project_id', projects.map((p: any) => p.id));

    const costByProject: Record<string, number> = {};
    for (const te of (timeEntries ?? [])) {
      if (!te.project_id) continue;
      costByProject[te.project_id] = (costByProject[te.project_id] ?? 0) +
        ((te.duration ?? 0) / 60) * (te.hourly_rate ?? 0);
    }

    const toFlag: string[] = [];
    for (const project of projects) {
      const cost = costByProject[project.id] ?? 0;
      const threshold = project.budget * (1 + SCOPE_CREEP_THRESHOLD);
      if (!project.scope_flagged && cost > threshold) {
        toFlag.push(project.id);
      }
    }

    if (toFlag.length > 0) {
      await supabase
        .from('projects')
        .update({ scope_flagged: true, scope_flagged_at: new Date().toISOString() })
        .in('id', toFlag);

      for (const projectId of toFlag) {
        const project = projects.find((p: any) => p.id === projectId);
        await supabase.from('notifications').insert({
          workspace_id: workspaceId,
          type: 'scope_creep',
          title: 'Scope creep detected',
          message: `Project "${project?.name}" has exceeded budget by more than 20%.`,
          entity_type: 'project',
          entity_id: projectId,
          severity: 'high',
        });
      }
    }

    return NextResponse.json({ flagged: toFlag });
  } catch (err) {
    console.error('[finance/scope-check]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
