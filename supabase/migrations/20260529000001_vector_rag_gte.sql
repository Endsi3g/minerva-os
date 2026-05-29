-- 1. Drop existing indexes that depend on vector(1536)
DROP INDEX IF EXISTS public.idx_projects_embedding;
DROP INDEX IF EXISTS public.idx_knowledge_base_embedding;

-- 2. Alter columns to vector(384)
ALTER TABLE public.projects ALTER COLUMN embedding TYPE vector(384);
ALTER TABLE public.knowledge_base ALTER COLUMN embedding TYPE vector(384);

-- 3. Re-create indexes with ivfflat for vector(384)
CREATE INDEX idx_projects_embedding ON public.projects 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_knowledge_base_embedding ON public.knowledge_base 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Drop old match functions
DROP FUNCTION IF EXISTS public.match_knowledge_base(vector, float, int, uuid);
DROP FUNCTION IF EXISTS public.match_projects(vector, float, int, uuid);

-- 5. Re-create match functions for vector(384)
CREATE OR REPLACE FUNCTION public.match_knowledge_base(
  query_embedding   vector(384),
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
  query_embedding   vector(384),
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
