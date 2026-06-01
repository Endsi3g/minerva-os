-- Migration: Add portal_activity_log table
-- Tracks client portal access events for agency review

create table public.portal_activity_log (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  token_id uuid references public.portal_tokens(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  event text not null check (event in (
    'portal_accessed', 'email_verified', 'page_viewed',
    'approval_approved', 'approval_revision', 'comment_added',
    'file_downloaded', 'invoice_downloaded',
    'ticket_created', 'nps_submitted',
    'proposal_viewed', 'proposal_signed', 'proposal_declined'
  )),
  metadata jsonb default '{}'::jsonb not null,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_portal_activity_workspace on public.portal_activity_log(workspace_id);
create index idx_portal_activity_client on public.portal_activity_log(client_id);
create index idx_portal_activity_token on public.portal_activity_log(token_id);

-- Enable Row Level Security (RLS)
alter table public.portal_activity_log enable row level security;

-- Workspace isolation policy
create policy "workspace isolation" on public.portal_activity_log
  for all using (workspace_id = public.my_workspace_id());

