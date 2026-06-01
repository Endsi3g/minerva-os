import type { Lead, Client, Project, Task, Approval, FileAsset, Invoice, Retainer, Milestone, ClientPortalToken } from './types';


export const MOCK_LEADS: Lead[] = [
  // New Lead
  { id: 'l1', company: 'Luminary Group', contact: 'Sophie Bernard', email: 'sophie@luminarygroup.co', value: 18000, probability: 20, stage: 'new_lead', daysInStage: 2, owner: 'US' },
  { id: 'l2', company: 'Crestline Studio', contact: 'James Whitmore', email: 'james@crestline.io', value: 9500, probability: 15, stage: 'new_lead', daysInStage: 5, owner: 'US' },
  { id: 'l3', company: 'Solace Media', contact: 'Amara Diallo', email: 'amara@solacemedia.com', value: 22000, probability: 25, stage: 'new_lead', daysInStage: 1, owner: 'US' },

  // Qualified
  { id: 'l4', company: 'Vantage Digital', contact: 'Lucas Petrov', email: 'lucas@vantagedigital.com', value: 34000, probability: 45, stage: 'qualified', daysInStage: 8, owner: 'US' },
  { id: 'l5', company: 'Cascade Ventures', contact: 'Nora Holt', email: 'nora@cascadeventures.io', value: 15500, probability: 50, stage: 'qualified', daysInStage: 4, owner: 'US' },
  { id: 'l6', company: 'Meridian Brands', contact: 'Tyler Chen', email: 'tyler@meridianbrands.co', value: 28000, probability: 55, stage: 'qualified', daysInStage: 11, owner: 'US' },

  // Proposal
  { id: 'l7', company: 'Apex Creative Co.', contact: 'Isabelle Fontaine', email: 'isabelle@apexcreative.fr', value: 41000, probability: 65, stage: 'proposal', daysInStage: 6, owner: 'US' },
  { id: 'l8', company: 'Wren & Partners', contact: 'Oliver Drake', email: 'oliver@wrenpartners.com', value: 19800, probability: 60, stage: 'proposal', daysInStage: 3, owner: 'US' },
  { id: 'l9', company: 'Solara Health', contact: 'Priya Nair', email: 'priya@solarahealth.com', value: 52000, probability: 70, stage: 'proposal', daysInStage: 9, owner: 'US' },

  // Negotiation
  { id: 'l10', company: 'Orbis Consulting', contact: 'Marco Russo', email: 'marco@orbisconsulting.eu', value: 67000, probability: 80, stage: 'negotiation', daysInStage: 14, owner: 'US' },
  { id: 'l11', company: 'Halo Collective', contact: 'Emma Walsh', email: 'emma@halocollective.co', value: 31500, probability: 75, stage: 'negotiation', daysInStage: 7, owner: 'US' },

  // Won
  { id: 'l12', company: 'Stratum Labs', contact: 'Felix Braun', email: 'felix@stratumlabs.de', value: 48000, probability: 100, stage: 'won', daysInStage: 0, owner: 'US' },
  { id: 'l13', company: 'Volta Interactive', contact: 'Camille Laurent', email: 'camille@voltainteractive.fr', value: 36000, probability: 100, stage: 'won', daysInStage: 0, owner: 'US' },
  { id: 'l14', company: 'Pollen Studio', contact: 'Asha Kapoor', email: 'asha@pollenstudio.in', value: 22500, probability: 100, stage: 'won', daysInStage: 0, owner: 'US' },

  // Lost
  { id: 'l15', company: 'Nexus Corp', contact: 'Dario Moretti', email: 'dario@nexuscorp.it', value: 55000, probability: 0, stage: 'lost', daysInStage: 0, owner: 'US' },
  { id: 'l16', company: 'Skyline Agency', contact: 'Hannah Kim', email: 'hannah@skylineagency.kr', value: 12000, probability: 0, stage: 'lost', daysInStage: 0, owner: 'US' },
];

export const MOCK_CLIENTS: Client[] = [
  { id: 'c1', company: 'Stratum Labs', industry: 'Technology', contact: 'Felix Braun', email: 'felix@stratumlabs.de', monthlyValue: 8000, activeProjects: 3, status: 'active' },
  { id: 'c2', company: 'Volta Interactive', industry: 'Entertainment', contact: 'Camille Laurent', email: 'camille@voltainteractive.fr', monthlyValue: 6000, activeProjects: 2, status: 'active' },
  { id: 'c3', company: 'Pollen Studio', industry: 'Design', contact: 'Asha Kapoor', email: 'asha@pollenstudio.in', monthlyValue: 3750, activeProjects: 1, status: 'active' },
  { id: 'c4', company: 'Orbis Consulting', industry: 'Finance', contact: 'Marco Russo', email: 'marco@orbisconsulting.eu', monthlyValue: 11200, activeProjects: 4, status: 'onboarding' },
  { id: 'c5', company: 'Halo Collective', industry: 'Media', contact: 'Emma Walsh', email: 'emma@halocollective.co', monthlyValue: 5250, activeProjects: 2, status: 'onboarding' },
  { id: 'c6', company: 'Apex Creative Co.', industry: 'Advertising', contact: 'Isabelle Fontaine', email: 'isabelle@apexcreative.fr', monthlyValue: 4100, activeProjects: 1, status: 'active' },
  { id: 'c7', company: 'Cascade Ventures', industry: 'Venture Capital', contact: 'Nora Holt', email: 'nora@cascadeventures.io', monthlyValue: 0, activeProjects: 0, status: 'inactive' },
  { id: 'c8', company: 'Solara Health', industry: 'Healthcare', contact: 'Priya Nair', email: 'priya@solarahealth.com', monthlyValue: 8667, activeProjects: 2, status: 'active' },
];

// ── Phase 3 mock data ─────────────────────────────────────────────────────────

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Brand Identity Refresh', client: 'Stratum Labs',     clientId: 'c1', status: 'active',    dueDate: '2026-07-15', budget: 24000, spent: 14200, totalTasks: 18, doneTasks: 11, team: ['US', 'JR', 'ML'] },
  { id: 'p2', name: 'Campaign: Q3 Launch',    client: 'Volta Interactive', clientId: 'c2', status: 'active',    dueDate: '2026-06-30', budget: 32000, spent: 8400,  totalTasks: 24, doneTasks: 7,  team: ['US', 'PK'] },
  { id: 'p3', name: 'Website Redesign',        client: 'Solara Health',    clientId: 'c8', status: 'active',    dueDate: '2026-08-01', budget: 18000, spent: 3100,  totalTasks: 30, doneTasks: 6,  team: ['US', 'JR', 'AK', 'TL'] },
  { id: 'p4', name: 'Motion System V2',        client: 'Pollen Studio',    clientId: 'c3', status: 'active',    dueDate: '2026-06-20', budget: 9500,  spent: 8900,  totalTasks: 10, doneTasks: 9,  team: ['US', 'ML'] },
  { id: 'p5', name: 'Investor Deck',           client: 'Orbis Consulting', clientId: 'c4', status: 'on_hold',   dueDate: '2026-07-01', budget: 6000,  spent: 1200,  totalTasks: 8,  doneTasks: 2,  team: ['US'] },
  { id: 'p6', name: 'Annual Report 2025',      client: 'Halo Collective',  clientId: 'c5', status: 'completed', dueDate: '2026-04-30', budget: 12000, spent: 11800, totalTasks: 14, doneTasks: 14, team: ['US', 'JR'] },
];

export const MOCK_TASKS: Task[] = [
  // Brand Identity Refresh (p1)
  { id: 't1',  title: 'Finalise logo variations',      project: 'Brand Identity Refresh', projectId: 'p1', assignee: 'JR', dueDate: '2026-06-14', priority: 'high',   status: 'review' },
  { id: 't2',  title: 'Colour palette documentation',  project: 'Brand Identity Refresh', projectId: 'p1', assignee: 'ML', dueDate: '2026-06-18', priority: 'medium', status: 'in_progress' },
  { id: 't3',  title: 'Typography system',             project: 'Brand Identity Refresh', projectId: 'p1', assignee: 'JR', dueDate: '2026-06-21', priority: 'medium', status: 'todo' },
  { id: 't4',  title: 'Brand guidelines PDF',          project: 'Brand Identity Refresh', projectId: 'p1', assignee: 'US', dueDate: '2026-07-01', priority: 'low',    status: 'todo' },

  // Campaign: Q3 Launch (p2)
  { id: 't5',  title: 'Social asset templates',        project: 'Campaign: Q3 Launch',    projectId: 'p2', assignee: 'PK', dueDate: '2026-06-10', priority: 'urgent', status: 'in_progress' },
  { id: 't6',  title: 'Hero video script',             project: 'Campaign: Q3 Launch',    projectId: 'p2', assignee: 'US', dueDate: '2026-06-12', priority: 'high',   status: 'review' },
  { id: 't7',  title: 'Email sequence copy',           project: 'Campaign: Q3 Launch',    projectId: 'p2', assignee: 'PK', dueDate: '2026-06-20', priority: 'medium', status: 'todo' },
  { id: 't8',  title: 'Landing page wireframes',       project: 'Campaign: Q3 Launch',    projectId: 'p2', assignee: 'JR', dueDate: '2026-06-25', priority: 'high',   status: 'todo' },

  // Website Redesign (p3)
  { id: 't9',  title: 'Information architecture audit',project: 'Website Redesign',       projectId: 'p3', assignee: 'TL', dueDate: '2026-06-15', priority: 'high',   status: 'done' },
  { id: 't10', title: 'Figma component library',       project: 'Website Redesign',       projectId: 'p3', assignee: 'AK', dueDate: '2026-07-01', priority: 'high',   status: 'in_progress' },
  { id: 't11', title: 'Homepage prototype',            project: 'Website Redesign',       projectId: 'p3', assignee: 'JR', dueDate: '2026-07-10', priority: 'medium', status: 'todo' },

  // Motion System (p4)
  { id: 't12', title: 'After Effects kit review',      project: 'Motion System V2',       projectId: 'p4', assignee: 'ML', dueDate: '2026-06-11', priority: 'urgent', status: 'review' },
  { id: 't13', title: 'Export final renders',          project: 'Motion System V2',       projectId: 'p4', assignee: 'ML', dueDate: '2026-06-14', priority: 'high',   status: 'todo' },

  // Investor Deck (p5)
  { id: 't14', title: 'Executive summary slide',       project: 'Investor Deck',          projectId: 'p5', assignee: 'US', dueDate: '2026-07-05', priority: 'medium', status: 'in_progress' },
];

export const MOCK_APPROVALS: Approval[] = [
  { id: 'a1', name: 'Logo Suite v3',            type: 'design',   project: 'Brand Identity Refresh', client: 'Stratum Labs',     submittedBy: 'JR', submittedDate: '2026-06-09', status: 'pending' },
  { id: 'a2', name: 'Hero Video — 30s cut',     type: 'video',    project: 'Campaign: Q3 Launch',    client: 'Volta Interactive', submittedBy: 'US', submittedDate: '2026-06-08', status: 'pending' },
  { id: 'a3', name: 'Email sequence — 5 parts', type: 'copy',     project: 'Campaign: Q3 Launch',    client: 'Volta Interactive', submittedBy: 'PK', submittedDate: '2026-06-07', status: 'revision' },
  { id: 'a4', name: 'Motion kit — looping set', type: 'video',    project: 'Motion System V2',       client: 'Pollen Studio',     submittedBy: 'ML', submittedDate: '2026-06-10', status: 'pending' },
  { id: 'a5', name: 'Annual Report layout',     type: 'document', project: 'Annual Report 2025',     client: 'Halo Collective',   submittedBy: 'JR', submittedDate: '2026-04-28', status: 'approved' },
  { id: 'a6', name: 'IA sitemap deck',          type: 'document', project: 'Website Redesign',       client: 'Solara Health',     submittedBy: 'TL', submittedDate: '2026-06-06', status: 'approved' },
];

export const MOCK_FILES: FileAsset[] = [
  { id: 'f1',  name: 'logo-suite-v3.zip',            type: 'archive',  size: '14.2 MB', project: 'Brand Identity Refresh', uploadedBy: 'JR', uploadedDate: '2026-06-09' },
  { id: 'f2',  name: 'brand-guidelines.pdf',          type: 'document', size: '4.8 MB',  project: 'Brand Identity Refresh', uploadedBy: 'US', uploadedDate: '2026-06-05' },
  { id: 'f3',  name: 'hero-video-30s.mp4',            type: 'video',    size: '182 MB',  project: 'Campaign: Q3 Launch',    uploadedBy: 'US', uploadedDate: '2026-06-08' },
  { id: 'f4',  name: 'social-templates.figma',        type: 'document', size: '6.1 MB',  project: 'Campaign: Q3 Launch',    uploadedBy: 'PK', uploadedDate: '2026-06-04' },
  { id: 'f5',  name: 'homepage-mockup.png',           type: 'image',    size: '3.4 MB',  project: 'Website Redesign',       uploadedBy: 'JR', uploadedDate: '2026-06-03' },
  { id: 'f6',  name: 'component-library.figma',       type: 'document', size: '9.7 MB',  project: 'Website Redesign',       uploadedBy: 'AK', uploadedDate: '2026-06-01' },
  { id: 'f7',  name: 'motion-kit-looping.zip',        type: 'archive',  size: '224 MB',  project: 'Motion System V2',       uploadedBy: 'ML', uploadedDate: '2026-06-10' },
  { id: 'f8',  name: 'motion-preview.mp4',            type: 'video',    size: '48 MB',   project: 'Motion System V2',       uploadedBy: 'ML', uploadedDate: '2026-06-09' },
  { id: 'f9',  name: 'annual-report-2025.pdf',        type: 'document', size: '11.2 MB', project: 'Annual Report 2025',     uploadedBy: 'JR', uploadedDate: '2026-04-28' },
  { id: 'f10', name: 'ia-sitemap.pdf',                type: 'document', size: '1.8 MB',  project: 'Website Redesign',       uploadedBy: 'TL', uploadedDate: '2026-06-06' },
];

// ── Phase 4 — Billing ─────────────────────────────────────────────────────────

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    number: 'INV-2026-041',
    client: 'Stratum Labs',
    clientId: 'c1',
    project: 'Brand Identity Refresh',
    amount: 8000,
    currency: 'USD',
    status: 'paid',
    issuedDate: '2026-05-01',
    dueDate: '2026-05-15',
    paidDate: '2026-05-12',
    lineItems: [
      { description: 'Brand strategy retainer — May', qty: 1, unitPrice: 5000 },
      { description: 'Logo suite production', qty: 1, unitPrice: 3000 },
    ],
  },
  {
    id: 'inv2',
    number: 'INV-2026-042',
    client: 'Volta Interactive',
    clientId: 'c2',
    project: 'Campaign: Q3 Launch',
    amount: 6000,
    currency: 'USD',
    status: 'sent',
    issuedDate: '2026-05-20',
    dueDate: '2026-06-04',
    lineItems: [
      { description: 'Creative production — May', qty: 1, unitPrice: 4000 },
      { description: 'Social asset pack (30 units)', qty: 30, unitPrice: 66.67 },
    ],
  },
  {
    id: 'inv3',
    number: 'INV-2026-043',
    client: 'Solara Health',
    clientId: 'c8',
    project: 'Website Redesign',
    amount: 4500,
    currency: 'USD',
    status: 'overdue',
    issuedDate: '2026-04-30',
    dueDate: '2026-05-15',
    lineItems: [
      { description: 'Discovery & architecture phase', qty: 1, unitPrice: 4500 },
    ],
  },
  {
    id: 'inv4',
    number: 'INV-2026-044',
    client: 'Orbis Consulting',
    clientId: 'c4',
    project: 'Investor Deck',
    amount: 3000,
    currency: 'USD',
    status: 'draft',
    issuedDate: '2026-06-01',
    dueDate: '2026-06-16',
    lineItems: [
      { description: 'Slide design — 20 slides', qty: 20, unitPrice: 150 },
    ],
  },
  {
    id: 'inv5',
    number: 'INV-2026-045',
    client: 'Pollen Studio',
    clientId: 'c3',
    project: 'Motion System V2',
    amount: 9500,
    currency: 'USD',
    status: 'paid',
    issuedDate: '2026-05-10',
    dueDate: '2026-05-25',
    paidDate: '2026-05-22',
    lineItems: [
      { description: 'Motion system design & export', qty: 1, unitPrice: 9500 },
    ],
  },
  {
    id: 'inv6',
    number: 'INV-2026-046',
    client: 'Halo Collective',
    clientId: 'c5',
    project: 'Annual Report 2025',
    amount: 12000,
    currency: 'USD',
    status: 'paid',
    issuedDate: '2026-04-15',
    dueDate: '2026-04-30',
    paidDate: '2026-04-29',
    lineItems: [
      { description: 'Annual report design & print-ready export', qty: 1, unitPrice: 12000 },
    ],
  },
];

export const MOCK_RETAINERS: Retainer[] = [
  {
    id: 'ret1',
    client: 'Stratum Labs',
    clientId: 'c1',
    amount: 8000,
    currency: 'USD',
    cycle: 'monthly',
    status: 'active',
    startDate: '2026-01-01',
    renewalDate: '2026-07-01',
    hoursIncluded: 40,
    hoursUsed: 28,
    notes: 'Full creative production + strategy advisory.',
  },
  {
    id: 'ret2',
    client: 'Volta Interactive',
    clientId: 'c2',
    amount: 6000,
    currency: 'USD',
    cycle: 'monthly',
    status: 'active',
    startDate: '2026-02-01',
    renewalDate: '2026-08-01',
    hoursIncluded: 32,
    hoursUsed: 19,
    notes: 'Campaign management and content production.',
  },
  {
    id: 'ret3',
    client: 'Solara Health',
    clientId: 'c8',
    amount: 26000,
    currency: 'USD',
    cycle: 'quarterly',
    status: 'active',
    startDate: '2026-04-01',
    renewalDate: '2026-07-01',
    hoursIncluded: 120,
    hoursUsed: 34,
  },
  {
    id: 'ret4',
    client: 'Apex Creative Co.',
    clientId: 'c6',
    amount: 4100,
    currency: 'USD',
    cycle: 'monthly',
    status: 'active',
    startDate: '2026-03-01',
    renewalDate: '2026-09-01',
    hoursIncluded: 20,
    hoursUsed: 20,
    notes: 'At capacity — expansion discussion pending.',
  },
  {
    id: 'ret5',
    client: 'Cascade Ventures',
    clientId: 'c7',
    amount: 3500,
    currency: 'USD',
    cycle: 'monthly',
    status: 'paused',
    startDate: '2025-11-01',
    renewalDate: '2026-05-01',
    hoursIncluded: 16,
    hoursUsed: 0,
    notes: 'Paused pending board approval of new budget.',
  },
];

// ── Phase 4 — Milestones ─────────────────────────────────────────────────────

export const MOCK_MILESTONES: Milestone[] = [
  { id: 'm1', title: 'Logo suite approved', project: 'Brand Identity Refresh', projectId: 'p1', clientId: 'c1', dueDate: '2026-06-14', status: 'upcoming' },
  { id: 'm2', title: 'Brand guidelines delivered', project: 'Brand Identity Refresh', projectId: 'p1', clientId: 'c1', dueDate: '2026-07-01', status: 'upcoming' },
  { id: 'm3', title: 'Campaign assets delivered', project: 'Campaign: Q3 Launch', projectId: 'p2', clientId: 'c2', dueDate: '2026-06-20', status: 'upcoming' },
  { id: 'm4', title: 'Campaign go-live', project: 'Campaign: Q3 Launch', projectId: 'p2', clientId: 'c2', dueDate: '2026-06-30', status: 'upcoming' },
  { id: 'm5', title: 'Figma handoff', project: 'Website Redesign', projectId: 'p3', clientId: 'c8', dueDate: '2026-07-10', status: 'upcoming' },
  { id: 'm6', title: 'Development start', project: 'Website Redesign', projectId: 'p3', clientId: 'c8', dueDate: '2026-07-20', status: 'upcoming' },
  { id: 'm7', title: 'Annual report final delivery', project: 'Annual Report 2025', projectId: 'p6', clientId: 'c5', dueDate: '2026-04-30', status: 'completed' },
  { id: 'm8', title: 'Motion kit export', project: 'Motion System V2', projectId: 'p4', clientId: 'c3', dueDate: '2026-06-14', status: 'upcoming' },
];

// ── Phase 4 — Client Portal ───────────────────────────────────────────────────

export const MOCK_PORTAL_TOKENS: ClientPortalToken[] = [
  {
    token: 'pt_a1b2c3d4e5f6-stratum',
    clientId: 'c1',
    clientName: 'Stratum Labs',
    expiresAt: '2026-12-31T23:59:59Z',
    scopes: ['approvals', 'files', 'invoices'],
  },
  {
    token: 'pt_b2c3d4e5f6a1-volta',
    clientId: 'c2',
    clientName: 'Volta Interactive',
    expiresAt: '2026-12-31T23:59:59Z',
    scopes: ['approvals', 'files', 'invoices', 'reports'],
  },
  {
    token: 'pt_c3d4e5f6a1b2-solara',
    clientId: 'c8',
    clientName: 'Solara Health',
    expiresAt: '2026-09-30T23:59:59Z',
    scopes: ['approvals', 'files'],
  },
  {
    token: 'pt_d4e5f6a1b2c3-orbis',
    clientId: 'c4',
    clientName: 'Orbis Consulting',
    expiresAt: '2026-08-01T23:59:59Z',
    scopes: ['approvals'],
  },
  // Demo shorthand tokens for easy dev access
  { token: 'demo-stratum', clientId: 'c1', clientName: 'Stratum Labs',     expiresAt: '2027-12-31T23:59:59Z', scopes: ['approvals', 'files', 'invoices'] },
  { token: 'demo-volta',   clientId: 'c2', clientName: 'Volta Interactive', expiresAt: '2027-12-31T23:59:59Z', scopes: ['approvals', 'files', 'invoices', 'reports'] },
  { token: 'demo-solara',  clientId: 'c8', clientName: 'Solara Health',     expiresAt: '2027-12-31T23:59:59Z', scopes: ['approvals', 'files', 'invoices'] },
];

// ── Demo mode data (not typed to avoid strict-type overhead) ─────────────────

export const MOCK_TIME_ENTRIES = [
  { id: 'te1', project: 'Brand Identity Refresh', projectId: 'p1', task: 'Finalise logo variations', userId: 'demo@uprisingstudio.com', date: '2026-05-29', description: 'Logo refinements + client annotations', duration: 135, billable: true, hourlyRate: 95, startTime: 1748512800000, endTime: 1748520900000 },
  { id: 'te2', project: 'Brand Identity Refresh', projectId: 'p1', task: 'Colour palette documentation', userId: 'demo@uprisingstudio.com', date: '2026-05-30', description: 'Figma token export + PDF', duration: 90, billable: true, hourlyRate: 95, startTime: 1748599200000, endTime: 1748604600000 },
  { id: 'te3', project: 'Campaign: Q3 Launch', projectId: 'p2', task: 'Social asset templates', userId: 'demo@uprisingstudio.com', date: '2026-05-28', description: 'Instagram + LinkedIn post templates', duration: 180, billable: true, hourlyRate: 95, startTime: 1748426400000, endTime: 1748437200000 },
  { id: 'te4', project: 'Website Redesign', projectId: 'p3', task: 'Figma component library', userId: 'demo@uprisingstudio.com', date: '2026-05-27', description: 'Atomic design system setup', duration: 240, billable: true, hourlyRate: 95, startTime: 1748340000000, endTime: 1748354400000 },
  { id: 'te5', project: 'Investor Deck', projectId: 'p5', task: 'Executive summary slide', userId: 'demo@uprisingstudio.com', date: '2026-05-26', description: 'Draft + first revision', duration: 60, billable: false, hourlyRate: 0, startTime: 1748253600000, endTime: 1748257200000 },
  { id: 'te6', project: 'Motion System V2', projectId: 'p4', task: 'After Effects kit review', userId: 'demo@uprisingstudio.com', date: '2026-05-31', description: 'QA on all looping variants', duration: 120, billable: true, hourlyRate: 110, startTime: 1748685600000, endTime: 1748692800000 },
  { id: 'te7', project: 'Campaign: Q3 Launch', projectId: 'p2', task: 'Hero video script', userId: 'demo@uprisingstudio.com', date: '2026-06-01', description: 'Script v2 + director notes', duration: 75, billable: true, hourlyRate: 95, startTime: 1748772000000, endTime: 1748776500000 },
  { id: 'te8', project: 'Brand Identity Refresh', projectId: 'p1', task: 'Typography system', userId: 'demo@uprisingstudio.com', date: '2026-05-25', description: 'Variable font pairing exploration', duration: 150, billable: true, hourlyRate: 95, startTime: 1748167200000, endTime: 1748176200000 },
];

export const MOCK_EXPENSES = [
  { id: 'exp1', description: 'Adobe Creative Cloud — team license', category: 'Software', amount: 599, currency: 'USD', date: '2026-06-01', projectId: null, submittedBy: 'demo@uprisingstudio.com', status: 'approved', notes: 'Annual renewal' },
  { id: 'exp2', description: 'Stock footage pack — Artgrid', category: 'Assets', amount: 149, currency: 'USD', date: '2026-05-28', projectId: 'p2', submittedBy: 'demo@uprisingstudio.com', status: 'approved', notes: 'Q3 campaign production' },
  { id: 'exp3', description: 'Client lunch — Stratum Labs', category: 'Meals', amount: 87, currency: 'USD', date: '2026-05-25', projectId: 'p1', submittedBy: 'demo@uprisingstudio.com', status: 'pending', notes: 'Kickoff lunch' },
  { id: 'exp4', description: 'Dribbble Pro subscription', category: 'Software', amount: 15, currency: 'USD', date: '2026-05-20', projectId: null, submittedBy: 'demo@uprisingstudio.com', status: 'approved', notes: '' },
  { id: 'exp5', description: 'Font license — Neue Haas Grotesk', category: 'Assets', amount: 299, currency: 'USD', date: '2026-05-15', projectId: 'p1', submittedBy: 'demo@uprisingstudio.com', status: 'approved', notes: 'Brand Identity project' },
  { id: 'exp6', description: 'Notion team plan', category: 'Software', amount: 96, currency: 'USD', date: '2026-05-01', projectId: null, submittedBy: 'demo@uprisingstudio.com', status: 'rejected', notes: 'Duplicate — already covered by workspace plan' },
];

export const MOCK_TICKETS = [
  { id: 'tkt1', subject: 'Invoice INV-2026-043 payment dispute', category: 'Billing', priority: 'high', status: 'open', clientId: 'c8', client: 'Solara Health', createdAt: '2026-05-28', description: 'Client disputes the overdue status, claims payment was sent on May 14.' },
  { id: 'tkt2', subject: 'Portal file access not working', category: 'Bug', priority: 'medium', status: 'in_progress', clientId: 'c2', client: 'Volta Interactive', createdAt: '2026-05-29', description: 'Client cannot download files from their portal. Returns 403 error.' },
  { id: 'tkt3', subject: 'Request: add team member to project', category: 'Feature', priority: 'low', status: 'resolved', clientId: 'c1', client: 'Stratum Labs', createdAt: '2026-05-20', description: 'Add Camille Moreau as a reviewer on Brand Identity project.' },
  { id: 'tkt4', subject: 'Motion export quality too compressed', category: 'Question', priority: 'medium', status: 'open', clientId: 'c3', client: 'Pollen Studio', createdAt: '2026-06-01', description: 'Final renders look pixelated at 4K. Need uncompressed version.' },
  { id: 'tkt5', subject: 'NPS survey link not working', category: 'Bug', priority: 'low', status: 'closed', clientId: 'c5', client: 'Halo Collective', createdAt: '2026-04-25', description: 'NPS email link 404d. Resent manually.' },
];

export const MOCK_CALL_PREPS = [
  { id: 'cp1', client: 'Stratum Labs', clientId: 'c1', date: '2026-06-05', time: '10:00', type: 'Check-in', status: 'upcoming', agenda: 'Q2 campaign review, logo suite feedback, June retainer scope', checklist: [{ item: 'Review latest logo feedback', done: true }, { item: 'Prepare revised timeline', done: true }, { item: 'Confirm June scope', done: false }, { item: 'Discuss Q3 strategy', done: false }] },
  { id: 'cp2', client: 'Volta Interactive', clientId: 'c2', date: '2026-06-03', time: '14:00', type: 'Kickoff', status: 'upcoming', agenda: 'Campaign creative brief walkthrough, asset schedule, delivery milestones', checklist: [{ item: 'Finalize creative brief', done: true }, { item: 'Share asset schedule', done: false }, { item: 'Confirm approval workflow', done: false }] },
  { id: 'cp3', client: 'Orbis Consulting', clientId: 'c4', date: '2026-05-22', time: '11:00', type: 'Proposal', status: 'completed', agenda: 'Investor deck proposal review and sign-off', checklist: [{ item: 'Send proposal PDF', done: true }, { item: 'Walk through pricing', done: true }, { item: 'Collect signed SOW', done: true }] },
  { id: 'cp4', client: 'Solara Health', clientId: 'c8', date: '2026-06-10', time: '15:30', type: 'Discovery', status: 'upcoming', agenda: 'Website redesign discovery — user research review, CMS requirements', checklist: [{ item: 'Review user research report', done: false }, { item: 'Confirm CMS preference', done: false }, { item: 'Align on launch date', done: false }] },
];

export const MOCK_SERVICES = [
  { id: 'svc1', name: 'Brand Identity', category: 'Branding', description: 'Full brand identity: logo, palette, typography, guidelines PDF', basePrice: 8500, unit: 'project', status: 'active' },
  { id: 'svc2', name: 'Campaign Production', category: 'Paid Ads', description: 'Multi-channel campaign assets: social, display, video', basePrice: 6000, unit: 'project', status: 'active' },
  { id: 'svc3', name: 'Website Design', category: 'Web Design', description: 'Full UX/UI design in Figma, responsive, dev-ready', basePrice: 12000, unit: 'project', status: 'active' },
  { id: 'svc4', name: 'Content Strategy', category: 'Content', description: 'Content audit, editorial calendar, tone of voice guide', basePrice: 3500, unit: 'project', status: 'active' },
  { id: 'svc5', name: 'Motion System', category: 'Video', description: 'Brand motion kit: intros, outros, social templates in AE', basePrice: 9500, unit: 'project', status: 'active' },
  { id: 'svc6', name: 'Creative Retainer', category: 'Strategy', description: 'Monthly creative support: design, copy, strategy', basePrice: 5500, unit: 'month', status: 'active' },
];

export const MOCK_PROPOSALS = [
  { id: 'prop1', title: 'Brand Identity Proposal — Vantage Digital', clientId: 'c4', client: 'Vantage Digital', status: 'sent', createdAt: '2026-05-20', total: 34000, sections: [{ title: 'Introduction', content: 'We propose a comprehensive brand identity refresh...' }, { title: 'Scope of Work', content: 'Phase 1: Discovery & Strategy (2 weeks)\nPhase 2: Creative Development (4 weeks)\nPhase 3: Delivery & Handoff (1 week)' }, { title: 'Investment', content: 'Total investment: $34,000 + applicable taxes.' }] },
  { id: 'prop2', title: 'Website Redesign — Cascade Ventures', clientId: 'c7', client: 'Cascade Ventures', status: 'draft', createdAt: '2026-05-28', total: 15500, sections: [{ title: 'Introduction', content: 'Following our discovery call, we are excited to present...' }, { title: 'Scope', content: 'UX audit, wireframes, full design system, Webflow build.' }] },
  { id: 'prop3', title: 'Q3 Campaign — Solara Health', clientId: 'c8', client: 'Solara Health', status: 'signed', createdAt: '2026-04-15', total: 52000, sections: [{ title: 'Introduction', content: 'Confirmed engagement for Q3 2026 campaign.' }, { title: 'Deliverables', content: 'Hero video, social pack (60 assets), email sequence, landing page.' }] },
];

export const MOCK_KNOWLEDGE_ARTICLES = [
  { id: 'ka1', title: 'Client Onboarding Checklist', category: 'Process', tags: ['onboarding', 'clients', 'workflow'], content: 'Step-by-step guide for onboarding new clients: contract signing, portal setup, kickoff call template...', author: 'US', updatedAt: '2026-05-20' },
  { id: 'ka2', title: 'Brand Asset Delivery Standards', category: 'Process', tags: ['delivery', 'files', 'brand'], content: 'Required file formats, naming conventions, folder structure for all brand deliverables...', author: 'JR', updatedAt: '2026-05-15' },
  { id: 'ka3', title: 'Retainer Scope Management', category: 'Client', tags: ['retainer', 'scope', 'billing'], content: 'How to handle out-of-scope requests on retainer accounts: communication template, billing adjustments...', author: 'US', updatedAt: '2026-05-10' },
  { id: 'ka4', title: 'Video Export Specifications', category: 'Technical', tags: ['video', 'export', 'technical'], content: 'Codec, resolution, and bitrate specs for all social platforms: Instagram Reels, LinkedIn, YouTube...', author: 'ML', updatedAt: '2026-05-05' },
  { id: 'ka5', title: 'Invoice & Tax Process (QC)', category: 'Finance', tags: ['invoice', 'tax', 'TPS', 'TVQ'], content: 'Quebec tax calculation guide: TPS 5%, TVQ 9.975%. When to charge, how to file...', author: 'US', updatedAt: '2026-04-30' },
];

export const MOCK_NPS_RESPONSES = [
  { id: 'nps1', clientId: 'c1', client: 'Stratum Labs', score: 10, comment: 'Exceptional quality and communication. Best creative partner we have had.', respondedAt: '2026-05-15', category: 'Promoter' },
  { id: 'nps2', clientId: 'c2', client: 'Volta Interactive', score: 9, comment: 'Very satisfied. The campaign assets exceeded our expectations.', respondedAt: '2026-05-18', category: 'Promoter' },
  { id: 'nps3', clientId: 'c8', client: 'Solara Health', score: 7, comment: 'Good work overall. Timeline was tight on the discovery phase.', respondedAt: '2026-05-20', category: 'Passive' },
  { id: 'nps4', clientId: 'c3', client: 'Pollen Studio', score: 10, comment: 'The motion system is exactly what we needed. Highly recommend.', respondedAt: '2026-05-22', category: 'Promoter' },
  { id: 'nps5', clientId: 'c4', client: 'Orbis Consulting', score: 8, comment: 'Solid delivery. Would like faster turnaround on revisions.', respondedAt: '2026-04-28', category: 'Passive' },
  { id: 'nps6', clientId: 'c5', client: 'Halo Collective', score: 6, comment: 'Report was good but communication could be more proactive.', respondedAt: '2026-04-10', category: 'Detractor' },
  { id: 'nps7', clientId: 'c6', client: 'Apex Creative Co.', score: 9, comment: 'Love working with the team. Very creative and responsive.', respondedAt: '2026-05-25', category: 'Promoter' },
  { id: 'nps8', clientId: 'c1', client: 'Stratum Labs', score: 10, comment: 'Brand identity refresh was transformative for our business.', respondedAt: '2026-03-15', category: 'Promoter' },
];

export const MOCK_FINANCES = [
  { id: 'fin1', type: 'income', category: 'Retainer', description: 'Stratum Labs — June retainer', amount: 8000, tps: 400, tvq: 797.60, date: '2026-06-01', status: 'received' },
  { id: 'fin2', type: 'income', category: 'Retainer', description: 'Volta Interactive — June retainer', amount: 6000, tps: 300, tvq: 598.50, date: '2026-06-01', status: 'received' },
  { id: 'fin3', type: 'income', category: 'Invoice', description: 'INV-2026-045 — Motion System', amount: 9500, tps: 475, tvq: 948.63, date: '2026-05-22', status: 'received' },
  { id: 'fin4', type: 'income', category: 'Invoice', description: 'INV-2026-041 — Brand Identity', amount: 8000, tps: 400, tvq: 797.60, date: '2026-05-12', status: 'received' },
  { id: 'fin5', type: 'income', category: 'Retainer', description: 'Solara Health — Q2 retainer', amount: 26000, tps: 1300, tvq: 2593.50, date: '2026-04-01', status: 'received' },
  { id: 'fin6', type: 'expense', category: 'Software', description: 'Adobe CC team license', amount: 599, tps: 29.95, tvq: 59.77, date: '2026-06-01', status: 'paid' },
  { id: 'fin7', type: 'expense', category: 'Payroll', description: 'Freelance designer — JR (May)', amount: 4200, tps: 0, tvq: 0, date: '2026-05-31', status: 'paid' },
  { id: 'fin8', type: 'expense', category: 'Payroll', description: 'Freelance motion — ML (May)', amount: 3800, tps: 0, tvq: 0, date: '2026-05-31', status: 'paid' },
  { id: 'fin9', type: 'expense', category: 'Marketing', description: 'Dribbble Pro + Behance', amount: 35, tps: 1.75, tvq: 3.49, date: '2026-05-15', status: 'paid' },
  { id: 'fin10', type: 'income', category: 'Invoice', description: 'INV-2026-046 — Annual Report', amount: 12000, tps: 600, tvq: 1197, date: '2026-04-29', status: 'received' },
];

export const MOCK_ACTIVITY = [
  { id: 'act1', user: 'JR', action: 'submitted', targetName: 'Logo Suite v3', entityType: 'approval', timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
  { id: 'act2', user: 'US', action: 'marked paid', targetName: 'INV-2026-045', entityType: 'invoice', timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
  { id: 'act3', user: 'PK', action: 'completed task', targetName: 'Social asset templates', entityType: 'task', timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString() },
  { id: 'act4', user: 'ML', action: 'uploaded', targetName: 'motion-kit-looping.zip', entityType: 'file', timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
  { id: 'act5', user: 'AK', action: 'started task', targetName: 'Figma component library', entityType: 'task', timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString() },
  { id: 'act6', user: 'US', action: 'created project', targetName: 'Website Redesign', entityType: 'project', timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
];

export const MOCK_FULFILLMENT_ITEMS = [
  { id: 'ful1', name: 'Brand Identity Package', projectId: 'p1', project: 'Brand Identity Refresh', clientId: 'c1', client: 'Stratum Labs', dueDate: '2026-07-01', progress: 72, status: 'in_progress', checklist: [{ item: 'Logo suite (5 variants)', done: true }, { item: 'Colour palette tokens', done: true }, { item: 'Typography system', done: true }, { item: 'Icon set (24 icons)', done: false }, { item: 'Brand guidelines PDF', done: false }, { item: 'Social kit (10 templates)', done: false }] },
  { id: 'ful2', name: 'Q3 Campaign Package', projectId: 'p2', project: 'Campaign: Q3 Launch', clientId: 'c2', client: 'Volta Interactive', dueDate: '2026-06-30', progress: 35, status: 'in_progress', checklist: [{ item: 'Hero video (30s + 15s)', done: true }, { item: 'Social templates (30 units)', done: false }, { item: 'Email sequence (5 parts)', done: false }, { item: 'Landing page design', done: false }] },
  { id: 'ful3', name: 'Motion System V2', projectId: 'p4', project: 'Motion System V2', clientId: 'c3', client: 'Pollen Studio', dueDate: '2026-06-20', progress: 90, status: 'review', checklist: [{ item: 'Intro animation', done: true }, { item: 'Lower thirds pack', done: true }, { item: 'Looping backgrounds (8)', done: true }, { item: 'AE template package', done: true }, { item: 'Export + QA', done: false }] },
  { id: 'ful4', name: 'Annual Report 2025', projectId: 'p6', project: 'Annual Report 2025', clientId: 'c5', client: 'Halo Collective', dueDate: '2026-04-30', progress: 100, status: 'delivered', checklist: [{ item: 'Layout design (48 pages)', done: true }, { item: 'Charts & infographics', done: true }, { item: 'Print-ready PDF', done: true }, { item: 'Digital version (interactive)', done: true }] },
];

export const MOCK_RESOURCE_ENTRIES = [
  { id: 'res1', name: 'Alex Martin (US)', role: 'Creative Director', weeklyCapacity: 40, weeklyBooked: 28, projects: [{ projectId: 'p1', hours: 10 }, { projectId: 'p2', hours: 8 }, { projectId: 'p5', hours: 6 }, { projectId: 'p4', hours: 4 }] },
  { id: 'res2', name: 'Julia R. (JR)', role: 'Senior Designer', weeklyCapacity: 35, weeklyBooked: 35, projects: [{ projectId: 'p1', hours: 20 }, { projectId: 'p3', hours: 10 }, { projectId: 'p6', hours: 5 }] },
  { id: 'res3', name: 'Marc L. (ML)', role: 'Motion Designer', weeklyCapacity: 32, weeklyBooked: 30, projects: [{ projectId: 'p4', hours: 20 }, { projectId: 'p2', hours: 10 }] },
  { id: 'res4', name: 'Priya K. (PK)', role: 'Copywriter', weeklyCapacity: 30, weeklyBooked: 18, projects: [{ projectId: 'p2', hours: 14 }, { projectId: 'p3', hours: 4 }] },
];

export const MOCK_AGENT_CONFIGS = [
  { id: 'ag1', name: 'Risk Analyst', template: 'Risk Analysis', description: 'Scans projects and pipeline for over-budget, overdue, and low-health signals. Generates weekly risk digest.', instructions: 'Analyse all active projects. Flag any project with health < 70 or spend > 85% of budget. List top 3 risks with recommended actions.', status: 'active', lastRun: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), runs: 12 },
  { id: 'ag2', name: 'Strategic Writer', template: 'Strategic Writer', description: 'Drafts strategic content: executive summaries, proposal introductions, client briefings.', instructions: 'You are a strategic advisor. Write in a confident, editorial tone. No jargon. Max 3 paragraphs per section.', status: 'active', lastRun: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), runs: 7 },
  { id: 'ag3', name: 'Finance Auditor', template: 'Financial Auditor', description: 'Reconciles invoices vs. retainer hours, flags discrepancies, prepares monthly finance summary.', instructions: 'Cross-reference invoices against retainer hour logs. Flag any gaps > 10%. Prepare a 1-page summary.', status: 'paused', lastRun: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), runs: 3 },
];

export const MOCK_NOTIFICATIONS = [
  { id: 'notif1', title: 'Approval submitted', message: 'JR submitted "Logo Suite v3" for review on Brand Identity Refresh.', read: false, timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
  { id: 'notif2', title: 'Invoice overdue', message: 'INV-2026-043 for Solara Health is 17 days overdue.', read: false, timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString() },
  { id: 'notif3', title: 'Project at risk', message: 'Motion System V2 is at 93% budget utilisation with tasks remaining.', read: true, timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
];

export const MOCK_COMMENTS = [
  { id: 'cmt1', userId: 'JR', userName: 'Julia R.', content: 'Updated the logo suite with client feedback from last call. Main changes: simplified icon, adjusted weight on wordmark.', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: 'cmt2', userId: 'US', userName: 'Alex Martin', content: 'Looks great. Can we try a version with slightly more spacing on the icon?', timestamp: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString() },
  { id: 'cmt3', userId: 'ML', userName: 'Marc L.', content: 'Motion version ready for QA — looping set exported at 4K ProRes.', timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
  { id: 'cmt4', userId: 'PK', userName: 'Priya K.', content: 'Email sequence v2 attached. Incorporated tone adjustments from brief.', timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
];

