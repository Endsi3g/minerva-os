import { supabase } from '@/lib/supabase';
import type { AgencyType, WorkspaceTier } from '@/lib/types';

interface KitData {
  projects: Array<{ name: string; status: string; dueDate: string; budget: number }>;
  services: Array<{ name: string; category: string; basePrice: number }>;
  workflowName: string;
  workflowTrigger: string;
}

const KITS: Record<AgencyType, KitData> = {
  branding: {
    projects: [
      { name: 'Brand Identity System', status: 'active', dueDate: '2026-09-01', budget: 12000 },
      { name: 'Visual Guidelines Deck', status: 'active', dueDate: '2026-08-15', budget: 4500 },
      { name: 'Social Media Templates', status: 'active', dueDate: '2026-07-30', budget: 3000 },
    ],
    services: [
      { name: 'Brand Strategy', category: 'strategy', basePrice: 5000 },
      { name: 'Logo Design', category: 'design', basePrice: 2500 },
      { name: 'Brand Guidelines', category: 'design', basePrice: 3500 },
      { name: 'Typography System', category: 'design', basePrice: 1800 },
    ],
    workflowName: 'Proposal signed → Brand Discovery task pack',
    workflowTrigger: 'proposal_signed',
  },
  paid_media: {
    projects: [
      { name: 'Q3 Paid Campaign', status: 'active', dueDate: '2026-09-30', budget: 25000 },
      { name: 'Ad Creative Library', status: 'active', dueDate: '2026-08-01', budget: 6000 },
      { name: 'Monthly Reporting', status: 'active', dueDate: '2026-07-31', budget: 2000 },
    ],
    services: [
      { name: 'Paid Search Management', category: 'media', basePrice: 3000 },
      { name: 'Display Advertising', category: 'media', basePrice: 2500 },
      { name: 'Campaign Analytics', category: 'reporting', basePrice: 1500 },
      { name: 'Ad Creative Production', category: 'design', basePrice: 4000 },
    ],
    workflowName: 'Project created → Campaign Brief task',
    workflowTrigger: 'project_created',
  },
  content: {
    projects: [
      { name: 'Editorial Calendar Q3', status: 'active', dueDate: '2026-09-30', budget: 8000 },
      { name: 'Blog Content Batch', status: 'active', dueDate: '2026-08-15', budget: 4500 },
      { name: 'Video Series Season 1', status: 'active', dueDate: '2026-10-01', budget: 15000 },
    ],
    services: [
      { name: 'Content Strategy', category: 'strategy', basePrice: 4000 },
      { name: 'Blog Writing', category: 'content', basePrice: 2000 },
      { name: 'Video Production', category: 'production', basePrice: 8000 },
      { name: 'SEO Copywriting', category: 'content', basePrice: 1800 },
    ],
    workflowName: 'Task overdue → escalate to PM',
    workflowTrigger: 'task_overdue',
  },
  dev_shop: {
    projects: [
      { name: 'Website Redesign', status: 'active', dueDate: '2026-09-15', budget: 18000 },
      { name: 'Web App MVP', status: 'active', dueDate: '2026-10-31', budget: 35000 },
      { name: 'Maintenance Retainer', status: 'active', dueDate: '2026-12-31', budget: 12000 },
    ],
    services: [
      { name: 'Web Development', category: 'development', basePrice: 10000 },
      { name: 'UI Design', category: 'design', basePrice: 5000 },
      { name: 'QA Testing', category: 'qa', basePrice: 3000 },
      { name: 'Technical Consulting', category: 'consulting', basePrice: 2500 },
    ],
    workflowName: 'Project status changed → notify client',
    workflowTrigger: 'project_status_changed',
  },
  full_service: {
    projects: [
      { name: 'Integrated Brand Launch', status: 'active', dueDate: '2026-10-01', budget: 45000 },
      { name: 'Q3 Campaign', status: 'active', dueDate: '2026-09-30', budget: 20000 },
      { name: 'Annual Report', status: 'active', dueDate: '2026-11-30', budget: 8000 },
    ],
    services: [
      { name: 'Brand Strategy', category: 'strategy', basePrice: 8000 },
      { name: 'Creative Direction', category: 'design', basePrice: 6000 },
      { name: 'Campaign Management', category: 'media', basePrice: 5000 },
      { name: 'Performance Reporting', category: 'reporting', basePrice: 2500 },
    ],
    workflowName: 'Proposal signed → full onboarding handoff',
    workflowTrigger: 'proposal_signed',
  },
  fractional_team: {
    projects: [
      { name: 'Fractional CMO - Acme Corp', status: 'active', dueDate: '2026-12-31', budget: 30000 },
      { name: 'Strategy Sprint - TechCo', status: 'active', dueDate: '2026-08-31', budget: 12000 },
      { name: 'Monthly Advisory', status: 'active', dueDate: '2026-12-31', budget: 6000 },
    ],
    services: [
      { name: 'Fractional CMO', category: 'advisory', basePrice: 5000 },
      { name: 'Strategic Advisory', category: 'advisory', basePrice: 3500 },
      { name: 'Monthly Retainer', category: 'retainer', basePrice: 4000 },
      { name: 'Workshop Facilitation', category: 'consulting', basePrice: 2800 },
    ],
    workflowName: 'Invoice overdue → send follow-up',
    workflowTrigger: 'invoice_overdue',
  },
};

export async function applySetupKit(
  workspaceId: string,
  agencyType: AgencyType,
  _tier: WorkspaceTier
): Promise<void> {
  // Check idempotency
  const { data: ws } = await supabase
    .from('workspaces')
    .select('setup_kit_applied')
    .eq('id', workspaceId)
    .maybeSingle();

  if (ws?.setup_kit_applied) return;

  const kit = KITS[agencyType];
  const now = new Date().toISOString();

  // Insert sample projects
  const projectRows = kit.projects.map((p, i) => ({
    id: `kit-project-${agencyType}-${i}`,
    workspace_id: workspaceId,
    name: p.name,
    status: p.status,
    due_date: p.dueDate,
    budget: p.budget,
    spent: 0,
    created_at: now,
  }));

  await supabase.from('projects').insert(projectRows);

  // Insert sample services
  const serviceRows = kit.services.map((s, i) => ({
    id: `kit-service-${agencyType}-${i}`,
    workspace_id: workspaceId,
    name: s.name,
    category: s.category,
    base_price: s.basePrice,
    cost_rate: s.basePrice * 0.6,
    sell_rate: s.basePrice,
    target_margin: 40,
    created_at: now,
  }));

  await supabase.from('services').insert(serviceRows);

  // Mark kit as applied
  await supabase
    .from('workspaces')
    .update({ setup_kit_applied: true })
    .eq('id', workspaceId);
}
