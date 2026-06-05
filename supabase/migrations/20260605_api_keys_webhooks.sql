-- Migration: api_keys and webhooks tables for v4.4 public API + webhook delivery

-- ── API Keys ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{read}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON public.api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_isolation" ON public.api_keys
  FOR ALL USING (
    workspace_id = (
      SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- ── Webhooks ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  last_status INTEGER
);

CREATE INDEX IF NOT EXISTS idx_webhooks_workspace ON public.webhooks(workspace_id);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_isolation" ON public.webhooks
  FOR ALL USING (
    workspace_id = (
      SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );
