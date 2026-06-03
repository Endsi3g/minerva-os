import { NextResponse } from 'next/server';
import { validatePortalToken, logPortalActivity } from '@/lib/portal-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_CLIENTS, MOCK_PROJECTS, MOCK_TASKS, MOCK_APPROVALS, MOCK_FILES, MOCK_INVOICES, MOCK_MILESTONES, MOCK_PROPOSALS } from '@/lib/mock-data';

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

    const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    let client: any = null;
    let projects: any[] = [];
    let dbTasks: any[] = [];
    let dbApprovals: any[] = [];
    let dbAssets: any[] = [];
    let dbInvoices: any[] = [];
    let dbMilestones: any[] = [];
    let dbTickets: any[] = [];
    let dbProposals: any[] = [];

    let isMock = true;

    if (hasCredentials) {
      try {
        const { data: dbClient, error: clientErr } = await supabaseAdmin
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .maybeSingle();

        if (!clientErr && dbClient) {
          client = dbClient;
          isMock = false;

          const { data: dbProjects } = await supabaseAdmin
            .from('projects')
            .select('*')
            .eq('client_id', clientId);

          projects = (dbProjects ?? []).map(p => ({
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
        }
      } catch (e) {
        console.warn('Failed to query client details from Supabase, falling back to mock:', e);
      }
    }

    if (isMock) {
      const mockClient = MOCK_CLIENTS.find(c => c.id === clientId);
      if (!mockClient) {
        return NextResponse.json({ error: 'client_not_found' }, { status: 404 });
      }
      client = {
        id: mockClient.id,
        _id: mockClient.id,
        company: mockClient.company,
        workspace_id: 'mock-workspace-123',
      };

      const mockProjectsFiltered = MOCK_PROJECTS.filter(p => p.clientId === clientId);
      projects = mockProjectsFiltered.map(p => ({
        ...p,
        _id: p.id,
        workspaceId: 'mock-workspace-123',
        clientId: p.clientId,
        clientName: p.client,
        dueDate: p.dueDate,
        budget: p.budget,
        healthScore: 95,
        activeRiskFlags: [],
      }));
    }

    const projectIds = projects.map(p => p.id);

    if (!isMock && hasCredentials) {
      try {
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

        if (scopes.includes('proposals')) {
          fetches.push(
            supabaseAdmin
              .from('proposals')
              .select('*')
              .eq('client_id', clientId)
              .order('created_at', { ascending: false })
              .then(({ data }) => { dbProposals = data || []; })
          );
        }

        await Promise.all(fetches);
      } catch (e) {
        console.warn('Failed to query scoped tables from Supabase, falling back to mock:', e);
        isMock = true;
      }
    }

    if (isMock) {
      const allowedProjects = MOCK_PROJECTS.filter(p => projectIds.includes(p.id));
      const allowedProjectNames = allowedProjects.map(p => p.name);

      dbMilestones = MOCK_MILESTONES.filter(m => projectIds.includes(m.projectId)).map(m => ({
        ...m,
        id: m.id,
        project_id: m.projectId,
        due_date: m.dueDate,
      }));

      if (scopes.includes('approvals')) {
        dbTasks = MOCK_TASKS.filter(t => projectIds.includes(t.projectId)).map(t => ({
          ...t,
          id: t.id,
          project_id: t.projectId,
        }));
        dbApprovals = MOCK_APPROVALS.filter(a => allowedProjectNames.includes(a.project)).map(a => {
          const associatedProj = allowedProjects.find(p => p.name === a.project);
          return {
            ...a,
            id: a.id,
            project_id: associatedProj?.id || '',
            submitted_date: a.submittedDate,
            file_url: '',
          };
        });
      }

      if (scopes.includes('files')) {
        dbAssets = MOCK_FILES.filter(f => allowedProjectNames.includes(f.project)).map(f => {
          const associatedProj = allowedProjects.find(p => p.name === f.project);
          return {
            ...f,
            id: f.id,
            project_id: associatedProj?.id || '',
            uploaded_at: f.uploadedDate,
          };
        });
      }

      if (scopes.includes('invoices')) {
        dbInvoices = MOCK_INVOICES.filter(i => i.clientId === clientId).map(i => ({
          ...i,
          id: i.id,
          invoice_number: i.number,
          due_date: i.dueDate,
          paid_date: i.paidDate || null,
        }));
      }

      dbTickets = [];

      if (scopes.includes('proposals')) {
        dbProposals = MOCK_PROPOSALS.filter(p => p.client_id === clientId);
      }
    }

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

    const mappedProposals = dbProposals.map(p => ({
      ...p,
      _id: p.id,
      clientId: p.client_id || p.clientId,
      totalAmount: p.total_amount,
      validUntil: p.valid_until,
      signedBy: p.signed_by,
      signedAt: p.signed_at,
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
      proposals: mappedProposals,
      scopes,
    });
  } catch (err: any) {
    console.error('Portal data error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
