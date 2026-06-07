import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, type, category, description, config } = body as {
    name: string;
    type: 'template' | 'automation' | 'view' | 'playbook';
    category: string;
    description?: string;
    config?: Record<string, unknown>;
  };

  if (!name || !type || !category) {
    return NextResponse.json({ error: 'Missing required fields: name, type, category' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('workspace_id')
    .eq('id', user.id)
    .single();

  if (!profile?.workspace_id) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const { data: item, error: itemError } = await supabase
    .from('marketplace_items')
    .insert({
      name,
      type,
      category,
      description: description ?? '',
      config: config ?? {},
      is_community: true,
      item_status: 'submitted',
      submitted_by: user.id,
      is_built_in: false,
      use_count: 0,
      tags: [],
    })
    .select()
    .single();

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  const { error: submissionError } = await supabase
    .from('marketplace_submissions')
    .insert({
      workspace_id: profile.workspace_id,
      submitted_by: user.id,
      item_id: item.id,
      name,
      type,
      category,
      description: description ?? '',
      config: config ?? {},
      status: 'submitted',
    });

  if (submissionError) {
    return NextResponse.json({ error: submissionError.message }, { status: 500 });
  }

  return NextResponse.json({ item }, { status: 201 });
}
