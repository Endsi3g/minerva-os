import type { ApprovalStatus } from '@/lib/types';

export type PortalApprovalDisplayStatus =
  | 'pending_client'
  | 'approved'
  | 'changes_requested'
  | 'in_production'
  | 'ready_for_review';

export function mapApprovalStatus(raw: ApprovalStatus): PortalApprovalDisplayStatus {
  const map: Record<ApprovalStatus, PortalApprovalDisplayStatus> = {
    pending: 'pending_client',
    approved: 'approved',
    revision: 'changes_requested',
  };
  return map[raw];
}

export const PORTAL_STATUS_DISPLAY: Record<
  PortalApprovalDisplayStatus,
  { labelKey: string; color: string; bg: string; border: string }
> = {
  pending_client:    { labelKey: 'portal.status.pendingClient',    color: '#B89B6A', bg: 'rgba(184,155,106,0.10)', border: 'rgba(184,155,106,0.22)' },
  approved:          { labelKey: 'portal.status.approved',          color: '#7FA38A', bg: 'rgba(127,163,138,0.10)', border: 'rgba(127,163,138,0.22)' },
  changes_requested: { labelKey: 'portal.status.changesRequested', color: '#A86A6A', bg: 'rgba(168,106,106,0.10)', border: 'rgba(168,106,106,0.22)' },
  in_production:     { labelKey: 'portal.status.inProduction',     color: '#B8BDC7', bg: 'rgba(184,189,199,0.10)', border: 'rgba(184,189,199,0.15)' },
  ready_for_review:  { labelKey: 'portal.status.readyForReview',   color: '#D8DDE6', bg: 'rgba(216,221,230,0.08)', border: 'rgba(216,221,230,0.15)' },
};
