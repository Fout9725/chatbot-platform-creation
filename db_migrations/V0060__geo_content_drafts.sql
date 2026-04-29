CREATE TABLE IF NOT EXISTS geo_content_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    query_id UUID,
    title TEXT NOT NULL,
    content_md TEXT NOT NULL DEFAULT '',
    target_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'draft',
    model TEXT,
    word_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_content_drafts_tenant ON geo_content_drafts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_content_drafts_query ON geo_content_drafts(tenant_id, query_id);
