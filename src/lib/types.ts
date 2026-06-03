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

export type ClientStatus = 'active' | 'onboarding' | 'lead' | 'inactive';

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

// ── Phase 2.5 — Workflow Engine ───────────────────────────────────────────────

export type WorkflowTriggerEvent =
  | 'proposal_signed'
  | 'project_created'
  | 'project_status_changed'
  | 'task_overdue'
  | 'approval_overdue'
  | 'invoice_overdue'
  | 'scope_change_detected'
  | 'ticket_sla_breached'
  | 'manual';

export type WorkflowStepType =
  | 'condition'
  | 'create_task'
  | 'send_notification'
  | 'assign_to'
  | 'escalate'
  | 'delay'
  | 'update_status'
  | 'create_handoff'
  | 'set_sla'
  | 'validate_required_fields';

export type WorkflowRunStatus = 'running' | 'completed' | 'failed' | 'paused';
export type HandoffStage = 'sales' | 'pm' | 'production' | 'finance';
export type HandoffStatus = 'pending' | 'validated' | 'rejected';
export type ProjectType = 'web_design' | 'branding' | 'strategy' | 'custom';

export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepOrder: number;
  stepType: WorkflowStepType;
  config: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  workspaceId: string | null;
  name: string;
  description?: string;
  isActive: boolean;
  isTemplate: boolean;
  triggerEvent: WorkflowTriggerEvent;
  triggerFilters: Record<string, unknown>;
  steps?: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRun {
  id: string;
  workspaceId: string;
  workflowId: string;
  workflowName?: string;
  triggerEvent: WorkflowTriggerEvent;
  entityType?: string;
  entityId?: string;
  status: WorkflowRunStatus;
  currentStep: number;
  resumeAt?: string;
  stepsLog: Array<{ stepOrder: number; action: string; result: string; ts: string }>;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface HandoffRequiredField {
  field: string;
  label: string;
  satisfied: boolean;
}

export interface Handoff {
  id: string;
  workspaceId: string;
  projectId: string;
  fromStage: HandoffStage;
  toStage: HandoffStage;
  status: HandoffStatus;
  requiredFields: HandoffRequiredField[];
  notes?: string;
  signedOffBy?: string;
  signedOffAt?: string;
  createdAt: string;
}

export interface ProjectTemplate {
  id: string;
  workspaceId?: string;
  name: string;
  projectType: ProjectType;
  description?: string;
  isBuiltin: boolean;
  taskPacks: Array<{
    title: string;
    tasks: Array<{ title: string; assigneeRole: string; dueOffsetDays: number; priority: string }>;
  }>;
  checklistItems: Array<{ item: string; required: boolean; stage: string }>;
  requiredFields: Array<{ field: string; label: string; when: string }>;
  slaDefaults: { approvalResponseHours?: number; taskWarningHours?: number };
  createdAt: string;
}

export interface SLAPolicy {
  id: string;
  workspaceId: string;
  name: string;
  responseTime: number;
  resolutionTime: number;
  priority: string;
}

