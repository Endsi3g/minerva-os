export type DealStage = 'new_lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Lead {
  id: string;
  company: string;
  contact: string;
  email: string;
  value: number;
  probability: number;
  stage: DealStage;
  daysInStage: number;
  owner: string;
  notes?: string;
}

export type ClientStatus = 'active' | 'onboarding' | 'inactive';

export interface Client {
  id: string;
  company: string;
  industry: string;
  contact: string;
  email: string;
  monthlyValue: number;
  activeProjects: number;
  status: ClientStatus;
}

// ── Phase 3 ──────────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'on_hold' | 'completed';

export interface Project {
  id: string;
  name: string;
  client: string;
  clientId: string;
  status: ProjectStatus;
  dueDate: string;
  budget: number;
  spent: number;
  totalTasks: number;
  doneTasks: number;
  team: string[];
}

export type TaskStatus   = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  project: string;
  projectId: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export type ApprovalStatus  = 'pending' | 'approved' | 'revision';
export type DeliverableType = 'design' | 'copy' | 'video' | 'document';

export interface Approval {
  id: string;
  name: string;
  type: DeliverableType;
  project: string;
  client: string;
  submittedBy: string;
  submittedDate: string;
  status: ApprovalStatus;
}

export type FileType = 'image' | 'video' | 'document' | 'archive';

export interface FileAsset {
  id: string;
  name: string;
  type: FileType;
  size: string;
  project: string;
  uploadedBy: string;
  uploadedDate: string;
}

// ── Phase 4 ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  number: string;
  client: string;
  clientId: string;
  project: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
  lineItems: { description: string; qty: number; unitPrice: number }[];
}

export type RetainerStatus = 'active' | 'paused' | 'expired';
export type RetainerCycle  = 'monthly' | 'quarterly' | 'annual';

export interface Retainer {
  id: string;
  client: string;
  clientId: string;
  amount: number;
  currency: string;
  cycle: RetainerCycle;
  status: RetainerStatus;
  startDate: string;
  renewalDate: string;
  hoursIncluded: number;
  hoursUsed: number;
  notes?: string;
}

export interface Milestone {
  id: string;
  title: string;
  project: string;
  projectId: string;
  clientId: string;
  dueDate: string;
  status: 'upcoming' | 'completed' | 'overdue';
}

// ── Client Portal ─────────────────────────────────────────────────────────────

export interface ClientPortalToken {
  token: string;
  clientId: string;
  clientName: string;
  expiresAt: string;
  scopes: ('approvals' | 'files' | 'invoices' | 'reports')[];
}

// ── Time Tracking ──────────────────────────────────────────────────────────────

export interface TimeEntry {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number; // minutes
  billable: boolean;
  hourlyRate?: number;
}

export interface ActiveTimer {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  description: string;
  startTime: number;
}

