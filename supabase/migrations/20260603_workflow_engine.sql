-- ── Phase 2.5 — Workflow Engine ──────────────────────────────────────────────

-- 1. workflows
CREATE TABLE IF NOT EXISTS public.workflows (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  is_template    BOOLEAN NOT NULL DEFAULT false,
  trigger_event  TEXT NOT NULL,
  trigger_filters JSONB NOT NULL DEFAULT '{}',
  created_by     UUID REFERENCES public.user_profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflows_workspace ON public.workflows
  USING (workspace_id IS NULL OR workspace_id IN (
    SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()
  ));

-- 2. workflow_steps
CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id  UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  step_order   INT NOT NULL,
  step_type    TEXT NOT NULL,
  config       JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflow_steps_workspace ON public.workflow_steps
  USING (workflow_id IN (
    SELECT id FROM public.workflows
    WHERE workspace_id IS NULL OR workspace_id IN (
      SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  ));

-- 3. workflow_runs
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_id   UUID NOT NULL REFERENCES public.workflows(id),
  trigger_event TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     UUID,
  status        TEXT NOT NULL DEFAULT 'running',
  current_step  INT NOT NULL DEFAULT 0,
  resume_at     TIMESTAMPTZ,
  context       JSONB NOT NULL DEFAULT '{}',
  steps_log     JSONB NOT NULL DEFAULT '[]',
  error_message TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflow_runs_workspace ON public.workflow_runs
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()
  ));

-- 4. handoffs
CREATE TABLE IF NOT EXISTS public.handoffs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  from_stage       TEXT NOT NULL,
  to_stage         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  required_fields  JSONB NOT NULL DEFAULT '[]',
  notes            TEXT,
  signed_off_by    UUID REFERENCES public.user_profiles(id),
  signed_off_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.handoffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY handoffs_workspace ON public.handoffs
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()
  ));

-- 5. project_templates
CREATE TABLE IF NOT EXISTS public.project_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  project_type    TEXT NOT NULL,
  description     TEXT,
  is_builtin      BOOLEAN NOT NULL DEFAULT false,
  task_packs      JSONB NOT NULL DEFAULT '[]',
  checklist_items JSONB NOT NULL DEFAULT '[]',
  required_fields JSONB NOT NULL DEFAULT '[]',
  sla_defaults    JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_templates_workspace ON public.project_templates
  USING (workspace_id IS NULL OR workspace_id IN (
    SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()
  ));

-- 6. Alter approvals + tickets
ALTER TABLE public.approvals
  ADD COLUMN IF NOT EXISTS sla_deadline    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_breached    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID REFERENCES public.workflow_runs(id);

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS workflow_run_id UUID REFERENCES public.workflow_runs(id);

-- 7. Seed SLA policies (agence premium, built-in)
-- These will only seed if the first workspace exists; safe to run idempotently
DO $$
DECLARE ws UUID;
BEGIN
  SELECT id INTO ws FROM public.workspaces LIMIT 1;
  IF ws IS NOT NULL THEN
    INSERT INTO public.sla_policies (workspace_id, name, priority, response_time, resolution_time) VALUES
      (ws, 'Urgent — Premium SLA', 'urgent', 240, 1440),
      (ws, 'High — Premium SLA',   'high',   480, 2880),
      (ws, 'Medium — Premium SLA', 'medium', 1440, 4320)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 8. Seed built-in workflow templates (workspace_id = NULL)
-- Template IDs are stable UUIDs so we can reference them
INSERT INTO public.workflows (id, workspace_id, name, description, is_active, is_template, trigger_event) VALUES
  ('00000000-0000-0000-0001-000000000001', NULL, 'Proposal Signed — Project Kickoff',
   'Automatically creates kickoff tasks and a Sales→PM handoff when a proposal is signed.',
   true, true, 'proposal_signed'),
  ('00000000-0000-0000-0001-000000000002', NULL, 'Project Kickoff Pack',
   'Sets SLA deadlines and creates foundational tasks when a new project is created.',
   true, true, 'project_created'),
  ('00000000-0000-0000-0001-000000000003', NULL, 'Scope Change Protocol',
   'Flags and escalates scope changes for PM review and budget re-estimation.',
   true, true, 'scope_change_detected'),
  ('00000000-0000-0000-0001-000000000004', NULL, 'Overdue Invoice Follow-up',
   'Notifies finance and escalates to owner for unpaid invoices after 7 days.',
   true, true, 'invoice_overdue'),
  ('00000000-0000-0000-0001-000000000005', NULL, 'Approval Overdue Escalation',
   'Chases stalled client approvals after 48h and escalates to project owner.',
   true, true, 'approval_overdue')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workflow_steps (workflow_id, step_order, step_type, config) VALUES
  -- Template 1: proposal_signed
  ('00000000-0000-0000-0001-000000000001', 1, 'validate_required_fields', '{"fields":["client_id","budget","due_date"]}'),
  ('00000000-0000-0000-0001-000000000001', 2, 'update_status', '{"entity":"project","status":"active"}'),
  ('00000000-0000-0000-0001-000000000001', 3, 'create_task', '{"title":"Send project kickoff email","assignee_role":"project_manager","due_offset_days":1,"priority":"high"}'),
  ('00000000-0000-0000-0001-000000000001', 4, 'create_task', '{"title":"Schedule kickoff call with client","assignee_role":"project_manager","due_offset_days":2,"priority":"high"}'),
  ('00000000-0000-0000-0001-000000000001', 5, 'create_handoff', '{"from_stage":"sales","to_stage":"pm","required_fields":[{"field":"brief_signed","label":"Brief / proposition signé"},{"field":"portal_active","label":"Portail client actif"},{"field":"kickoff_date","label":"Date de kick-off fixée"}]}'),
  ('00000000-0000-0000-0001-000000000001', 6, 'send_notification', '{"to_role":"project_manager","message":"Proposition signée pour {{project.name}} — {{client.company}}. Passation Sales → PM prête à valider.","severity":"high"}'),
  -- Template 2: project_created
  ('00000000-0000-0000-0001-000000000002', 1, 'set_sla', '{"entity":"approval","response_minutes":2880,"resolution_minutes":5760}'),
  ('00000000-0000-0000-0001-000000000002', 2, 'create_task', '{"title":"Créer le document de brief projet","assignee_role":"strategist","due_offset_days":2,"priority":"high"}'),
  ('00000000-0000-0000-0001-000000000002', 3, 'create_task', '{"title":"Configurer la structure de dossiers","assignee_role":"project_manager","due_offset_days":1,"priority":"medium"}'),
  ('00000000-0000-0000-0001-000000000002', 4, 'create_task', '{"title":"Assigner les membres de l équipe","assignee_role":"project_manager","due_offset_days":1,"priority":"high"}'),
  ('00000000-0000-0000-0001-000000000002', 5, 'send_notification', '{"to_role":"owner","message":"Nouveau projet {{project.name}} démarré pour {{client.company}}.","severity":"normal"}'),
  -- Template 3: scope_change_detected
  ('00000000-0000-0000-0001-000000000003', 1, 'create_task', '{"title":"Documenter la demande de changement de scope","assignee_role":"project_manager","due_offset_days":1,"priority":"urgent"}'),
  ('00000000-0000-0000-0001-000000000003', 2, 'create_task', '{"title":"Re-estimer l impact budget","assignee_role":"finance","due_offset_days":2,"priority":"high"}'),
  ('00000000-0000-0000-0001-000000000003', 3, 'send_notification', '{"to_role":"owner","message":"Changement de scope signalé sur {{project.name}} — revue budgétaire requise.","severity":"high"}'),
  ('00000000-0000-0000-0001-000000000003', 4, 'escalate', '{"to_role":"owner","reason":"Changement de scope sur {{project.name}} requiert une validation avant de continuer."}'),
  -- Template 4: invoice_overdue
  ('00000000-0000-0000-0001-000000000004', 1, 'send_notification', '{"to_role":"finance","message":"Facture {{invoice.number}} pour {{client.company}} est en retard. Montant: {{invoice.amount}}.","severity":"high"}'),
  ('00000000-0000-0000-0001-000000000004', 2, 'create_task', '{"title":"Relancer facture en retard {{invoice.number}}","assignee_role":"finance","due_offset_days":0,"priority":"urgent"}'),
  ('00000000-0000-0000-0001-000000000004', 3, 'delay', '{"minutes":10080}'),
  ('00000000-0000-0000-0001-000000000004', 4, 'escalate', '{"to_role":"owner","reason":"Facture {{invoice.number}} impayée après 7 jours. Intervention manuelle requise."}'),
  -- Template 5: approval_overdue
  ('00000000-0000-0000-0001-000000000005', 1, 'send_notification', '{"to_role":"project_manager","message":"Approbation {{approval.name}} en attente depuis 48h — SLA à risque.","severity":"high"}'),
  ('00000000-0000-0000-0001-000000000005', 2, 'create_task', '{"title":"Relancer client sur approbation: {{approval.name}}","assignee_role":"project_manager","due_offset_days":0,"priority":"urgent"}'),
  ('00000000-0000-0000-0001-000000000005', 3, 'escalate', '{"to_role":"owner","reason":"Approbation client bloquée sur {{approval.name}} — {{project.name}}."}');

-- 9. Seed built-in project templates
INSERT INTO public.project_templates (workspace_id, name, project_type, description, is_builtin,
  task_packs, checklist_items, required_fields, sla_defaults) VALUES
(NULL, 'Branding & Identité Visuelle', 'branding',
 'Identité de marque complète : logo, guidelines, déclinaisons.',
 true,
 '[{"title":"Découverte","tasks":[{"title":"Kickoff branding","assigneeRole":"strategist","dueOffsetDays":1,"priority":"high"},{"title":"Analyse concurrents","assigneeRole":"strategist","dueOffsetDays":3,"priority":"medium"}]},{"title":"Conception","tasks":[{"title":"Moodboard & direction créative","assigneeRole":"designer","dueOffsetDays":5,"priority":"high"},{"title":"3 concepts logo","assigneeRole":"designer","dueOffsetDays":10,"priority":"high"}]},{"title":"Finalisation","tasks":[{"title":"Itérations post-validation","assigneeRole":"designer","dueOffsetDays":14,"priority":"medium"},{"title":"Export fichiers finaux","assigneeRole":"designer","dueOffsetDays":17,"priority":"high"}]}]',
 '[{"item":"Brief marque signé","required":true,"stage":"kickoff"},{"item":"Moodboard validé par le client","required":true,"stage":"conception"},{"item":"Concept final approuvé","required":true,"stage":"validation"},{"item":"Fichiers sources livrés (AI, PDF, PNG)","required":true,"stage":"livraison"}]',
 '[{"field":"brief_url","label":"URL du brief marque","when":"always"},{"field":"brand_references","label":"Références visuelles","when":"always"}]',
 '{"approvalResponseHours":48,"taskWarningHours":24}'),
(NULL, 'Site Web & Landing Page', 'web_design',
 'UX, design et développement web.',
 true,
 '[{"title":"UX & Wireframes","tasks":[{"title":"Brief UX & architecture","assigneeRole":"strategist","dueOffsetDays":1,"priority":"high"},{"title":"Wireframes basse fidélité","assigneeRole":"designer","dueOffsetDays":5,"priority":"high"}]},{"title":"Design","tasks":[{"title":"Maquettes haute fidélité","assigneeRole":"designer","dueOffsetDays":10,"priority":"high"},{"title":"Prototype interactif","assigneeRole":"designer","dueOffsetDays":12,"priority":"medium"}]},{"title":"Développement","tasks":[{"title":"Intégration front-end","assigneeRole":"developer","dueOffsetDays":18,"priority":"high"},{"title":"Recette & QA","assigneeRole":"project_manager","dueOffsetDays":22,"priority":"high"},{"title":"Mise en ligne","assigneeRole":"developer","dueOffsetDays":25,"priority":"urgent"}]}]',
 '[{"item":"Brief UX validé","required":true,"stage":"kickoff"},{"item":"Wireframes approuvés","required":true,"stage":"ux"},{"item":"Maquettes approuvées","required":true,"stage":"design"},{"item":"Recette client signée","required":true,"stage":"dev"},{"item":"Mise en ligne confirmée","required":true,"stage":"livraison"}]',
 '[{"field":"domain_url","label":"URL du domaine","when":"always"},{"field":"cms_choice","label":"CMS utilisé","when":"always"},{"field":"brand_guidelines_url","label":"Charte graphique","when":"client_type:enterprise"}]',
 '{"approvalResponseHours":48,"taskWarningHours":24}'),
(NULL, 'Stratégie & Consulting', 'strategy',
 'Audit, recommandations et livrables stratégiques.',
 true,
 '[{"title":"Onboarding","tasks":[{"title":"Appel de découverte","assigneeRole":"strategist","dueOffsetDays":1,"priority":"high"},{"title":"Envoi questionnaire client","assigneeRole":"strategist","dueOffsetDays":1,"priority":"medium"}]},{"title":"Audit","tasks":[{"title":"Analyse de l existant","assigneeRole":"strategist","dueOffsetDays":5,"priority":"high"},{"title":"Benchmark marché","assigneeRole":"strategist","dueOffsetDays":8,"priority":"medium"}]},{"title":"Livrables","tasks":[{"title":"Rapport stratégique","assigneeRole":"strategist","dueOffsetDays":12,"priority":"high"},{"title":"Présentation finale","assigneeRole":"strategist","dueOffsetDays":14,"priority":"urgent"}]}]',
 '[{"item":"Questionnaire client complété","required":true,"stage":"onboarding"},{"item":"Accès aux données fournis","required":true,"stage":"audit"},{"item":"Rapport stratégique validé","required":true,"stage":"livraison"},{"item":"Présentation finale livrée","required":true,"stage":"cloture"}]',
 '[{"field":"strategy_scope","label":"Périmètre de la mission","when":"always"},{"field":"kpi_targets","label":"KPIs cibles","when":"always"}]',
 '{"approvalResponseHours":72,"taskWarningHours":48}')
ON CONFLICT DO NOTHING;
