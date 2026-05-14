import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Approval, ApprovalStatus } from '@/lib/types';

export function usePortalData() {
  const params = useParams();
  const token = params?.token as string | undefined;
  
  const portalData = useQuery(api.portal.getByToken, token ? { token } : 'skip');

  const isValid = !!portalData;
  const clientName = portalData?.client?.company ?? 'Unknown Client';
  const clientId = portalData?.client?._id ?? null;

  return {
    token,
    clientId,
    clientName,
    isValid,
    projects: portalData?.projects ?? [],
    tasks: portalData?.tasks ?? [],
    approvals: portalData?.approvals ?? [],
    files: portalData?.assets ?? [],
    invoices: portalData?.invoices ?? [],
    milestones: portalData?.milestones ?? [],
  };
}

// Local approval state lifted to shell — portal pages call this hook then pass handlers down
export function usePortalApprovals(initialApprovals: Approval[]) {
  const [approvals, setApprovals] = useState(initialApprovals);

  function updateStatus(id: string, status: ApprovalStatus) {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  return { approvals, updateStatus };
}
