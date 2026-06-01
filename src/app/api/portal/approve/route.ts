import { NextResponse } from 'next/server';
import { validatePortalToken, logPortalActivity, notifyWorkspace } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_APPROVALS } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    const { token, approvalId, status } = await request.json();

    if (!token || !approvalId || !status) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    if (status !== 'approved' && status !== 'revision') {
      return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
    }

    // 1. Validate token
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

    if (!scopes.includes('approvals')) {
      return NextResponse.json({ error: 'unauthorized_scope' }, { status: 403 });
    }

    // 2. Fetch approval and project details to verify ownership
    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    let approval: any = null;
    let project: any = null;
    let isMock = true;

    if (hasCredentials) {
      try {
        const { data: dbApproval, error: approvalErr } = await supabaseAdmin
          .from('approvals')
          .select('id, name, project_id')
          .eq('id', approvalId)
          .maybeSingle();

        if (!approvalErr && dbApproval) {
          approval = dbApproval;
          isMock = false;

          const { data: dbProject } = await supabaseAdmin
            .from('projects')
            .select('id, client_id, client_name')
            .eq('id', approval.project_id)
            .maybeSingle();

          if (dbProject) {
            project = dbProject;
          }
        }
      } catch (e) {
        console.warn('Supabase approval fetch failed, falling back to mock:', e);
      }
    }

    if (isMock) {
      const mockApproval = MOCK_APPROVALS.find(a => a.id === approvalId);
      if (mockApproval) {
        approval = { id: mockApproval.id, name: mockApproval.name, project_id: 'p1' };
        project = { id: 'p1', client_id: clientId, client_name: mockApproval.client };
      }
    }

    if (!approval) {
      return NextResponse.json({ error: 'approval_not_found' }, { status: 404 });
    }

    if (!project || project.client_id !== clientId) {
      return NextResponse.json({ error: 'unauthorized_project' }, { status: 403 });
    }

    // 3. Update status in database
    if (!isMock && hasCredentials) {
      try {
        const { error: updateErr } = await supabaseAdmin
          .from('approvals')
          .update({ status })
          .eq('id', approvalId);

        if (updateErr) throw updateErr;
      } catch (e) {
        console.warn('Supabase approval status update failed:', e);
      }
    } else {
      console.log(`[Approval Updated] ID: ${approvalId}, Status: ${status}`);
    }

    // 4. Log portal activity
    const event = status === 'approved' ? 'approval_approved' : 'approval_revision';
    await logPortalActivity({
      workspaceId,
      tokenId,
      clientId,
      event,
      metadata: { approvalId, approvalName: approval.name, projectName: project.client_name },
      request,
    });

    // 5. Notify workspace
    const actionText = status === 'approved' ? 'approved' : 'requested changes on';
    const title = status === 'approved' ? 'Deliverable Approved' : 'Revision Requested';
    const message = `Client ${project.client_name} ${actionText} "${approval.name}"`;
    await notifyWorkspace(workspaceId, title, message, `/app/approvals`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Portal approve error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
