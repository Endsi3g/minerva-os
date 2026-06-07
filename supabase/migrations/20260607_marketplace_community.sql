-- v4.7.0 — Marketplace Community Tier
-- Allows workspace members to submit and share templates, automations, and playbooks.

ALTER TABLE marketplace_items
  ADD COLUMN IF NOT EXISTS is_community  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_by  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS item_status   TEXT DEFAULT 'published'
    CHECK (item_status IN ('draft', 'submitted', 'approved', 'published'));

CREATE TABLE IF NOT EXISTS marketplace_submissions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  submitted_by  UUID        REFERENCES user_profiles(id) ON DELETE SET NULL,
  item_id       UUID        REFERENCES marketplace_items(id) ON DELETE SET NULL,
  name          TEXT        NOT NULL,
  description   TEXT,
  type          TEXT        NOT NULL CHECK (type IN ('template', 'automation', 'view', 'playbook')),
  category      TEXT        NOT NULL,
  config        JSONB       DEFAULT '{}',
  status        TEXT        DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketplace_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_marketplace_submissions"
  ON marketplace_submissions
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_profiles WHERE id = auth.uid()
    )
  );
