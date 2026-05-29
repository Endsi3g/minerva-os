-- ============================================================
-- Minerva OS — Seed Data
-- File: supabase/seed.sql
-- Compatible with: supabase/migrations/001_schema.sql
-- ============================================================

-- ── 1. Organization ───────────────────────────────────────────────────────────
INSERT INTO public.organizations (id, name, logo_url, billing_email)
VALUES ('11111111-1111-1111-1111-111111111111', 'Uprising Studio', NULL, 'billing@uprising.studio')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Workspace ──────────────────────────────────────────────────────────────
INSERT INTO public.workspaces (id, org_id, name, slug, branding, settings)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Minerva Space',
  'minerva-space',
  '{"logo": null, "primaryColor": "#7FA38A", "theme": "dark"}',
  '{"currency": "CAD", "language": "en", "timezone": "America/Toronto", "taxRules": [{"name": "TPS", "rate": 0.05}, {"name": "TVQ", "rate": 0.09975}]}'
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. User Profile (admin placeholder — linked on first login) ───────────────
INSERT INTO public.user_profiles (id, user_id, workspace_id, email, name, role, onboarding_completed)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  NULL,
  '22222222-2222-2222-2222-222222222222',
  'admin@uprising.studio',
  'Olivier G.',
  'owner',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Clients ────────────────────────────────────────────────────────────────
INSERT INTO public.clients (id, workspace_id, company, contact, email, status, monthly_value)
VALUES
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
   'Acme Quebec Inc', 'Jean Dupont', 'jean@acme.qc.ca', 'active', 5000.00),
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222',
   'Stratum Labs', 'Felix Braun', 'felix@stratumlabs.de', 'active', 8000.00)
ON CONFLICT (id) DO NOTHING;

-- ── 5. Projects ───────────────────────────────────────────────────────────────
INSERT INTO public.projects (id, workspace_id, client_id, client_name, name, status, due_date, budget, description, health_score, active_risk_flags)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  '44444444-4444-4444-4444-444444444444',
  'Acme Quebec Inc',
  'Refonte Site Web 2026',
  'active',
  '2026-12-31',
  15000.00,
  'Full website redesign and brand refresh for Acme Quebec Inc.',
  95,
  '{}'
)
ON CONFLICT (id) DO NOTHING;

-- ── 6. Tasks ──────────────────────────────────────────────────────────────────
INSERT INTO public.tasks (id, workspace_id, project_id, title, description, status, priority, assignee, due_date)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  '22222222-2222-2222-2222-222222222222',
  '66666666-6666-6666-6666-666666666666',
  'Finalise logo variations',
  'Review options with brand design director before sending logo deck.',
  'review',
  'high',
  'JR',
  '2026-06-14'
)
ON CONFLICT (id) DO NOTHING;

-- ── 7. Approvals ──────────────────────────────────────────────────────────────
INSERT INTO public.approvals (id, workspace_id, project_id, name, type, status, submitted_date, file_url)
VALUES (
  '88888888-8888-8888-8888-888888888888',
  '22222222-2222-2222-2222-222222222222',
  '66666666-6666-6666-6666-666666666666',
  'Logo Suite v3',
  'design',
  'pending',
  now(),
  'https://kcwdmufkyjsitsuxmqld.supabase.co/storage/v1/object/public/assets/logo-v3.png'
)
ON CONFLICT (id) DO NOTHING;

-- ── 8. Milestones ─────────────────────────────────────────────────────────────
INSERT INTO public.milestones (id, workspace_id, project_id, title, due_date, status)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  '22222222-2222-2222-2222-222222222222',
  '66666666-6666-6666-6666-666666666666',
  'Logo suite approved',
  '2026-06-14',
  'upcoming'
)
ON CONFLICT (id) DO NOTHING;

-- ── 9. Finances ───────────────────────────────────────────────────────────────
INSERT INTO public.finances (workspace_id, type, amount, category, date, description, tps, tvq, status)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'income',  5000.00, 'Services',  '2026-05-10', 'Initial Payment - Projet Refonte',   250.00,  498.75, 'paid'),
  ('22222222-2222-2222-2222-222222222222', 'expense',  120.00, 'Software',  '2026-05-12', 'Vercel Pro Subscription',              6.00,   11.97, 'paid');

-- ── 10. Calls ─────────────────────────────────────────────────────────────────
INSERT INTO public.calls (workspace_id, title, start_time, end_time, attendees, status, summary, notes_url, prep_checklist)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Strategic Review: Acme Quebec',
  now() + interval '2 days',
  now() + interval '2 days' + interval '1 hour',
  '{"Olivier G.","Jean Dupont"}',
  'upcoming',
  'Sync on current milestones and Q3 proposals.',
  'https://notes.uprising.studio/acme',
  '[{"task": "Review previous month metrics", "completed": true}, {"task": "Prepare Q3 proposal", "completed": false}]'
);

-- ── 11. Fulfillment ───────────────────────────────────────────────────────────
INSERT INTO public.fulfillment (workspace_id, project_id, service_type, status, progress, checklist)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '66666666-6666-6666-6666-666666666666',
  'onboarding',
  'in_progress',
  65.00,
  '[{"item": "Access to Google Analytics", "done": true}, {"item": "Brand guidelines received", "done": true}, {"item": "Kickoff meeting held", "done": true}, {"item": "Technical audit started", "done": false}]'
);

-- ── 12. Presence ──────────────────────────────────────────────────────────────
INSERT INTO public.presence ("user", last_active, status, location)
VALUES
  ('admin@uprising.studio', extract(epoch from now())::numeric, 'online', 'dashboard'),
  ('jr@uprising.studio',    extract(epoch from now() - interval '10 minutes')::numeric, 'idle', 'projects')
ON CONFLICT ("user") DO NOTHING;

-- ── 13. Deals ─────────────────────────────────────────────────────────────────
INSERT INTO public.deals (workspace_id, company, contact, email, value, stage, notes, last_contact)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Luminary Group',    'Sophie Bernard',   'sophie@luminarygroup.co',  18000.00, 'new_lead', 'Highly interested in monthly branding retainer.', '2026-05-12 14:00:00+00'),
  ('22222222-2222-2222-2222-222222222222', 'Apex Creative Co.', 'Isabelle Fontaine', 'isabelle@apexcreative.fr', 41000.00, 'proposal', 'Awaiting signed proposal.',                       '2026-05-10 10:30:00+00');

-- ── 14. Invoices ──────────────────────────────────────────────────────────────
INSERT INTO public.invoices (workspace_id, client_id, invoice_number, amount, status, date, due_date, items, tps, tvq)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '55555555-5555-5555-5555-555555555555',
  'INV-2026-041',
  8000.00,
  'paid',
  '2026-05-01',
  '2026-05-15',
  '[{"price": 5000, "quantity": 1, "description": "Brand strategy retainer — May"}, {"price": 3000, "quantity": 1, "description": "Logo suite production"}]',
  400.00,
  798.00
);

-- ── 15. Retainers ─────────────────────────────────────────────────────────────
INSERT INTO public.retainers (workspace_id, client_id, amount, cycle, status, start_date, renewal_date, hours_included, hours_used, notes)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '55555555-5555-5555-5555-555555555555',
  8000.00,
  'monthly',
  'active',
  '2026-01-01',
  '2026-06-01',
  20.00,
  14.50,
  'Includes brand strategy and design support.'
);

-- ── 16. Portal Tokens ─────────────────────────────────────────────────────────
INSERT INTO public.portal_tokens (workspace_id, client_id, token, expires_at, scopes)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '55555555-5555-5555-5555-555555555555',
  'demo-stratum',
  '2027-12-31 23:59:59+00',
  '{"approvals","files","invoices"}'
);

-- ── 17. Activity Logs ─────────────────────────────────────────────────────────
INSERT INTO public.activity (workspace_id, username, action_name, target_name, entity_type)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Olivier G.', 'completed task',   'Information architecture audit', 'task'),
  ('22222222-2222-2222-2222-222222222222', 'Olivier G.', 'created project',  'Brand Identity Refresh',         'project'),
  ('22222222-2222-2222-2222-222222222222', 'Olivier G.', 'sent invoice',     'INV-2026-041',                    'invoice');

-- ── 18. Services ──────────────────────────────────────────────────────────────
INSERT INTO public.services (workspace_id, name, description, base_price, category)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'SEO Audit',        'Full technical and content SEO audit.',     1200.00, 'SEO'),
  ('22222222-2222-2222-2222-222222222222', 'Branding Package', 'Logo, colour palette and brand guidelines.', 4500.00, 'Branding'),
  ('22222222-2222-2222-2222-222222222222', 'Paid Ads Setup',   'Google Ads + Meta campaign setup.',          2000.00, 'Paid Ads');

-- ── 19. Agents ────────────────────────────────────────────────────────────────
INSERT INTO public.agents (id, workspace_id, name, role, description, instructions, tools, status)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'Hermes Orchestrator',
  'Orchestrator',
  'Supervises project risk profiles, drafts client comms, and generates daily checklists.',
  'Analyze workspace databases daily. Generate risk flags for high-utilization retainers or overdue tasks.',
  '{"fetch_risks","create_task","send_notification"}',
  'idle'
)
ON CONFLICT (id) DO NOTHING;

-- ── 20. Agent Suggestions ─────────────────────────────────────────────────────
INSERT INTO public.agent_suggestions (workspace_id, agent_id, title, description, action_type, action_data, status, reasoning)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Create logo export task for Refonte Site Web',
  'Auto-generate design sub-task to finalise visual assets before the due date.',
  'create_task',
  '{"title": "Final brand guidelines export", "assignee": "JR", "priority": "high", "due_date": "2026-06-12", "description": "Export final guidelines in PDF and upload to client assets.", "project_id": "66666666-6666-6666-6666-666666666666"}',
  'pending',
  'Due date for Refonte Site Web is approaching and no brand guidelines export task has been logged yet.'
);

-- ── 21. Knowledge Base ────────────────────────────────────────────────────────
INSERT INTO public.knowledge_base (workspace_id, title, content, category, tags)
VALUES
  ('22222222-2222-2222-2222-222222222222',
   'Uprising Studio Brand Voice',
   'Our brand voice is confident, editorial, and human. We avoid jargon and speak in short, direct sentences. Tone: premium but approachable.',
   'brand',
   '{"brand","voice","guidelines"}'),
  ('22222222-2222-2222-2222-222222222222',
   'Standard Project Kick-off Process',
   'Step 1: Discovery call. Step 2: Brief & scope doc. Step 3: Proposal. Step 4: Contract & deposit. Step 5: Kick-off meeting. Step 6: Production.',
   'process',
   '{"onboarding","process","kickoff"}');

-- ── 22. Risk Flags ────────────────────────────────────────────────────────────
INSERT INTO public.risk_flags (workspace_id, project_id, client_id, type, severity, summary, details, status)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '66666666-6666-6666-6666-666666666666',
  '44444444-4444-4444-4444-444444444444',
  'approval',
  'medium',
  'Logo approval pending for 5+ days',
  'The logo suite v3 approval has been in pending status for 5 days. Client has not responded to the review email.',
  'active'
);

-- ── 23. Time Entries ──────────────────────────────────────────────────────────
INSERT INTO public.time_entries (workspace_id, user_id, project_id, task_id, description, start_time, end_time, duration, billable, hourly_rate)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'jr@uprising.studio',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  'Working on logo variations',
  extract(epoch from now() - interval '3 hours')::numeric,
  extract(epoch from now() - interval '1 hour')::numeric,
  120,
  true,
  85.00
);

-- ── 24. SLA Policies ──────────────────────────────────────────────────────────
INSERT INTO public.sla_policies (workspace_id, name, response_time, resolution_time, priority)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Critical SLA',  60,   240,  'urgent'),
  ('22222222-2222-2222-2222-222222222222', 'Standard SLA',  240,  1440, 'medium'),
  ('22222222-2222-2222-2222-222222222222', 'Low SLA',       480,  4320, 'low');

-- ── 25. Invitations ───────────────────────────────────────────────────────────
INSERT INTO public.invitations (workspace_id, token, email, role, expires_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'inv-demo-token-001',
  'newmember@uprising.studio',
  'member',
  now() + interval '7 days'
);
