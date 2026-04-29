CREATE TABLE IF NOT EXISTS geo_publications_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  draft_id uuid NULL,
  query_id uuid NULL,
  title text NOT NULL,
  url text NOT NULL,
  platform text NULL,
  status text NOT NULL DEFAULT 'live',
  notes text NULL,
  published_at timestamptz NULL,
  last_check_at timestamptz NULL,
  last_check_found boolean NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_pub_v2_tenant_created ON geo_publications_v2(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_pub_v2_query ON geo_publications_v2(query_id);
CREATE INDEX IF NOT EXISTS idx_geo_pub_v2_draft ON geo_publications_v2(draft_id);

CREATE TABLE IF NOT EXISTS geo_publication_checks_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  publication_id uuid NOT NULL,
  provider text NOT NULL,
  found boolean NOT NULL DEFAULT false,
  snippet text NULL,
  raw_response text NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_pub_checks_v2_pub ON geo_publication_checks_v2(publication_id, checked_at DESC);
