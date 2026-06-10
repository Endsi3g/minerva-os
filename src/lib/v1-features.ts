// Progressive feature unlocking — V1 core vs. advanced capabilities.
// Core features are always available. Advanced features start locked and
// can be unlocked by the user (stored in localStorage, scoped per workspace).

export const V1_CORE_FEATURES = new Set([
  'dashboard',
  'clients',
  'pipeline',
  'projects',
  'tasks',
  'approvals',
  'files',
  'client_portal',
  'billing_basic',
  'team',
]);

export interface FeatureMeta {
  title: string;
  description: string;
}

export const UNLOCKABLE_FEATURES: Record<string, FeatureMeta> = {
  workflows:    { title: 'Workflows',        description: 'Automate repetitive processes with custom trigger-action flows.' },
  resources:    { title: 'Resource Planning', description: 'Track team capacity and allocate work across projects.' },
  time_tracking:{ title: 'Time Tracking',    description: 'Log billable hours and export timesheets.' },
  knowledge:    { title: 'Knowledge Base',   description: 'Centralise SOPs, templates, and internal documentation.' },
  nps:          { title: 'NPS Surveys',      description: 'Measure client satisfaction with automated surveys.' },
  expenses:     { title: 'Expenses',         description: 'Track project costs and reconcile against budgets.' },
  profitability:{ title: 'Profitability',    description: 'Monitor margins and revenue per client or project.' },
  reports:      { title: 'Advanced Reports', description: 'Deep analytics and shareable client-facing reports.' },
  scorecards:   { title: 'Scorecards',       description: 'Track delivery and performance KPIs across your agency.' },
  agent_ops:    { title: 'Agent Ops',        description: 'AI agents that monitor, summarise, and act on your behalf.' },
  intelligence: { title: 'Intelligence Hub', description: 'AI-powered insights, risk flags, and performance analysis.' },
  support_hub:  { title: 'Support Hub',      description: 'Manage client tickets and internal support requests.' },
  marketplace:  { title: 'Marketplace',      description: 'Browse and install community-built workflow templates.' },
};

const LS_KEY = 'minerva_unlocked_features';

export function getUnlockedFeatures(): Set<string> {
  if (typeof window === 'undefined') return new Set(V1_CORE_FEATURES);
  try {
    const stored = localStorage.getItem(LS_KEY);
    const arr: string[] = stored ? JSON.parse(stored) : [];
    return new Set([...V1_CORE_FEATURES, ...arr]);
  } catch {
    return new Set(V1_CORE_FEATURES);
  }
}

export function unlockFeature(featureId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(LS_KEY);
    const arr: string[] = stored ? JSON.parse(stored) : [];
    if (!arr.includes(featureId)) {
      arr.push(featureId);
      localStorage.setItem(LS_KEY, JSON.stringify(arr));
    }
  } catch {
    // ignore storage errors
  }
}

export function isFeatureUnlocked(featureId: string): boolean {
  return getUnlockedFeatures().has(featureId);
}
