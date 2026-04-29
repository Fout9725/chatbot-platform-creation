CREATE TABLE IF NOT EXISTS geo_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'trial',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS geo_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES geo_tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_geo_users_tenant ON geo_users(tenant_id);

CREATE TABLE IF NOT EXISTS geo_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES geo_tenants(id),
    name VARCHAR(255) NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    is_own BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_geo_brands_tenant ON geo_brands(tenant_id);

CREATE TABLE IF NOT EXISTS geo_tracked_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES geo_tenants(id),
    text TEXT NOT NULL,
    language VARCHAR(8) NOT NULL DEFAULT 'ru',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_geo_queries_tenant ON geo_tracked_queries(tenant_id);

CREATE TABLE IF NOT EXISTS geo_llm_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES geo_tenants(id),
    query_id UUID NOT NULL REFERENCES geo_tracked_queries(id),
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    raw_text TEXT NOT NULL,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    polled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_geo_resp_tenant ON geo_llm_responses(tenant_id);
CREATE INDEX IF NOT EXISTS ix_geo_resp_query ON geo_llm_responses(query_id);
CREATE INDEX IF NOT EXISTS ix_geo_resp_polled ON geo_llm_responses(polled_at DESC);

CREATE TABLE IF NOT EXISTS geo_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES geo_tenants(id),
    response_id UUID NOT NULL REFERENCES geo_llm_responses(id),
    brand_id UUID NOT NULL REFERENCES geo_brands(id),
    sentiment VARCHAR(16) NOT NULL DEFAULT 'neutral',
    sentiment_score REAL NOT NULL DEFAULT 0.0,
    position INTEGER NOT NULL DEFAULT 0,
    snippet VARCHAR(1024) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_geo_ment_tenant ON geo_mentions(tenant_id);
CREATE INDEX IF NOT EXISTS ix_geo_ment_response ON geo_mentions(response_id);
CREATE INDEX IF NOT EXISTS ix_geo_ment_brand ON geo_mentions(brand_id);

CREATE TABLE IF NOT EXISTS geo_content_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES geo_tenants(id),
    query_id UUID NOT NULL REFERENCES geo_tracked_queries(id),
    title VARCHAR(512) NOT NULL,
    body_md TEXT NOT NULL,
    language VARCHAR(8) NOT NULL DEFAULT 'ru',
    factoid_score REAL NOT NULL DEFAULT 0.0,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_geo_drafts_tenant ON geo_content_drafts(tenant_id);

CREATE TABLE IF NOT EXISTS geo_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES geo_tenants(id),
    draft_id UUID NOT NULL REFERENCES geo_content_drafts(id),
    platform VARCHAR(32) NOT NULL,
    external_url VARCHAR(1024),
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    published_at TIMESTAMPTZ,
    error VARCHAR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_geo_pubs_tenant ON geo_publications(tenant_id);
