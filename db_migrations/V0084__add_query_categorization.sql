ALTER TABLE geo_tracked_queries
  ADD COLUMN IF NOT EXISTS category VARCHAR(32) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS intent VARCHAR(32) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source VARCHAR(32) DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS geo_queries_category_idx ON geo_tracked_queries (tenant_id, category);
CREATE INDEX IF NOT EXISTS geo_queries_intent_idx ON geo_tracked_queries (tenant_id, intent);