-- ============================================================
-- Minerva OS — Complete PostgreSQL Schema
-- Migration: 001_schema.sql
-- Supabase project: kcwdmufkyjsitsuxmqld
--
-- This is the canonical schema migrated from convex/schema.ts.
-- NOTE: If the earlier migration (20260528000000_schema.sql)
-- was already applied, drop it first or run this on a fresh DB.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- 1. organizations
CREATE TABLE public.organizations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  logo_url     TEXT,
  billing_email TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. workspaces
CREATE TABLE public.workspaces (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  branding       JSONB NOT NULL DEFAULT '{"logo": null, "primaryColor": "#7FA38A", "theme": "dark"}',
  settings       JSONB NOT NULL DEFAULT '{"currency": "CAD", "language": "en", "timezone": "America/Toronto", "taxRules": []}',
  member_ids     JSONB NOT NULL DEFAULT '[]',
  owner_user_id  UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_workspaces_slug ON public.workspaces(slug);

-- 3. user_profiles
--    user_id references auth.users (managed by Supabase Auth)
CREATE TABLE public.user_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id              UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  email                     TEXT NOT NULL UNIQUE,
  name                      TEXT NOT NULL,
  role                      TEXT NOT NULL DEFAULT 'owner'
                              CHECK (role IN ('owner','strategist','project_manager','designer',
                                              'developer','finance','client_stakeholder','client_reviewer')),
  avatar_url                TEXT,
  onboarding_completed      BOOLEAN NOT NULL DEFAULT false,
  onboarding_tour_completed BOOLEAN NOT NULL DEFAULT false,
  completed_checklist       TEXT[] NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_profiles_user      ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_workspace ON public.user_profiles(workspace_id);

-- 4. clients
CREATE TABLE public.clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company       TEXT NOT NULL,
  contact       TEXT NOT NULL,
  email         TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('active','lead','inactive')),
  monthly_value NUMERIC(12,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_workspace ON public.clients(workspace_id);

-- 5. projects  (includes pgvector embedding)
CREATE TABLE public.projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id         UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name       TEXT NOT NULL,
  name              TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('active','completed','on_hold')),
  due_date          DATE NOT NULL,
  budget            NUMERIC(14,2) NOT NULL,
  description       TEXT,
  health_score      INT CHECK (health_score >= 0 AND health_score <= 100),
  active_risk_flags TEXT[] NOT NULL DEFAULT '{}',
  embedding         vector(1536),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX idx_projects_client    ON public.projects(client_id);
CREATE INDEX idx_projects_embedding ON public.projects
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 6. tasks
CREATE TABLE public.tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL CHECK (status IN ('todo','in_progress','review','done')),
  priority         TEXT NOT NULL CHECK (priority IN ('low','medium','high','urgent')),
  assignee         TEXT NOT NULL,
  due_date         DATE NOT NULL,
  estimated_hours  NUMERIC(6,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_project   ON public.tasks(project_id);
CREATE INDEX idx_tasks_workspace ON public.tasks(workspace_id);

-- 7. approvals
CREATE TABLE public.approvals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id     UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('design','copy','video','document')),
  status         TEXT NOT NULL CHECK (status IN ('pending','approved','revision')),
  submitted_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_url       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_approvals_project   ON public.approvals(project_id);
CREATE INDEX idx_approvals_workspace ON public.approvals(workspace_id);

-- 8. comments
CREATE TABLE public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  target_id   TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('approval','task')),
  author      TEXT NOT NULL,
  content     TEXT NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_target ON public.comments(target_type, target_id);

-- 9. notifications
CREATE TABLE public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('mention','status_change','task_assigned')),
  read         BOOLEAN NOT NULL DEFAULT false,
  target_url   TEXT,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE read = false;

-- 10. calls
CREATE TABLE public.calls (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  attendees     TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL CHECK (status IN ('upcoming','completed','prepped')),
  summary       TEXT,
  notes_url     TEXT,
  prep_checklist JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_calls_workspace ON public.calls(workspace_id);

-- 11. finances
CREATE TABLE public.finances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount       NUMERIC(14,2) NOT NULL,
  category     TEXT NOT NULL,
  date         DATE NOT NULL,
  description  TEXT NOT NULL,
  tps          NUMERIC(10,2) NOT NULL DEFAULT 0,
  tvq          NUMERIC(10,2) NOT NULL DEFAULT 0,
  status       TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_finances_workspace ON public.finances(workspace_id);

-- 12. fulfillment
CREATE TABLE public.fulfillment (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  status       TEXT NOT NULL,
  progress     NUMERIC(5,2) NOT NULL DEFAULT 0,
  checklist    JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fulfillment_workspace ON public.fulfillment(workspace_id);

-- 13. presence
--     No workspace_id in Convex — user-scoped only
CREATE TABLE public.presence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user"      TEXT NOT NULL UNIQUE,
  last_active NUMERIC NOT NULL,
  status      TEXT NOT NULL,
  location    TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. deals
CREATE TABLE public.deals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  contact      TEXT NOT NULL,
  email        TEXT NOT NULL,
  value        NUMERIC(14,2) NOT NULL,
  stage        TEXT NOT NULL CHECK (stage IN ('new_lead','qualified','proposal','negotiation','won','lost')),
  notes        TEXT,
  last_contact TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deals_workspace ON public.deals(workspace_id);

-- 15. invoices
CREATE TABLE public.invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount         NUMERIC(14,2) NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('paid','pending','overdue','draft')),
  date           DATE NOT NULL,
  due_date       DATE NOT NULL,
  items          JSONB NOT NULL DEFAULT '[]',
  paid_date      DATE,
  tps            NUMERIC(10,2) NOT NULL DEFAULT 0,
  tvq            NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_workspace ON public.invoices(workspace_id);
CREATE INDEX idx_invoices_client    ON public.invoices(client_id);

-- 16. assets
CREATE TABLE public.assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('image','video','document','other')),
  size         NUMERIC NOT NULL,
  url          TEXT NOT NULL,
  project_id   UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id    UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assets_workspace ON public.assets(workspace_id);

-- 17. retainers
CREATE TABLE public.retainers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount         NUMERIC(14,2) NOT NULL,
  cycle          TEXT NOT NULL CHECK (cycle IN ('monthly','quarterly','annual')),
  status         TEXT NOT NULL CHECK (status IN ('active','paused','cancelled')),
  start_date     DATE NOT NULL,
  renewal_date   DATE NOT NULL,
  hours_included NUMERIC(8,2) NOT NULL,
  hours_used     NUMERIC(8,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_retainers_workspace ON public.retainers(workspace_id);
CREATE INDEX idx_retainers_client    ON public.retainers(client_id);

-- 18. milestones
CREATE TABLE public.milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  due_date     DATE NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('upcoming','completed','overdue')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_milestones_project ON public.milestones(project_id);

-- 19. portal_tokens
CREATE TABLE public.portal_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  scopes       TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. activity
CREATE TABLE public.activity (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  action_name  TEXT NOT NULL,
  target_name  TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_workspace ON public.activity(workspace_id);

-- 21. services
CREATE TABLE public.services (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  base_price   NUMERIC(12,2) NOT NULL,
  category     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_services_workspace ON public.services(workspace_id);

-- 22. packages
CREATE TABLE public.packages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  services     UUID[] NOT NULL DEFAULT '{}',
  total_price  NUMERIC(14,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_packages_workspace ON public.packages(workspace_id);

-- 23. tickets
CREATE TABLE public.tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  description  TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('open','in_progress','resolved','closed')),
  priority     TEXT NOT NULL CHECK (priority IN ('low','medium','high','urgent')),
  category     TEXT NOT NULL CHECK (category IN ('bug','feature','question','billing')),
  assigned_to  UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  sla_deadline TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tickets_workspace ON public.tickets(workspace_id);

-- 24. sla_policies
CREATE TABLE public.sla_policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  response_time   INT NOT NULL,
  resolution_time INT NOT NULL,
  priority        TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sla_policies_workspace ON public.sla_policies(workspace_id);

-- 25. agents
CREATE TABLE public.agents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL,
  description  TEXT NOT NULL,
  instructions TEXT NOT NULL,
  tools        TEXT[] NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL CHECK (status IN ('active','idle','busy')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agents_workspace ON public.agents(workspace_id);

-- 26. agent_threads
CREATE TABLE public.agent_threads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id     UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('active','archived')),
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_threads_workspace ON public.agent_threads(workspace_id);
CREATE INDEX idx_agent_threads_agent     ON public.agent_threads(agent_id);

-- 27. agent_messages
CREATE TABLE public.agent_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  thread_id    UUID NOT NULL REFERENCES public.agent_threads(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('user','agent','system')),
  content      TEXT NOT NULL,
  tool_calls   JSONB NOT NULL DEFAULT '[]',
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_messages_thread ON public.agent_messages(thread_id);

-- 28. agent_suggestions
CREATE TABLE public.agent_suggestions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id     UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  action_type  TEXT NOT NULL,
  action_data  JSONB NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  reasoning    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_suggestions_workspace_pending ON public.agent_suggestions(workspace_id)
  WHERE status = 'pending';

-- 29. agent_audit
CREATE TABLE public.agent_audit (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id     UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  details      JSONB NOT NULL DEFAULT '{}',
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_audit_workspace ON public.agent_audit(workspace_id);

-- 30. agent_feedback
CREATE TABLE public.agent_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES public.agent_suggestions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  rating        INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 31. knowledge_base  (includes pgvector embedding)
CREATE TABLE public.knowledge_base (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  category     TEXT NOT NULL,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  embedding    vector(1536),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_knowledge_base_workspace ON public.knowledge_base(workspace_id);
CREATE INDEX idx_knowledge_base_embedding ON public.knowledge_base
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 32. risk_flags
CREATE TABLE public.risk_flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('timeline','scope','approval','relation','finance')),
  severity     TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  summary      TEXT NOT NULL,
  details      TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('active','mitigated','resolved')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_flags_project ON public.risk_flags(project_id);

-- 33. ai_summaries
CREATE TABLE public.ai_summaries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  risk_flag_id UUID REFERENCES public.risk_flags(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('mitigation_plan','health_report','project_summary')),
  content      TEXT NOT NULL,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_summaries_project ON public.ai_summaries(project_id);

-- 34. email_drafts
CREATE TABLE public.email_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('draft','sent','archived')),
  source          TEXT NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_drafts_client ON public.email_drafts(client_id);

-- 35. project_notes
CREATE TABLE public.project_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  author       TEXT NOT NULL,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_notes_project ON public.project_notes(project_id);

-- 36. time_entries
CREATE TABLE public.time_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  project_id   UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id      UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  description  TEXT NOT NULL,
  start_time   NUMERIC NOT NULL,
  end_time     NUMERIC NOT NULL,
  duration     NUMERIC NOT NULL,
  billable     BOOLEAN NOT NULL DEFAULT false,
  hourly_rate  NUMERIC(10,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_time_entries_workspace ON public.time_entries(workspace_id);
CREATE INDEX idx_time_entries_project   ON public.time_entries(project_id);
CREATE INDEX idx_time_entries_user      ON public.time_entries(user_id);

-- 37. active_timers
CREATE TABLE public.active_timers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  project_id   UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id      UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  description  TEXT NOT NULL,
  start_time   NUMERIC NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_active_timers_user ON public.active_timers(user_id);

-- 38. proposals
CREATE TABLE public.proposals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  deal_id       UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  client_id     UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  sections      JSONB NOT NULL DEFAULT '[]',
  service_ids   TEXT[] NOT NULL DEFAULT '{}',
  total_amount  NUMERIC(14,2) NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('draft','sent','signed','declined')),
  token         TEXT NOT NULL UNIQUE,
  sent_at       TIMESTAMPTZ,
  signed_at     TIMESTAMPTZ,
  signed_by     TEXT,
  valid_until   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_proposals_workspace ON public.proposals(workspace_id);
CREATE INDEX idx_proposals_token     ON public.proposals(token);
CREATE INDEX idx_proposals_client    ON public.proposals(client_id);

-- 39. member_availability
CREATE TABLE public.member_availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  weekly_hours NUMERIC(5,2) NOT NULL,
  role         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_member_availability_workspace ON public.member_availability(workspace_id);

-- 40. nps_responses
CREATE TABLE public.nps_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  score         INT NOT NULL CHECK (score >= 0 AND score <= 10),
  reason        TEXT,
  suggestion    TEXT,
  trigger_event TEXT NOT NULL,
  responded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nps_workspace ON public.nps_responses(workspace_id);
CREATE INDEX idx_nps_client    ON public.nps_responses(client_id);

-- 41. push_tokens
CREATE TABLE public.push_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  token         TEXT NOT NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('ios','android')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_push_tokens_user      ON public.push_tokens(user_id);
CREATE INDEX idx_push_tokens_workspace ON public.push_tokens(workspace_id);

-- 42. invitations
CREATE TABLE public.invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  email        TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('owner','member')),
  expires_at   TIMESTAMPTZ NOT NULL,
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invitations_token     ON public.invitations(token);
CREATE INDEX idx_invitations_workspace ON public.invitations(workspace_id);

-- 43. expenses
CREATE TABLE public.expenses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  submitted_by      UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount            NUMERIC(14,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'CAD',
  category          TEXT NOT NULL,
  description       TEXT NOT NULL,
  date              DATE NOT NULL,
  receipt_storage_id TEXT,
  status            TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  approved_by       UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  project_id        UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id         UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_workspace ON public.expenses(workspace_id);
CREATE INDEX idx_expenses_project   ON public.expenses(project_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars',  'avatars',  true),
  ('assets',   'assets',   false),
  ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- T1: Auto-create user_profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name, role, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'owner',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- T2: updated_at auto-maintenance
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'organizations','workspaces','user_profiles','clients','projects',
    'tasks','deals','invoices','retainers','agents','proposals','tickets'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', tbl
    );
  END LOOP;
END;
$$;

-- T3: Execute approved agent suggestion
CREATE OR REPLACE FUNCTION public.execute_approved_agent_suggestion()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    payload := NEW.action_data;

    IF NEW.action_type = 'create_task' THEN
      INSERT INTO public.tasks (workspace_id, project_id, title, description, status, priority, assignee, due_date)
      VALUES (
        NEW.workspace_id,
        (payload->>'project_id')::UUID,
        payload->>'title',
        payload->>'description',
        'todo',
        COALESCE(payload->>'priority', 'medium'),
        COALESCE(payload->>'assignee', 'Unassigned'),
        (payload->>'due_date')::DATE
      );

    ELSIF NEW.action_type = 'update_deal_stage' THEN
      UPDATE public.deals
      SET stage = payload->>'stage'
      WHERE id = (payload->>'deal_id')::UUID;

    ELSIF NEW.action_type = 'create_project_note' THEN
      INSERT INTO public.project_notes (workspace_id, project_id, title, content, author)
      VALUES (
        NEW.workspace_id,
        (payload->>'project_id')::UUID,
        payload->>'title',
        payload->>'content',
        'AGI Agent'
      );
    END IF;

    INSERT INTO public.activity (workspace_id, username, action_name, target_name, entity_type)
    VALUES (NEW.workspace_id, 'AGI Agent', 'executed_suggestion', NEW.title, 'agent_suggestion');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_execute_agent_suggestion
  AFTER UPDATE ON public.agent_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.execute_approved_agent_suggestion();

-- ============================================================
-- SEMANTIC SEARCH FUNCTION (pgvector RAG)
-- ============================================================

CREATE OR REPLACE FUNCTION public.match_knowledge_base(
  query_embedding   vector(1536),
  match_threshold   FLOAT,
  match_count       INT,
  filter_workspace_id UUID
)
RETURNS TABLE (
  id         UUID,
  title      TEXT,
  content    TEXT,
  category   TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE kb.workspace_id = filter_workspace_id
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_projects(
  query_embedding   vector(1536),
  match_threshold   FLOAT,
  match_count       INT,
  filter_workspace_id UUID
)
RETURNS TABLE (
  id         UUID,
  name       TEXT,
  client_name TEXT,
  status     TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.client_name,
    p.status,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.projects p
  WHERE p.workspace_id = filter_workspace_id
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Helper: get the workspace_id of the authenticated user
CREATE OR REPLACE FUNCTION public.my_workspace_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT workspace_id FROM public.user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_org_access" ON public.organizations
  FOR ALL USING (
    id = (SELECT org_id FROM public.workspaces WHERE id = public.my_workspace_id())
  );

-- workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_member_access" ON public.workspaces
  FOR ALL USING (id = public.my_workspace_id());

-- user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_or_workspace" ON public.user_profiles
  FOR ALL USING (
    user_id = auth.uid()
    OR workspace_id = public.my_workspace_id()
  );

-- clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.clients
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.projects
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.tasks
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- approvals
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.approvals
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.comments
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- notifications: each user sees only their own
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notifications" ON public.notifications
  FOR ALL USING (
    workspace_id = public.my_workspace_id()
    AND user_id = auth.uid()
  );

-- calls
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.calls
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- finances
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.finances
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- fulfillment
ALTER TABLE public.fulfillment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.fulfillment
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- presence: user can read/write their own row
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_presence" ON public.presence
  FOR ALL USING ("user" = (SELECT email FROM public.user_profiles WHERE user_id = auth.uid()));

-- deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.deals
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.invoices
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.assets
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- retainers
ALTER TABLE public.retainers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.retainers
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- milestones
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.milestones
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- portal_tokens
ALTER TABLE public.portal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.portal_tokens
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- activity
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.activity
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.services
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.packages
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.tickets
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- sla_policies
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.sla_policies
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.agents
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- agent_threads
ALTER TABLE public.agent_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.agent_threads
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- agent_messages
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.agent_messages
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- agent_suggestions
ALTER TABLE public.agent_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.agent_suggestions
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- agent_audit
ALTER TABLE public.agent_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.agent_audit
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- agent_feedback
ALTER TABLE public.agent_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.agent_feedback
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- knowledge_base
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.knowledge_base
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- risk_flags
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.risk_flags
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- ai_summaries
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.ai_summaries
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- email_drafts
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.email_drafts
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- project_notes
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.project_notes
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- time_entries
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.time_entries
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- active_timers
ALTER TABLE public.active_timers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.active_timers
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.proposals
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- member_availability
ALTER TABLE public.member_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.member_availability
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- nps_responses
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.nps_responses
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- push_tokens: user sees only their own
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_push_tokens" ON public.push_tokens
  FOR ALL USING (
    workspace_id = public.my_workspace_id()
    AND user_id = auth.uid()
  );

-- invitations: workspace members can view; only owners can create
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.invitations
  FOR ALL USING (workspace_id = public.my_workspace_id());

-- expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON public.expenses
  FOR ALL USING (workspace_id = public.my_workspace_id());
