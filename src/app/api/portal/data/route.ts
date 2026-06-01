import { NextResponse } from 'next/server';
import { validatePortalToken, logPortalActivity } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 });
    }

    // 1. Validate token & email verification
    const authResult = await validatePortalToken(token);

    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error, expired: authResult.expired },
        { status: 401 }
      );
    }

    if (!authResult.verifiedEmail) {
      return NextResponse.json(
        { error: 'needs_verification', email: authResult.clientEmail },
        { status: 403 }
      );
    }

    const { client_id: clientId, workspace_id: workspaceId, scopes, id: tokenId } = authResult.tokenData!;

    // 2. Fetch client details
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();

    if (clientErr || !client) {
      return NextResponse.json({ error: 'client_not_found' }, { status: 404 });
    }

    // 3. Fetch projects (always needed for overview)
    const { data: dbProjects } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('client_id', clientId);

    const projects = (dbProjects ?? []).map(p => ({
      ...p,
      _id: p.id,
      workspaceId: p.workspace_id,
      clientId: p.client_id,
      clientName: p.client_name,
      dueDate: p.due_date,
      budget: Number(p.budget),
      healthScore: p.health_score,
      activeRiskFlags: p.active_risk_flags,
    }));

    const projectIds = projects.map(p => p.id);

    // 4. Parallel fetch of scoped tables
    let dbTasks: any[] = [];
    let dbApprovals: any[] = [];
    let dbAssets: any[] = [];
    let dbInvoices: any[] = [];
    let dbMilestones: any[] = [];
    let dbTickets: any[] = [];

    const fetches: PromiseLike<any>[] = [];

    if (projectIds.length > 0) {
      fetches.push(
        supabaseAdmin
          .from('milestones')
          .select('*')
          .in('project_id', projectIds)
          .then(({ data }) => { dbMilestones = data || []; })
      );
    }

    if (scopes.includes('approvals')) {
      if (projectIds.length > 0) {
        fetches.push(
          supabaseAdmin
            .from('tasks')
            .select('*')
            .in('project_id', projectIds)
            .then(({ data }) => { dbTasks = data || []; }),
          supabaseAdmin
            .from('approvals')
            .select('*')
            .in('project_id', projectIds)
            .then(({ data }) => { dbApprovals = data || []; })
        );
      }
    }

    if (scopes.includes('files')) {
      fetches.push(
        supabaseAdmin
          .from('assets')
          .select('*')
          .eq('client_id', clientId)
          .then(({ data }) => { dbAssets = data || []; })
      );
    }

    if (scopes.includes('invoices')) {
      fetches.push(
        supabaseAdmin
          .from('invoices')
          .select('*')
          .eq('client_id', clientId)
          .then(({ data }) => { dbInvoices = data || []; })
      );
    }

    if (scopes.includes('tickets')) {
      fetches.push(
        supabaseAdmin
          .from('tickets')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .then(({ data }) => { dbTickets = data || []; })
      );
    }

    await Promise.all(fetches);

    // 5. Map data to the format used in frontend
    const mappedTasks = dbTasks.map(t => ({
      ...t,
      _id: t.id,
      projectId: t.project_id,
      estimatedHours: t.estimated_hours ? Number(t.estimated_hours) : 0,
    }));

    const mappedApprovals = dbApprovals.map(a => ({
      ...a,
      _id: a.id,
      projectId: a.project_id,
      submittedDate: a.submitted_date,
      fileUrl: a.file_url,
    }));

    const mappedAssets = dbAssets.map(a => ({
      ...a,
      _id: a.id,
      uploadedAt: a.uploaded_at,
    }));

    const mappedInvoices = dbInvoices.map(i => ({
      ...i,
      _id: i.id,
      invoiceNumber: i.invoice_number,
      dueDate: i.due_date,
      paidDate: i.paid_date,
    }));

    const mappedMilestones = dbMilestones.map(m => ({
      ...m,
      _id: m.id,
      projectId: m.project_id,
      dueDate: m.due_date,
    }));

    const mappedTickets = dbTickets.map(t => ({
      ...t,
      _id: t.id,
      clientId: t.client_id,
    }));

    // Log page accessed event (only once, we could restrict this to once per session, but simple log is fine)
    await logPortalActivity({
      workspaceId,
      tokenId,
      clientId,
      event: 'portal_accessed',
      metadata: { path: '/' },
      request,
    });

    return NextResponse.json({
      client: {
        id: client.id,
        _id: client.id,
        company: client.company,
        workspaceId: client.workspace_id,
      },
      projects,
      tasks: mappedTasks,
      approvals: mappedApprovals,
      assets: mappedAssets,
      invoices: mappedInvoices,
      milestones: mappedMilestones,
      tickets: mappedTickets,
      scopes,
    });
  } catch (err: any) {
    console.error('Portal data error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
