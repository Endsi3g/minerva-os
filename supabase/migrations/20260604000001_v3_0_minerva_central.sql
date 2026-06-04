-- V3.0 — Minerva OS: Central System Tables

-- Health score cache (computed values, refreshed periodically)
CREATE TABLE IF NOT EXISTS health_score_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('client', 'project', 'portfolio')),
  entity_id text NOT NULL,
  overall_score integer NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  dimensions jsonb DEFAULT '{}',
  trend text DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  alerts jsonb DEFAULT '[]',
  computed_at timestamptz DEFAULT now(),
  UNIQUE (workspace_id, entity_type, entity_id)
);

ALTER TABLE health_score_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON health_score_cache
  USING (workspace_id = my_workspace_id());

-- Workflow analytics daily aggregates
CREATE TABLE IF NOT EXISTS workflow_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  workflow_id uuid,
  workflow_name text,
  date date NOT NULL,
  executions integer DEFAULT 0,
  successes integer DEFAULT 0,
  failures integer DEFAULT 0,
  avg_duration_ms integer DEFAULT 0,
  time_saved_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (workspace_id, workflow_id, date)
);

ALTER TABLE workflow_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON workflow_analytics
  USING (workspace_id = my_workspace_id());

-- Marketplace items (builtin + workspace-custom)
CREATE TABLE IF NOT EXISTS marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('template', 'automation', 'view', 'playbook')),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  usage_count integer DEFAULT 0,
  is_builtin boolean DEFAULT false,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON marketplace_items
  USING (workspace_id = my_workspace_id() OR is_builtin = true);

-- Team scorecard snapshots
CREATE TABLE IF NOT EXISTS team_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  period text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  team_delivery_score integer DEFAULT 0,
  avg_capacity_pct integer DEFAULT 0,
  members_data jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON team_scorecards
  USING (workspace_id = my_workspace_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_score_cache_workspace ON health_score_cache (workspace_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_workspace_date ON workflow_analytics (workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_type ON marketplace_items (type, is_builtin);
