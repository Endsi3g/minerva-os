-- Initial database schema for Minerva OS
-- Migration timestamp: 20260528000000

-- Enable Vector & UUID extensions
create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- 1. Table des Organisations
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logo_url text,
  billing_email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Table des Workspaces
create table public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null unique,
  branding jsonb not null default '{"primaryColor": "#7FA38A", "theme": "dark"}'::jsonb,
  settings jsonb not null default '{"currency": "USD", "language": "en", "timezone": "UTC", "taxRules": []}'::jsonb,
  owner_user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_workspaces_slug on public.workspaces(slug);

-- 3. Table des Profils Utilisateurs (user_profiles)
create table public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique, -- Clé étrangère vers auth.users de Supabase
  workspace_id uuid references public.workspaces(id) on delete set null,
  email text not null unique,
  name text not null,
  role text not null check (role in ('owner', 'strategist', 'project_manager', 'designer', 'developer', 'finance', 'client_stakeholder', 'client_reviewer')),
  avatar_url text,
  onboarding_completed boolean default false,
  onboarding_tour_completed boolean default false,
  completed_checklist text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_user_profiles_user on public.user_profiles(user_id);
create index idx_user_profiles_workspace on public.user_profiles(workspace_id);

-- 4. Table des Clients
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company text not null,
  contact text not null,
  email text not null,
  status text not null check (status in ('active', 'lead', 'inactive')),
  monthly_value numeric(10, 2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_clients_workspace on public.clients(workspace_id);

-- 5. Table des Projets
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  name text not null,
  status text not null check (status in ('active', 'completed', 'on_hold')),
  due_date date not null,
  budget numeric(12, 2) not null,
  description text,
  health_score int default 100 check (health_score >= 0 and health_score <= 100),
  active_risk_flags text[] default '{}'::text[],
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_projects_workspace on public.projects(workspace_id);
create index idx_projects_client on public.projects(client_id);

-- 6. Table des Tâches
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee text not null,
  due_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_workspace on public.tasks(workspace_id);

-- 7. Table des Approbations (approvals)
create table public.approvals (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null check (type in ('design', 'copy', 'video', 'document')),
  status text not null check (status in ('pending', 'approved', 'revision')),
  submitted_date timestamp with time zone default timezone('utc'::text, now()) not null,
  file_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_approvals_project on public.approvals(project_id);
create index idx_approvals_workspace on public.approvals(workspace_id);

-- 8. Table des Commentaires (comments)
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  target_id uuid not null, -- ID de la tâche, de l'approbation, etc.
  target_type text not null check (target_type in ('approval', 'task')),
  author text not null,
  content text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_comments_target on public.comments(target_type, target_id);

-- 9. Table des Notifications
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid not null, -- Email ou ID de l'utilisateur cible
  title text not null,
  message text not null,
  type text not null check (type in ('mention', 'status_change', 'task_assigned')),
  read boolean default false not null,
  target_url text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_notifications_user_unread on public.notifications(user_id) where read = false;

-- 10. Table des Appels (calls)
create table public.calls (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  attendees text[] default '{}'::text[] not null,
  status text not null check (status in ('upcoming', 'completed', 'prepped')),
  summary text,
  notes_url text,
  prep_checklist jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_calls_workspace on public.calls(workspace_id);

-- 11. Table des Finances (finances)
create table public.finances (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null,
  category text not null,
  date date not null,
  description text not null,
  tps numeric(10, 2) default 0.00 not null,
  tvq numeric(10, 2) default 0.00 not null,
  status text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_finances_workspace on public.finances(workspace_id);

-- 12. Table des Livrables de Fulfillment (fulfillment)
create table public.fulfillment (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  service_type text not null,
  status text not null,
  progress numeric(5, 2) default 0.00 not null,
  checklist jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_fulfillment_workspace on public.fulfillment(workspace_id);

-- 13. Table des Opportunités (deals)
create table public.deals (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  company text not null,
  contact text not null,
  email text not null,
  value numeric(12, 2) not null,
  stage text not null check (stage in ('new_lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  notes text,
  last_contact timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_deals_workspace on public.deals(workspace_id);

-- 14. Table des Factures (invoices)
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null,
  amount numeric(12, 2) not null,
  status text not null check (status in ('paid', 'pending', 'overdue', 'draft')),
  date date not null,
  due_date date not null,
  items jsonb default '[]'::jsonb not null,
  paid_date date,
  tps numeric(10, 2) default 0.00 not null,
  tvq numeric(10, 2) default 0.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_invoices_workspace on public.invoices(workspace_id);
create index idx_invoices_client on public.invoices(client_id);

-- 15. Table des Assets & Fichiers (assets)
create table public.assets (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  type text not null check (type in ('image', 'video', 'document', 'other')),
  size int not null,
  url text not null,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_assets_workspace on public.assets(workspace_id);

-- 16. Table des Milestones (milestones)
create table public.milestones (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  due_date date not null,
  status text not null check (status in ('upcoming', 'completed', 'overdue')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_milestones_project on public.milestones(project_id);

-- 17. Table des Jetons de Portail Client (portal_tokens)
create table public.portal_tokens (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  token text not null unique,
  expires_at timestamp with time zone not null,
  scopes text[] default '{"approvals", "files"}'::text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 18. Table d'Activité Générale (activity)
create table public.activity (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  username text not null,
  action_name text not null,
  target_name text not null,
  entity_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_activity_workspace on public.activity(workspace_id);

-- 19. Table des Services (services)
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null,
  base_price numeric(10, 2) not null,
  category text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 20. Table des Packages (packages)
create table public.packages (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null,
  services uuid[] default '{}'::uuid[] not null,
  total_price numeric(12, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 21. Table des Tickets de Support (tickets)
create table public.tickets (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  subject text not null,
  description text not null,
  status text not null check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  category text not null check (category in ('bug', 'feature', 'question', 'billing')),
  assigned_to uuid references public.user_profiles(id) on delete set null,
  sla_deadline timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_tickets_workspace on public.tickets(workspace_id);

-- 22. Table des Politiques de SLA (sla_policies)
create table public.sla_policies (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  response_time int not null, -- En minutes
  resolution_time int not null, -- En minutes
  priority text not null unique
);

-- 23. Table des Agents (agents)
create table public.agents (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  role text not null,
  description text not null,
  instructions text not null,
  tools text[] default '{}'::text[] not null,
  status text not null check (status in ('active', 'idle', 'busy')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 24. Table des Threads d'Agents (agent_threads)
create table public.agent_threads (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  title text not null,
  status text not null check (status in ('active', 'archived')),
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 25. Table des Messages d'Agents (agent_messages)
create table public.agent_messages (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  thread_id uuid not null references public.agent_threads(id) on delete cascade,
  role text not null check (role in ('user', 'agent', 'system')),
  content text not null,
  tool_calls jsonb default '[]'::jsonb,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_agent_messages_thread on public.agent_messages(thread_id);

-- 26. Table des Audits d'Agents (agent_audit)
create table public.agent_audit (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  action text not null,
  details jsonb default '{}'::jsonb not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 27. Table des Suggestions de l'IA (agent_suggestions)
create table public.agent_suggestions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  title text not null,
  description text not null,
  action_type text not null,
  action_data jsonb not null,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  reasoning text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_suggestions_workspace_pending on public.agent_suggestions(workspace_id) where status = 'pending';

-- 28. Table des Retours sur Suggestions (agent_feedback)
create table public.agent_feedback (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  suggestion_id uuid not null references public.agent_suggestions(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  rating int check (rating >= 1 and rating <= 5) not null,
  comment text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 29. Table Base de Connaissances (knowledge_base)
create table public.knowledge_base (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null,
  tags text[] default '{}'::text[] not null,
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 30. Table des Drapeaux de Risques (risk_flags)
create table public.risk_flags (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  type text not null check (type in ('timeline', 'scope', 'approval', 'relation', 'finance')),
  severity text not null check (severity in ('low', 'medium', 'high')),
  summary text not null,
  details text not null,
  status text not null check (status in ('active', 'mitigated', 'resolved')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_risk_flags_project on public.risk_flags(project_id);

-- 31. Table des Résumés d'IA (ai_summaries)
create table public.ai_summaries (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  risk_flag_id uuid references public.risk_flags(id) on delete cascade,
  type text not null check (type in ('mitigation_plan', 'health_report', 'project_summary')),
  content text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 32. Table des Brouillons d'E-mails (email_drafts)
create table public.email_drafts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  subject text not null,
  body text not null,
  recipient_email text not null,
  status text not null check (status in ('draft', 'sent', 'archived')),
  source text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 33. Table des Notes de Projets (project_notes)
create table public.project_notes (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  content text not null,
  author text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 34. Table des Propositions (proposals)
create table public.proposals (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  sections jsonb default '[]'::jsonb not null,
  service_ids text[] default '{}'::text[] not null,
  total_amount numeric(12, 2) not null,
  status text not null check (status in ('draft', 'sent', 'signed', 'declined')),
  token text not null unique,
  sent_at timestamp with time zone,
  signed_at timestamp with time zone,
  signed_by text,
  valid_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_proposals_workspace on public.proposals(workspace_id);

-- 35. Table des Disponibilités (member_availability)
create table public.member_availability (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  display_name text not null,
  weekly_hours numeric(5,2) not null,
  role text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 36. Table des Réponses NPS (nps_responses)
create table public.nps_responses (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  score int check (score >= 0 and score <= 10) not null,
  reason text,
  suggestion text,
  trigger_event text not null, -- 'phase_complete' | 'delivery' | 'renewal' | 'manual'
  responded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 37. Table des Jetons Push (push_tokens)
create table public.push_tokens (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 38. Table des Invitations
create table public.invitations (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  token text not null unique,
  email text not null,
  role text not null check (role in ('owner', 'member')),
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone
);

-- 39. Table des Dépenses (expenses)
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  submitted_by uuid not null references public.user_profiles(id) on delete cascade,
  amount numeric(12, 2) not null,
  currency text default 'USD'::text not null,
  category text not null,
  description text not null,
  date date not null,
  receipt_storage_id text,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.user_profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_expenses_workspace on public.expenses(workspace_id);

-- ─── Database Triggers & Automations ────────────────────────────────────────

-- 1. Automating Profile Creation on Supabase Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, email, name, role, onboarding_completed)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'owner',
    false
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Executing Approved AI Suggestions Automatically
create or replace function public.execute_approved_agent_suggestion()
returns trigger as $$
declare
  data_payload jsonb;
begin
  if new.status = 'approved' and old.status = 'pending' then
    data_payload := new.action_data;
    
    -- Action: create_task
    if new.action_type = 'create_task' then
      insert into public.tasks (workspace_id, project_id, title, description, status, priority, assignee, due_date)
      values (
        new.workspace_id,
        (data_payload->>'project_id')::uuid,
        data_payload->>'title',
        data_payload->>'description',
        'todo',
        data_payload->>'priority',
        data_payload->>'assignee',
        (data_payload->>'due_date')::date
      );
      
    -- Action: update_deal_stage
    elsif new.action_type = 'update_deal_stage' then
      update public.deals
      set stage = data_payload->>'stage'
      where id = (data_payload->>'deal_id')::uuid;
      
    -- Action: create_project_note
    elsif new.action_type = 'create_project_note' then
      insert into public.project_notes (workspace_id, project_id, title, content, author)
      values (
        new.workspace_id,
        (data_payload->>'project_id')::uuid,
        data_payload->>'title',
        data_payload->>'content',
        'AGI Agent'
      );
    end if;

    -- Log activity
    insert into public.activity (workspace_id, username, action_name, target_name, entity_type)
    values (new.workspace_id, 'AGI Agent', 'executed_suggestion', new.title, 'agent_suggestion');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tr_execute_agent_suggestion
  after update on public.agent_suggestions
  for each row
  execute function public.execute_approved_agent_suggestion();

-- 3. Semantic Search Function for Knowledge Base (pgvector RAG)
create or replace function public.match_knowledge_base (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_workspace_id uuid
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
language plpgsql as $$
begin
  return query
  select
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    1 - (kb.embedding <=> query_embedding) as similarity
  from public.knowledge_base kb
  where kb.workspace_id = filter_workspace_id
  and 1 - (kb.embedding <=> query_embedding) > match_threshold
  order by kb.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ─── Storage Buckets Setup ──────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('receipts', 'receipts', false)
on conflict (id) do nothing;
