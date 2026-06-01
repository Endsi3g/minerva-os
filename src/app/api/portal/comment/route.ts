import { NextResponse } from 'next/server';
import { validatePortalToken, logPortalActivity, notifyWorkspace } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_APPROVALS, MOCK_TASKS, MOCK_CLIENTS } from '@/lib/mock-data';

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

    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    let isMock = true;

    if (hasCredentials) {
      try {
        // Verify ownership of the target
        if (targetType === 'approval') {
          const { data: approval } = await supabaseAdmin
            .from('approvals')
            .select('id, project_id')
            .eq('id', targetId)
            .maybeSingle();

          if (approval) {
            const { data: project } = await supabaseAdmin
              .from('projects')
              .select('id, client_id')
              .eq('id', approval.project_id)
              .maybeSingle();

            if (project && project.client_id === clientId) {
              isMock = false;
            }
          }
        } else if (targetType === 'task') {
          const { data: task } = await supabaseAdmin
            .from('tasks')
            .select('id, project_id')
            .eq('id', targetId)
            .maybeSingle();

          if (task) {
            const { data: project } = await supabaseAdmin
              .from('projects')
              .select('id, client_id')
              .eq('id', task.project_id)
              .maybeSingle();

            if (project && project.client_id === clientId) {
              isMock = false;
            }
          }
        }
      } catch (e) {
        console.warn('Supabase comment target check failed, falling back to mock:', e);
      }
    }

    if (isMock) {
      // Just check mock lists
      if (targetType === 'approval') {
        const mockApp = MOCK_APPROVALS.find(a => a.id === targetId);
        if (!mockApp) {
          return NextResponse.json({ error: 'approval_not_found' }, { status: 404 });
        }
      } else if (targetType === 'task') {
        const mockTask = MOCK_TASKS.find(t => t.id === targetId);
        if (!mockTask) {
          return NextResponse.json({ error: 'task_not_found' }, { status: 404 });
        }
      }
    }

    let comments: any[] = [];
    if (!isMock && hasCredentials) {
      try {
        const { data, error } = await supabaseAdmin
          .from('comments')
          .select('*')
          .eq('target_id', targetId)
          .eq('target_type', targetType)
          .order('timestamp', { ascending: true });

        if (!error && data) {
          comments = data;
        }
      } catch (e) {
        console.warn('Supabase comments fetch failed, using empty mock comments:', e);
      }
    }

    return NextResponse.json(
      comments.map(c => ({
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
    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    let isMock = true;

    if (hasCredentials) {
      try {
        if (targetType === 'approval') {
          const { data: approval } = await supabaseAdmin
            .from('approvals')
            .select('id, name, project_id')
            .eq('id', targetId)
            .maybeSingle();

          if (approval) {
            targetName = approval.name;
            const { data: project } = await supabaseAdmin
              .from('projects')
              .select('id, client_id')
              .eq('id', approval.project_id)
              .maybeSingle();

            if (project && project.client_id === clientId) {
              isMock = false;
            }
          }
        } else if (targetType === 'task') {
          const { data: task } = await supabaseAdmin
            .from('tasks')
            .select('id, name, project_id')
            .eq('id', targetId)
            .maybeSingle();

          if (task) {
            targetName = task.name;
            const { data: project } = await supabaseAdmin
              .from('projects')
              .select('id, client_id')
              .eq('id', task.project_id)
              .maybeSingle();

            if (project && project.client_id === clientId) {
              isMock = false;
            }
          }
        }
      } catch (e) {
        console.warn('Supabase comment target check failed on POST, falling back to mock:', e);
      }
    }

    if (isMock) {
      if (targetType === 'approval') {
        const mockApp = MOCK_APPROVALS.find(a => a.id === targetId);
        if (!mockApp) {
          return NextResponse.json({ error: 'approval_not_found' }, { status: 404 });
        }
        targetName = mockApp.name;
      } else if (targetType === 'task') {
        const mockTask = MOCK_TASKS.find(t => t.id === targetId);
        if (!mockTask) {
          return NextResponse.json({ error: 'task_not_found' }, { status: 404 });
        }
        targetName = mockTask.title;
      }
    }

    // Get client info for author name
    let authorName = 'Client';
    if (!isMock && hasCredentials) {
      try {
        const { data: client } = await supabaseAdmin
          .from('clients')
          .select('company, contact')
          .eq('id', clientId)
          .maybeSingle();

        if (client) {
          authorName = `${client.company} (${client.contact})`;
        }
      } catch (e) {
        console.warn('Supabase client lookup for comment failed:', e);
      }
    }

    if (authorName === 'Client') {
      const mockClient = MOCK_CLIENTS.find(c => c.id === clientId);
      if (mockClient) {
        authorName = `${mockClient.company} (${mockClient.contact})`;
      }
    }

    let comment: any = null;

    if (!isMock && hasCredentials) {
      try {
        const { data, error } = await supabaseAdmin
          .from('comments')
          .insert({
            target_id: targetId,
            target_type: targetType,
            author: authorName,
            content: content.trim(),
          })
          .select()
          .single();

        if (!error && data) {
          comment = data;
        }
      } catch (e) {
        console.warn('Failed to insert comment in Supabase:', e);
      }
    }

    if (!comment) {
      comment = {
        id: 'mock-comment-' + Date.now(),
        target_id: targetId,
        target_type: targetType,
        author: authorName,
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
    }

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
