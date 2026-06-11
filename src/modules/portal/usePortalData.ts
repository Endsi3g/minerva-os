'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { Approval, ApprovalStatus, PortalMessage } from '@/lib/types';

export function usePortalData() {
  const params = useParams();
  const token = params?.token as string | undefined;

  const [portalData, setPortalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [messages, setMessages] = useState<PortalMessage[]>([]);

  function refresh() {
    setTriggerFetch(prev => prev + 1);
  }

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function fetchPortalData() {
      try {
        const res = await fetch(`/api/portal/data?token=${token}`);
        if (res.status === 401) {
          setIsExpired(true);
          setPortalData(null);
        } else if (res.status === 403) {
          const data = await res.json();
          setNeedsVerification(true);
          setClientEmail(data.email || '');
          setPortalData(null);
        } else if (res.ok) {
          const data = await res.json();
          setPortalData(data);
          setNeedsVerification(false);
          setIsExpired(false);
          fetch(`/api/portal/messages?token=${token}`)
            .then(r => r.ok ? r.json() : [])
            .then((msgs: PortalMessage[]) => setMessages(msgs))
            .catch(() => {});
        } else {
          setPortalData(null);
        }
      } catch (err) {
        console.error('Error fetching portal data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPortalData();
  }, [token, triggerFetch]);

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
    needsVerification,
    clientEmail,
    isExpired,
    projects: portalData?.projects ?? [],
    tasks: portalData?.tasks ?? [],
    approvals: portalData?.approvals ?? [],
    files: portalData?.assets ?? [],
    invoices: portalData?.invoices ?? [],
    milestones: portalData?.milestones ?? [],
    tickets: portalData?.tickets ?? [],
    proposals: portalData?.proposals ?? [],
    scopes: portalData?.scopes ?? [],
    messages,
    refresh,
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
