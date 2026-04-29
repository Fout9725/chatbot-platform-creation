ALTER TABLE geo_publications
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS query_id uuid,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS last_check_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_check_found boolean;

ALTER TABLE geo_publications ALTER COLUMN status SET DEFAULT 'live';

CREATE INDEX IF NOT EXISTS idx_geo_publications_tenant_created ON geo_publications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_publications_query ON geo_publications(query_id);
CREATE INDEX IF NOT EXISTS idx_geo_publication_checks_pub ON geo_publication_checks(publication_id, checked_at DESC);
