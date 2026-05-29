'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Approval, ApprovalStatus } from '@/lib/types';

export function usePortalData() {
  const params = useParams();
  const token = params?.token as string | undefined;

  const [portalData, setPortalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function fetchPortalData() {
      try {
        const { data: tokenRow } = await supabase
          .from('portal_tokens')
          .select('*')
          .eq('token', token)
          .maybeSingle();

        if (!tokenRow) {
          setLoading(false);
          return;
        }

        const clientId = tokenRow.client_id;

        // Fetch client details
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .maybeSingle();

        if (!client) {
          setLoading(false);
          return;
        }

        // Fetch projects
        const { data: dbProjects } = await supabase
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

        // Parallel requests
        const [
          { data: dbTasks },
          { data: dbApprovals },
          { data: dbAssets },
          { data: dbInvoices },
          { data: dbMilestones },
        ] = await Promise.all([
          projectIds.length > 0
            ? supabase.from('tasks').select('*').in('project_id', projectIds)
            : Promise.resolve({ data: [] }),
          projectIds.length > 0
            ? supabase.from('approvals').select('*').in('project_id', projectIds)
            : Promise.resolve({ data: [] }),
          supabase.from('assets').select('*').eq('client_id', clientId),
          supabase.from('invoices').select('*').eq('client_id', clientId),
          projectIds.length > 0
            ? supabase.from('milestones').select('*').in('project_id', projectIds)
            : Promise.resolve({ data: [] }),
        ]);

        const mappedTasks = (dbTasks ?? []).map(t => ({
          ...t,
          _id: t.id,
          projectId: t.project_id,
          estimatedHours: t.estimated_hours ? Number(t.estimated_hours) : 0,
        }));

        const mappedApprovals = (dbApprovals ?? []).map(a => ({
          ...a,
          _id: a.id,
          projectId: a.project_id,
          submittedDate: a.submitted_date,
          fileUrl: a.file_url,
        }));

        const mappedAssets = (dbAssets ?? []).map(a => ({
          ...a,
          _id: a.id,
          uploadedAt: a.uploaded_at,
        }));

        const mappedInvoices = (dbInvoices ?? []).map(i => ({
          ...i,
          _id: i.id,
          invoiceNumber: i.invoice_number,
          dueDate: i.due_date,
          paidDate: i.paid_date,
        }));

        const mappedMilestones = (dbMilestones ?? []).map(m => ({
          ...m,
          _id: m.id,
          projectId: m.project_id,
          dueDate: m.due_date,
        }));

        setPortalData({
          client: {
            _id: client.id,
            id: client.id,
            company: client.company,
            workspaceId: client.workspace_id,
          },
          projects,
          tasks: mappedTasks,
          approvals: mappedApprovals,
          assets: mappedAssets,
          invoices: mappedInvoices,
          milestones: mappedMilestones,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPortalData();
  }, [token]);

  const isValid = !!portalData;
  const clientName = portalData?.client?.company ?? 'Unknown Client';
  const clientId = portalData?.client?._id ?? null;
  const workspaceId = portalData?.client?.workspaceId ?? null;

  return {
    token,
    clientId,
    clientName,
    workspaceId,
    isValid,
    loading,
    projects: portalData?.projects ?? [],
    tasks: portalData?.tasks ?? [],
    approvals: portalData?.approvals ?? [],
    files: portalData?.assets ?? [],
    invoices: portalData?.invoices ?? [],
    milestones: portalData?.milestones ?? [],
  };
}

// Local approval state lifted to shell
export function usePortalApprovals(initialApprovals: Approval[]) {
  const [approvals, setApprovals] = useState(initialApprovals);

  function updateStatus(id: string, status: ApprovalStatus) {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  return { approvals, updateStatus };
}
