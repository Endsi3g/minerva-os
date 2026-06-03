-- V2.7 Client OS migration

-- Decision Journal
create table if not exists public.portal_decisions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  object_type text not null check (object_type in ('approval', 'invoice', 'proposal')),
  object_id text not null,
  object_name text not null,
  decision text not null,
  note text,
  decided_by text not null,
  created_at timestamp with time zone default now() not null
);
create index if not exists idx_portal_decisions_client on public.portal_decisions(client_id);

-- Portal Notifications
create table if not exists public.portal_notifications (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  type text not null check (type in ('approval_action','invoice_update','proposal_update','file_upload','comment')),
  title text not null,
  message text not null,
  read boolean default false not null,
  target_path text,
  created_at timestamp with time zone default now() not null
);
create index if not exists idx_portal_notifications_client_unread on public.portal_notifications(client_id) where read = false;

-- Portal Notification Preferences
create table if not exists public.portal_notification_prefs (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null unique,
  frequency text not null default 'daily' check (frequency in ('instant','daily','weekly')),
  enabled_types text[] default '{"approval_action","invoice_update","file_upload"}'::text[] not null,
  updated_at timestamp with time zone default now() not null
);

-- Report Shares
create table if not exists public.portal_report_shares (
  id uuid primary key default uuid_generate_v4(),
  share_token text not null unique,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  snapshot_data jsonb not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now() not null
);
create index if not exists idx_portal_report_shares_token on public.portal_report_shares(share_token);

-- AI Monthly Summaries Cache
create table if not exists public.portal_summaries (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  month text not null,
  summary text not null,
  generated_at timestamp with time zone default now() not null,
  unique(client_id, month)
);

-- Extend comments target_type check to include invoice and proposal
alter table public.comments
  drop constraint if exists comments_target_type_check;
alter table public.comments
  add constraint comments_target_type_check
  check (target_type in ('approval', 'task', 'invoice', 'proposal'));

-- RLS
alter table public.portal_decisions enable row level security;
create policy "workspace isolation" on public.portal_decisions for all
  using (workspace_id = (select workspace_id from public.user_profiles where user_id = auth.uid() limit 1));

alter table public.portal_notifications enable row level security;
create policy "workspace isolation" on public.portal_notifications for all
  using (workspace_id = (select workspace_id from public.user_profiles where user_id = auth.uid() limit 1));

alter table public.portal_notification_prefs enable row level security;
create policy "workspace isolation" on public.portal_notification_prefs for all
  using (client_id in (
    select id from public.clients
    where workspace_id = (select workspace_id from public.user_profiles where user_id = auth.uid() limit 1)
  ));

alter table public.portal_report_shares enable row level security;
create policy "workspace isolation" on public.portal_report_shares for all
  using (workspace_id = (select workspace_id from public.user_profiles where user_id = auth.uid() limit 1));

alter table public.portal_summaries enable row level security;
create policy "workspace isolation" on public.portal_summaries for all
  using (workspace_id = (select workspace_id from public.user_profiles where user_id = auth.uid() limit 1));
