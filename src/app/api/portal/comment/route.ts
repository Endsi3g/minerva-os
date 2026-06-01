import { NextResponse } from 'next/server';
import { validatePortalToken, logPortalActivity, notifyWorkspace } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');

    if (!token || !targetId || !targetType) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    // Validate token
    const authResult = await validatePortalToken(token);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error, expired: authResult.expired },
        { status: 401 }
      );
    }

    if (!authResult.verifiedEmail) {
      return NextResponse.json({ error: 'needs_verification' }, { status: 403 });
    }

    const { scopes, client_id: clientId } = authResult.tokenData!;

    if (targetType === 'approval' && !scopes.includes('approvals')) {
      return NextResponse.json({ error: 'unauthorized_scope' }, { status: 403 });
    }

    // Verify ownership of the target
    if (targetType === 'approval') {
      const { data: approval } = await supabaseAdmin
        .from('approvals')
        .select('id, project_id')
        .eq('id', targetId)
        .maybeSingle();

      if (!approval) {
        return NextResponse.json({ error: 'approval_not_found' }, { status: 404 });
      }

      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('id, client_id')
        .eq('id', approval.project_id)
        .maybeSingle();

      if (!project || project.client_id !== clientId) {
        return NextResponse.json({ error: 'unauthorized_project' }, { status: 403 });
      }
    } else if (targetType === 'task') {
      const { data: task } = await supabaseAdmin
        .from('tasks')
        .select('id, project_id')
        .eq('id', targetId)
        .maybeSingle();

      if (!task) {
        return NextResponse.json({ error: 'task_not_found' }, { status: 404 });
      }

      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('id, client_id')
        .eq('id', task.project_id)
        .maybeSingle();

      if (!project || project.client_id !== clientId) {
        return NextResponse.json({ error: 'unauthorized_project' }, { status: 403 });
      }
    }

    // Fetch comments
    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return NextResponse.json(
      (comments ?? []).map(c => ({
        ...c,
        _id: c.id,
      }))
    );
  } catch (err: any) {
    console.error('Portal comment GET error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { token, targetId, targetType, content } = await request.json();

    if (!token || !targetId || !targetType || !content) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    // Validate token
    const authResult = await validatePortalToken(token);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error, expired: authResult.expired },
        { status: 401 }
      );
    }

    if (!authResult.verifiedEmail) {
      return NextResponse.json({ error: 'needs_verification' }, { status: 403 });
    }

    const { scopes, client_id: clientId, workspace_id: workspaceId, id: tokenId } = authResult.tokenData!;

    if (targetType === 'approval' && !scopes.includes('approvals')) {
      return NextResponse.json({ error: 'unauthorized_scope' }, { status: 403 });
    }

    let targetName = 'Item';

    // Verify ownership of the target
    if (targetType === 'approval') {
      const { data: approval } = await supabaseAdmin
        .from('approvals')
        .select('id, name, project_id')
        .eq('id', targetId)
        .maybeSingle();

      if (!approval) {
        return NextResponse.json({ error: 'approval_not_found' }, { status: 404 });
      }
      targetName = approval.name;

      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('id, client_id')
        .eq('id', approval.project_id)
        .maybeSingle();

      if (!project || project.client_id !== clientId) {
        return NextResponse.json({ error: 'unauthorized_project' }, { status: 403 });
      }
    } else if (targetType === 'task') {
      const { data: task } = await supabaseAdmin
        .from('tasks')
        .select('id, name, project_id')
        .eq('id', targetId)
        .maybeSingle();

      if (!task) {
        return NextResponse.json({ error: 'task_not_found' }, { status: 404 });
      }
      targetName = task.name;

      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('id, client_id')
        .eq('id', task.project_id)
        .maybeSingle();

      if (!project || project.client_id !== clientId) {
        return NextResponse.json({ error: 'unauthorized_project' }, { status: 403 });
      }
    }

    // Get client info for author name
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('company, contact')
      .eq('id', clientId)
      .maybeSingle();

    const authorName = client ? `${client.company} (${client.contact})` : 'Client';

    // Insert comment
    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        target_id: targetId,
        target_type: targetType,
        author: authorName,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logPortalActivity({
      workspaceId,
      tokenId,
      clientId,
      event: 'comment_added',
      metadata: { targetId, targetType, targetName, authorName },
      request,
    });

    // Notify workspace
    const title = `New Portal Comment`;
    const message = `${authorName} commented on "${targetName}": "${content.trim().substring(0, 60)}${content.trim().length > 60 ? '...' : ''}"`;
    await notifyWorkspace(workspaceId, title, message, targetType === 'approval' ? '/app/approvals' : '/app/tasks');

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        _id: comment.id,
      },
    });
  } catch (err: any) {
    console.error('Portal comment POST error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
