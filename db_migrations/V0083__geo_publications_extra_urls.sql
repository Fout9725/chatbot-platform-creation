ALTER TABLE geo_publications_v2 ADD COLUMN IF NOT EXISTS extra_urls jsonb NOT NULL DEFAULT '[]'::jsonb;
