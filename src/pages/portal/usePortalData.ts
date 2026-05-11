import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  MOCK_PORTAL_TOKENS,
  MOCK_PROJECTS,
  MOCK_APPROVALS,
  MOCK_FILES,
  MOCK_INVOICES,
  MOCK_MILESTONES,
} from '@/lib/mock-data';
import type { Approval, ApprovalStatus } from '@/lib/types';

export function usePortalData() {
  const { token } = useParams<{ token: string }>();
  const portalToken = MOCK_PORTAL_TOKENS.find(t => t.token === token);
  const clientId   = portalToken?.clientId ?? null;
  const clientName = portalToken?.clientName ?? 'Unknown Client';
  const isValid    = !!portalToken;

  const projects  = MOCK_PROJECTS.filter(p => p.clientId === clientId);
  const approvals = MOCK_APPROVALS.filter(a =>
    MOCK_PROJECTS.find(p => p.name === a.project && p.clientId === clientId)
  );
  const files      = MOCK_FILES.filter(f =>
    MOCK_PROJECTS.find(p => p.name === f.project && p.clientId === clientId)
  );
  const invoices   = MOCK_INVOICES.filter(i => i.clientId === clientId);
  const milestones = MOCK_MILESTONES.filter(m => m.clientId === clientId);

  return { token, clientId, clientName, isValid, projects, approvals, files, invoices, milestones };
}

// Local approval state lifted to shell — portal pages call this hook then pass handlers down
export function usePortalApprovals(initialApprovals: Approval[]) {
  const [approvals, setApprovals] = useState(initialApprovals);

  function updateStatus(id: string, status: ApprovalStatus) {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  return { approvals, updateStatus };
}
