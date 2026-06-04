import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate — verify the caller is a logged-in user
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { agencyName, agencyType, teamSize, goals, tier, skip } = body as {
      agencyName?: string;
      agencyType?: string;
      teamSize?: string;
      goals?: string[];
      tier?: string;
      skip?: boolean;
    };

    // 2. Check if user already has a workspace (via user_profiles)
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('workspace_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let workspaceId: string | undefined = profile?.workspace_id ?? undefined;

    if (workspaceId) {
      // 3a. Workspace exists — update settings JSONB only
      if (!skip) {
        const { data: existing } = await supabaseAdmin
          .from('workspaces')
          .select('settings')
          .eq('id', workspaceId)
          .maybeSingle();

        const currentSettings = (existing?.settings as Record<string, unknown>) ?? {};

        await supabaseAdmin.from('workspaces').update({
          ...(agencyName ? { name: agencyName } : {}),
          settings: {
            ...currentSettings,
            workspace_tier: tier ?? currentSettings.workspace_tier ?? 'scale',
            agency_type: agencyType ?? currentSettings.agency_type,
            team_size: teamSize ?? currentSettings.team_size,
            priority_goals: goals ?? currentSettings.priority_goals,
          },
        }).eq('id', workspaceId);
      }
    } else {
      // 3b. No workspace yet — insert via admin (bypasses RLS)
      const name = skip ? 'My Agency' : (agencyName || 'My Agency');
      const slug =
        name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') +
        '-' +
        Math.random().toString(36).substring(2, 6);

      const { data: newWs, error: insertError } = await supabaseAdmin
        .from('workspaces')
        .insert({
          name,
          slug,
          owner_user_id: user.id,
          settings: {
            currency: 'USD',
            language: 'en',
            timezone: 'America/New_York',
            workspace_tier: tier ?? 'scale',
            ...(skip
              ? {}
              : {
                  agency_type: agencyType,
                  team_size: teamSize,
                  priority_goals: goals,
                }),
          },
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[workspace/setup] insert error:', insertError);
        return NextResponse.json(
          { error: insertError.message, code: insertError.code },
          { status: 500 },
        );
      }

      workspaceId = newWs.id;
    }

    // 4. Mark onboarding complete in user_profiles
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ onboarding_completed: true, workspace_id: workspaceId })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('[workspace/setup] profile update error:', profileError);
      return NextResponse.json(
        { error: profileError.message, code: profileError.code },
        { status: 500 },
      );
    }

    return NextResponse.json({ workspaceId });
  } catch (err) {
    console.error('[workspace/setup] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
