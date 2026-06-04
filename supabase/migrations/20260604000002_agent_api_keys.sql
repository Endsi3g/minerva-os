-- Migration to add agent_api_keys table for custom agent API keys
-- Timestamp: 20260604000002

CREATE TABLE IF NOT EXISTS public.agent_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'relevance', 'other')),
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(agent_id, provider)
);

-- Enable RLS
ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;

-- Workspace Isolation Policy
CREATE POLICY "workspace_isolation" ON public.agent_api_keys
  FOR ALL USING (workspace_id = (SELECT workspace_id FROM public.user_profiles WHERE user_id = auth.uid()));
