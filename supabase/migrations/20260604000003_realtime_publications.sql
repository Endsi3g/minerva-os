-- Enable replica identity full for complete update payloads
alter table public.clients replica identity full;
alter table public.projects replica identity full;
alter table public.tasks replica identity full;
alter table public.deals replica identity full;
alter table public.invoices replica identity full;
alter table public.retainers replica identity full;
alter table public.finances replica identity full;
alter table public.approvals replica identity full;
alter table public.activity replica identity full;
alter table public.workflows replica identity full;
alter table public.workflow_runs replica identity full;
alter table public.handoffs replica identity full;
alter table public.notifications replica identity full;
alter table public.agents replica identity full;
alter table public.agent_api_keys replica identity full;

-- Create the publication if not exists
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Safely add tables to publication (handle duplicate_object exception)
do $$
declare
  t text;
  tables text[] := array[
    'clients', 
    'projects', 
    'tasks', 
    'deals', 
    'invoices', 
    'retainers', 
    'finances', 
    'approvals', 
    'activity', 
    'workflows', 
    'workflow_runs', 
    'handoffs', 
    'notifications', 
    'agents', 
    'agent_api_keys'
  ];
begin
  foreach t in array tables loop
    begin
      execute 'alter publication supabase_realtime add table public.' || quote_ident(t);
    exception
      when duplicate_object then
        -- already exists in publication, do nothing
        null;
    end;
  end loop;
end $$;
