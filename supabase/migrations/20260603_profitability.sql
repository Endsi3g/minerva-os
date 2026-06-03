-- ============================================================
-- Phase 2.6 — Finance & Profitability
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Extend existing tables
-- ──────────────────────────────────────────────────────────────

-- services: add cost/sell rates + margin target
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS cost_rate     NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sell_rate     NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_margin NUMERIC(5,2)  DEFAULT 40;

-- milestones: revenue recognition
ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS revenue_pct   NUMERIC(5,2)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recognized_at TIMESTAMPTZ;

-- projects: scope tracking + estimated hours
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS estimated_hours  NUMERIC(8,2)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scope_flagged    BOOLEAN       DEFAULT false,
  ADD COLUMN IF NOT EXISTS scope_flagged_at TIMESTAMPTZ;

-- ──────────────────────────────────────────────────────────────
-- 2. New tables
-- ──────────────────────────────────────────────────────────────

-- Per-phase budget allocation for projects
CREATE TABLE IF NOT EXISTS public.project_phase_budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id)  ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES public.projects(id)    ON DELETE CASCADE,
  stage        TEXT NOT NULL CHECK (stage IN ('sales','pm','production','finance')),
  budget_hours  NUMERIC(8,2) NOT NULL DEFAULT 0,
  budget_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, stage)
);
CREATE INDEX idx_phase_budgets_project   ON public.project_phase_budgets(project_id);
CREATE INDEX idx_phase_budgets_workspace ON public.project_phase_budgets(workspace_id);

-- Billing disputes
CREATE TABLE IF NOT EXISTS public.billing_disputes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_id       UUID REFERENCES public.invoices(id)  ON DELETE SET NULL,
  project_id       UUID REFERENCES public.projects(id)  ON DELETE SET NULL,
  client_id        UUID REFERENCES public.clients(id)   ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  amount_disputed  NUMERIC(14,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','under_review','resolved','dismissed')),
  resolution       TEXT,
  resolved_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_disputes_workspace ON public.billing_disputes(workspace_id);
CREATE INDEX idx_disputes_project   ON public.billing_disputes(project_id);
CREATE INDEX idx_disputes_invoice   ON public.billing_disputes(invoice_id);

-- Estimation templates
CREATE TABLE IF NOT EXISTS public.estimation_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  service_type TEXT NOT NULL,
  estimated_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  sell_rate    NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_rate    NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_items   JSONB NOT NULL DEFAULT '[]',
  is_builtin   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_estimation_templates_workspace ON public.estimation_templates(workspace_id);

-- ──────────────────────────────────────────────────────────────
-- 3. Row-level security
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.project_phase_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.project_phase_budgets
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()
  ));

ALTER TABLE public.billing_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.billing_disputes
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()
  ));

ALTER TABLE public.estimation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.estimation_templates
  USING (workspace_id IS NULL OR workspace_id IN (
    SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()
  ));

-- ──────────────────────────────────────────────────────────────
-- 4. Seeds
-- ──────────────────────────────────────────────────────────────

-- Built-in estimation templates (workspace_id IS NULL = global)
INSERT INTO public.estimation_templates
  (name, service_type, estimated_hours, sell_rate, cost_rate, line_items, is_builtin)
VALUES
  (
    'Brand Identity — Standard',
    'branding',
    80,
    120,
    60,
    '[
      {"label":"Discovery & strategy","hours":10,"sell_rate":120,"cost_rate":60},
      {"label":"Moodboard & concepts","hours":20,"sell_rate":120,"cost_rate":60},
      {"label":"Visual identity design","hours":30,"sell_rate":120,"cost_rate":60},
      {"label":"Brand guidelines","hours":15,"sell_rate":120,"cost_rate":60},
      {"label":"Delivery & revisions","hours":5,"sell_rate":120,"cost_rate":60}
    ]'::jsonb,
    true
  ),
  (
    'Landing Page — Marketing',
    'web_design',
    60,
    130,
    65,
    '[
      {"label":"UX brief & wireframes","hours":10,"sell_rate":130,"cost_rate":65},
      {"label":"UI design (desktop + mobile)","hours":20,"sell_rate":130,"cost_rate":65},
      {"label":"Development","hours":20,"sell_rate":130,"cost_rate":65},
      {"label":"QA & integration","hours":6,"sell_rate":130,"cost_rate":65},
      {"label":"Launch & handoff","hours":4,"sell_rate":130,"cost_rate":65}
    ]'::jsonb,
    true
  ),
  (
    'Strategic Workshop — Half Day',
    'strategy',
    16,
    150,
    75,
    '[
      {"label":"Pre-workshop audit","hours":4,"sell_rate":150,"cost_rate":75},
      {"label":"Workshop facilitation","hours":4,"sell_rate":150,"cost_rate":75},
      {"label":"Synthesis & report","hours":6,"sell_rate":150,"cost_rate":75},
      {"label":"Presentation","hours":2,"sell_rate":150,"cost_rate":75}
    ]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;
