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
  scopes: ('approvals' | 'files' | 'invoices' | 'reports' | 'proposals')[];
}

// V2.7 — Decision Journal
export type DecisionObjectType = 'approval' | 'invoice' | 'proposal';

export interface DecisionEntry {
  id: string;
  workspaceId: string;
  clientId: string;
  objectType: DecisionObjectType;
  objectId: string;
  objectName: string;
  decision: string;
  note?: string;
  decidedBy: string;
  timestamp: string;
}

// V2.7 — Document Centre folders
export type DocumentFolder =
  | 'proposals_contracts'
  | 'deliverables_assets'
  | 'invoices_finance'
  | 'references_briefs';

// V2.7 — Portal Notifications
export type PortalNotificationFrequency = 'instant' | 'daily' | 'weekly';
export type PortalNotificationType =
  | 'approval_action'
  | 'invoice_update'
  | 'proposal_update'
  | 'file_upload'
  | 'comment';

export interface PortalNotification {
  id: string;
  clientId: string;
  workspaceId: string;
  type: PortalNotificationType;
  title: string;
  message: string;
  read: boolean;
  targetPath?: string;
  createdAt: string;
}

export interface PortalNotificationPrefs {
  clientId: string;
  frequency: PortalNotificationFrequency;
  enabledTypes: PortalNotificationType[];
}

// V2.7 — Timeline
export type TimelineEventType =
  | 'file_uploaded'
  | 'approval_submitted'
  | 'approval_approved'
  | 'approval_revision'
  | 'comment_added'
  | 'portal_accessed'
  | 'invoice_paid'
  | 'proposal_signed'
  | 'milestone_completed';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  label: string;
  actor: string;
  targetName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// V2.7 — Shareable Reports
export interface PortalReportSnapshot {
  token: string;
  clientId: string;
  workspaceId: string;
  generatedAt: string;
  expiresAt: string;
  data: {
    kpis: { activeProjects: number; tasksCompleted: number; pendingApprovals: number; invoicesPaid: number };
    projectProgress: Array<{ name: string; pct: number; status: string }>;
    approvalStats: { approved: number; revision: number; pending: number };
    invoiceSummary: { paid: number; outstanding: number; overdue: number };
  };
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

// ── Phase 2.6 — Finance & Profitability ──────────────────────────────────────

export interface ServiceCatalogItem {
  id: string;
  workspaceId?: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  costRate: number;
  sellRate: number;
  targetMargin: number;
  createdAt: string;
}

export interface ProjectPhase {
  id: string;
  workspaceId: string;
  projectId: string;
  stage: HandoffStage;
  budgetHours: number;
  budgetAmount: number;
  createdAt: string;
}

export interface ProjectFinancials {
  projectId: string;
  projectName: string;
  clientName: string;
  budget: number;
  estimatedHours: number;
  loggedHours: number;
  loggedCost: number;
  recognizedRevenue: number;
  margin: number;
  scopeFlagged: boolean;
  scopeFlaggedAt?: string;
  phases: ProjectPhase[];
}

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface BillingDispute {
  id: string;
  workspaceId: string;
  invoiceId?: string;
  projectId?: string;
  clientId?: string;
  title: string;
  description?: string;
  amountDisputed: number;
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstimationLineItem {
  label: string;
  hours: number;
  sellRate: number;
  costRate: number;
}

export interface EstimationTemplate {
  id: string;
  workspaceId?: string;
  name: string;
  serviceType: string;
  estimatedHours: number;
  sellRate: number;
  costRate: number;
  lineItems: EstimationLineItem[];
  isBuiltin: boolean;
  createdAt: string;
}

export interface CashForecastBucket {
  label: string;
  daysFrom: number;
  daysTo: number;
  expectedRevenue: number;
  invoicedAmount: number;
  milestoneRevenue: number;
}

export interface PortfolioClient {
  clientId: string;
  clientName: string;
  totalBudget: number;
  totalRevenue: number;
  activeProjects: number;
  avgMargin: number;
}

// ── V3.0 — Health Scores ──────────────────────────────────────────────────────

export type HealthDimension = 'delivery' | 'financial' | 'engagement' | 'risk';

export interface HealthAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  entityType: 'client' | 'project' | 'portfolio';
  entityId: string;
  link: string;
}

export interface HealthScore {
  overall: number;
  dimensions: Record<HealthDimension, number>;
  trend: 'up' | 'down' | 'stable';
  alerts: HealthAlert[];
  lastUpdated: string;
}

export interface ClientHealthScore extends HealthScore {
  clientId: string;
  clientName: string;
}

export interface ProjectHealthScore extends HealthScore {
  projectId: string;
  projectName: string;
  clientName: string;
}

export interface PortfolioHealth {
  overall: number;
  trend: 'up' | 'down' | 'stable';
  clients: ClientHealthScore[];
  projects: ProjectHealthScore[];
  summary: { healthy: number; atRisk: number; critical: number };
  alerts: HealthAlert[];
}

// ── V3.0 — Automation Analytics ───────────────────────────────────────────────

export interface WorkflowAnalyticsSummary {
  workflowId: string;
  workflowName: string;
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  lastRunAt: string;
  timeSavedMinutes: number;
}

export interface AutomationAnalyticsSnapshot {
  period: 'day' | 'week' | 'month';
  periodLabel: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalTimeSavedMinutes: number;
  avgSuccessRate: number;
  topWorkflows: WorkflowAnalyticsSummary[];
  triggerBreakdown: Record<string, number>;
  dailySeries: Array<{ date: string; executions: number; failures: number }>;
}

// ── V3.0 — Reports by Role ─────────────────────────────────────────────────────

export type ReportRole = 'executive' | 'finance' | 'project_manager' | 'delivery';

// ── V3.0 — Team Scorecards ─────────────────────────────────────────────────────

export interface TeamMemberScorecard {
  userId: string;
  name: string;
  role: string;
  deliveryScore: number;
  capacityPct: number;
  taskCompletionRate: number;
  onTimeRate: number;
  openTasks: number;
  overdueCount: number;
}

export interface TeamScorecard {
  period: string;
  teamDeliveryScore: number;
  avgCapacityPct: number;
  members: TeamMemberScorecard[];
}

// ── V3.0 — Marketplace ────────────────────────────────────────────────────────

export type MarketplaceItemType = 'template' | 'automation' | 'view' | 'playbook';
export type MarketplaceCategory =
  | 'onboarding'
  | 'delivery'
  | 'finance'
  | 'communication'
  | 'reporting'
  | 'operations';

export interface MarketplaceItem {
  id: string;
  type: MarketplaceItemType;
  name: string;
  description: string;
  category: MarketplaceCategory;
  tags: string[];
  usageCount: number;
  isBuiltIn: boolean;
  createdBy: string;
}

