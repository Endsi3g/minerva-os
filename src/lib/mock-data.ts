import type { Lead, Client, Project, Task, Approval, FileAsset, Invoice, Retainer, Milestone, ClientPortalToken, DecisionEntry, PortalNotification, PortalMessage, DocumentFolder, MarketplaceItem } from './types';


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
  { id: 'c1', company: 'Stratum Labs', industry: 'Technology', contact: 'Felix Braun', email: 'felix@stratumlabs.de', monthlyValue: 8000, activeProjects: 3, status: 'active', phone: '+49 30 1234567', description: 'Stratum Labs is a leading deep-tech research company building scalable AI models and risk infrastructures.', notes: 'Retainer renewed for Q3. Key focus is scaling their production model API.' },
  { id: 'c2', company: 'Volta Interactive', industry: 'Entertainment', contact: 'Camille Laurent', email: 'camille@voltainteractive.fr', monthlyValue: 6000, activeProjects: 2, status: 'active', phone: '+33 1 45678910', description: 'Volta Interactive builds immersive virtual entertainment platforms and game ecosystems.', notes: 'Needs Q3 video asset schedule finalized by mid-June.' },
  { id: 'c3', company: 'Pollen Studio', industry: 'Design', contact: 'Asha Kapoor', email: 'asha@pollenstudio.in', monthlyValue: 3750, activeProjects: 1, status: 'active', phone: '+91 22 9876543', description: 'Pollen Studio is a boutique design agency specializing in fluid motion systems and interactive brand experiences.', notes: 'Highly creative team, but occasionally slips deadlines. Monitor AE deliverables closely.' },
  { id: 'c4', company: 'Orbis Consulting', industry: 'Finance', contact: 'Marco Russo', email: 'marco@orbisconsulting.eu', monthlyValue: 11200, activeProjects: 4, status: 'onboarding', phone: '+39 02 8765432', description: 'Orbis Consulting provides high-level financial risk modeling, capital consulting and compliance reviews.', notes: 'Onboarding phase. Setting up project boards and invoice syncs.' },
  { id: 'c5', company: 'Halo Collective', industry: 'Media', contact: 'Emma Walsh', email: 'emma@halocollective.co', monthlyValue: 5250, activeProjects: 2, status: 'onboarding', phone: '+44 20 7946 0958', description: 'Halo Collective is a contemporary digital publishing and media distribution agency.', notes: 'Looking to migrate all email campaigns to Minerva workflows.' },
  { id: 'c6', company: 'Apex Creative Co.', industry: 'Advertising', contact: 'Isabelle Fontaine', email: 'isabelle@apexcreative.fr', monthlyValue: 4100, activeProjects: 1, status: 'active', phone: '+33 1 98765432', description: 'Apex Creative Co. is a full-service creative agency specializing in paid social campaigns.', notes: 'Stripe autopay is set up. Workflows are active.' },
  { id: 'c7', company: 'Cascade Ventures', industry: 'Venture Capital', contact: 'Nora Holt', email: 'nora@cascadeventures.io', monthlyValue: 0, activeProjects: 0, status: 'inactive', phone: '+1 415 555 2671', description: 'Cascade Ventures is a seed-stage venture fund investing in enterprise SaaS startups.', notes: 'Currently inactive. Re-engagement scheduled for Q4.' },
  { id: 'c8', company: 'Solara Health', industry: 'Healthcare', contact: 'Priya Nair', email: 'priya@solarahealth.com', monthlyValue: 8667, activeProjects: 2, status: 'active', phone: '+1 650 555 0192', description: 'Solara Health is a telehealth operator connecting patients with primary care physicians.', notes: 'Average SLA response is very good. Main stakeholder is very happy with the portal.' },
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

export const MOCK_FILES: (FileAsset & { folder: DocumentFolder })[] = [
  { id: 'f1',  name: 'logo-suite-v3.zip',            type: 'archive',  size: '14.2 MB', project: 'Brand Identity Refresh', uploadedBy: 'JR', uploadedDate: '2026-06-09', folder: 'deliverables_assets' },
  { id: 'f2',  name: 'brand-guidelines.pdf',          type: 'document', size: '4.8 MB',  project: 'Brand Identity Refresh', uploadedBy: 'US', uploadedDate: '2026-06-05', folder: 'references_briefs' },
  { id: 'f3',  name: 'hero-video-30s.mp4',            type: 'video',    size: '182 MB',  project: 'Campaign: Q3 Launch',    uploadedBy: 'US', uploadedDate: '2026-06-08', folder: 'deliverables_assets' },
  { id: 'f4',  name: 'social-templates.figma',        type: 'document', size: '6.1 MB',  project: 'Campaign: Q3 Launch',    uploadedBy: 'PK', uploadedDate: '2026-06-04', folder: 'deliverables_assets' },
  { id: 'f5',  name: 'homepage-mockup.png',           type: 'image',    size: '3.4 MB',  project: 'Website Redesign',       uploadedBy: 'JR', uploadedDate: '2026-06-03', folder: 'deliverables_assets' },
  { id: 'f6',  name: 'component-library.figma',       type: 'document', size: '9.7 MB',  project: 'Website Redesign',       uploadedBy: 'AK', uploadedDate: '2026-06-01', folder: 'references_briefs' },
  { id: 'f7',  name: 'motion-kit-looping.zip',        type: 'archive',  size: '224 MB',  project: 'Motion System V2',       uploadedBy: 'ML', uploadedDate: '2026-06-10', folder: 'deliverables_assets' },
  { id: 'f8',  name: 'motion-preview.mp4',            type: 'video',    size: '48 MB',   project: 'Motion System V2',       uploadedBy: 'ML', uploadedDate: '2026-06-09', folder: 'deliverables_assets' },
  { id: 'f9',  name: 'annual-report-2025.pdf',        type: 'document', size: '11.2 MB', project: 'Annual Report 2025',     uploadedBy: 'JR', uploadedDate: '2026-04-28', folder: 'invoices_finance' },
  { id: 'f10', name: 'ia-sitemap.pdf',                type: 'document', size: '1.8 MB',  project: 'Website Redesign',       uploadedBy: 'TL', uploadedDate: '2026-06-06', folder: 'references_briefs' },
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
  // Universal demo token — full access, all scopes
  { token: 'demo-client',  clientId: 'c1', clientName: 'Stratum Labs',     expiresAt: '2027-12-31T23:59:59Z', scopes: ['approvals', 'files', 'invoices', 'proposals', 'reports', 'tickets', 'nps'] },
];

// ── V2.7 — Decision Journal ───────────────────────────────────────────────────

export const MOCK_DECISIONS: DecisionEntry[] = [
  { id: 'dec1', workspaceId: 'mock-workspace-123', clientId: 'c1', objectType: 'approval', objectId: 'a5', objectName: 'Annual Report layout', decision: 'approved', decidedBy: 'Stratum Labs', timestamp: '2026-06-10T14:30:00Z' },
  { id: 'dec2', workspaceId: 'mock-workspace-123', clientId: 'c1', objectType: 'approval', objectId: 'a1', objectName: 'Logo Suite v3', decision: 'revision', note: 'Please refine the wordmark weight.', decidedBy: 'Stratum Labs', timestamp: '2026-06-08T09:15:00Z' },
  { id: 'dec3', workspaceId: 'mock-workspace-123', clientId: 'c1', objectType: 'invoice', objectId: 'inv1', objectName: 'INV-2026-041', decision: 'paid', decidedBy: 'system', timestamp: '2026-05-12T11:00:00Z' },
  { id: 'dec4', workspaceId: 'mock-workspace-123', clientId: 'c2', objectType: 'proposal', objectId: 'prop-demo-volta', objectName: 'Q4 Campaign Production & Ads', decision: 'signed', decidedBy: 'Camille Laurent', timestamp: '2026-05-15T10:00:00Z' },
  { id: 'dec5', workspaceId: 'mock-workspace-123', clientId: 'c2', objectType: 'approval', objectId: 'a2', objectName: 'Hero Video 30s cut', decision: 'approved', decidedBy: 'Volta Interactive', timestamp: '2026-05-20T16:00:00Z' },
];

// ── V2.7 — Portal Notifications ───────────────────────────────────────────────

export const MOCK_PORTAL_NOTIFICATIONS: PortalNotification[] = [
  { id: 'pn1', clientId: 'c1', workspaceId: 'mock-workspace-123', type: 'approval_action', title: 'New deliverable ready', message: 'Logo Suite v3 is ready for your review.', read: false, targetPath: 'deliverables', createdAt: '2026-06-11T08:00:00Z' },
  { id: 'pn2', clientId: 'c1', workspaceId: 'mock-workspace-123', type: 'file_upload', title: 'New file uploaded', message: 'Brand guidelines PDF has been added to your document centre.', read: false, targetPath: 'files', createdAt: '2026-06-05T16:00:00Z' },
  { id: 'pn3', clientId: 'c1', workspaceId: 'mock-workspace-123', type: 'invoice_update', title: 'Invoice issued', message: 'INV-2026-041 has been issued and is due on May 15.', read: true, targetPath: 'invoices', createdAt: '2026-05-01T09:00:00Z' },
  { id: 'pn4', clientId: 'c2', workspaceId: 'mock-workspace-123', type: 'comment', title: 'New comment', message: 'Uprising Studio commented on Hero Video 30s cut.', read: false, targetPath: 'deliverables', createdAt: '2026-06-10T12:00:00Z' },
];

export const MOCK_PROPOSALS = [
  {
    id: 'prop-demo-stratum',
    title: 'Brand Identity Design Package',
    client_id: 'c1',
    workspace_id: 'mock-workspace-123',
    total_amount: 15000,
    status: 'sent',
    token: 'demo-proposal-stratum',
    valid_until: '2026-12-31T23:59:59Z',
    sections: [
      { type: 'intro', content: 'We are excited to propose a brand identity refresh for Stratum Labs. Our goal is to craft a premium, cohesive editorial noir identity.' },
      { type: 'scope', content: '- Logo design, guidelines, typography selection, assets export, and stationary kits.' },
      { type: 'timeline', content: '4 weeks from kickoff to delivery.' },
      { type: 'pricing', content: '$15,000 flat rate paid 50% upfront, 50% upon delivery.' },
      { type: 'terms', content: 'All files provided upon full payment. 30 days support included.' }
    ]
  },
  {
    id: 'prop-demo-volta',
    title: 'Q4 Campaign Production & Ads',
    client_id: 'c2',
    workspace_id: 'mock-workspace-123',
    total_amount: 25000,
    status: 'signed',
    token: 'demo-proposal-volta',
    valid_until: '2026-12-31T23:59:59Z',
    signed_by: 'Camille Laurent',
    signed_at: '2026-05-15T10:00:00Z',
    sections: [
      { type: 'intro', content: "Campaign launch for Volta's upcoming interactive releases." },
      { type: 'scope', content: '- Video ads, banners, social assets, copy drafts.' },
      { type: 'timeline', content: 'Delivered by late June.' },
      { type: 'pricing', content: '$25,000 total investment.' },
      { type: 'terms', content: 'Payment Net 15.' }
    ]
  }
];



// V3.0 — Portal Messages
export const MOCK_MESSAGES: PortalMessage[] = [
  {
    id: 'msg1',
    clientId: 'c1',
    workspaceId: 'mock-workspace-123',
    fromWorkspace: true,
    authorName: 'Uprising Studio',
    body: 'Welcome to your Minerva client portal, Felix. This is your central hub to track all active projects, review deliverables, and stay aligned with our team. Feel free to reach out directly through this message thread.',
    sentAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    readAt: new Date(Date.now() - 13 * 86400000).toISOString(),
  },
  {
    id: 'msg2',
    clientId: 'c1',
    workspaceId: 'mock-workspace-123',
    fromWorkspace: true,
    authorName: 'Uprising Studio',
    body: 'The Logo Suite v3 is now ready for your review in the Deliverables tab. We have iterated on the wordmark weight and refined the colour palette as discussed in our last call. Please share your feedback by end of week.',
    sentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    readAt: null,
  },
  {
    id: 'msg3',
    clientId: 'c1',
    workspaceId: 'mock-workspace-123',
    fromWorkspace: true,
    authorName: 'Uprising Studio',
    body: 'Just a heads-up — the Brand Guidelines PDF is now available in the Files section. The document covers typography, colour tokens, spacing rules, and logo usage guidelines for all your internal teams.',
    sentAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    readAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'msg4',
    clientId: 'c1',
    workspaceId: 'mock-workspace-123',
    fromWorkspace: false,
    authorName: 'Felix Braun',
    body: 'Thank you for the update. We have reviewed the guidelines internally and overall they look great. We will send consolidated feedback on the logo suite by Thursday.',
    sentAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    readAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'msg5',
    clientId: 'c1',
    workspaceId: 'mock-workspace-123',
    fromWorkspace: true,
    authorName: 'Uprising Studio',
    body: 'Invoice INV-2026-041 is due on June 15. You can view and pay it directly in the Billing tab. If you have any questions about the line items, do not hesitate to reach out.',
    sentAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    readAt: null,
  },
];

// V3.0 — Marketplace
export const MOCK_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  { id: 'm1', type: 'template', name: 'Web Design Kickoff', description: 'Full project template with tasks, milestones, and approval flows for web design projects.', category: 'onboarding', tags: ['web', 'design'], usageCount: 142, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm2', type: 'template', name: 'Brand Identity Project', description: 'Logo, guidelines, and asset delivery template with client approval checkpoints.', category: 'delivery', tags: ['branding', 'design'], usageCount: 98, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm3', type: 'automation', name: 'Invoice Overdue Alert', description: 'Automatically notifies the finance team when an invoice becomes overdue by 3+ days.', category: 'finance', tags: ['invoice', 'alert'], usageCount: 217, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm4', type: 'automation', name: 'Proposal Signed Kickoff', description: 'When a proposal is signed, automatically creates a project and assigns the onboarding checklist.', category: 'onboarding', tags: ['proposal', 'project'], usageCount: 189, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm5', type: 'automation', name: 'Task Overdue Escalation', description: 'Escalates overdue tasks to the PM after 48h with no update.', category: 'delivery', tags: ['tasks', 'escalation'], usageCount: 156, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm6', type: 'view', name: 'Client Health Dashboard', description: 'Portfolio-wide view showing health scores, invoice status, and project progress per client.', category: 'reporting', tags: ['health', 'dashboard'], usageCount: 73, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm7', type: 'view', name: 'Weekly Delivery Standup', description: 'Filtered view of tasks due this week grouped by project and assignee.', category: 'delivery', tags: ['standup', 'tasks'], usageCount: 91, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm8', type: 'playbook', name: 'Client Onboarding', description: 'Step-by-step onboarding process: discovery call, brief intake, contract signature, project setup.', category: 'onboarding', tags: ['onboarding', 'checklist'], usageCount: 134, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm9', type: 'playbook', name: 'Scope Change Management', description: 'Protocol for handling scope creep: detection, impact assessment, client communication, approval.', category: 'delivery', tags: ['scope', 'change'], usageCount: 67, isBuiltIn: true, createdBy: 'Minerva' },
  { id: 'm10', type: 'playbook', name: 'Monthly Finance Review', description: 'Structured process for monthly P&L review, invoice reconciliation, and cash forecast update.', category: 'finance', tags: ['finance', 'review'], usageCount: 45, isBuiltIn: true, createdBy: 'Minerva' },
];
