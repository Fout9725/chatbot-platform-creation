-- 1. Таблица проектов (рабочих пространств бренда)
CREATE TABLE IF NOT EXISTS geo_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES geo_tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS geo_projects_tenant_idx ON geo_projects (tenant_id);

-- 2. Для каждого tenant создаём один дефолтный проект "Основной"
INSERT INTO geo_projects (tenant_id, name, is_default)
SELECT t.id, 'Основной проект', TRUE
FROM geo_tenants t
WHERE NOT EXISTS (SELECT 1 FROM geo_projects p WHERE p.tenant_id = t.id);

-- 3. Добавляем project_id во все рабочие таблицы
ALTER TABLE geo_brands           ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES geo_projects(id);
ALTER TABLE geo_tracked_queries  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES geo_projects(id);
ALTER TABLE geo_drafts           ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES geo_projects(id);
ALTER TABLE geo_publications_v2  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES geo_projects(id);

-- 4. Привязываем все существующие данные к дефолтному проекту их tenant'а
UPDATE geo_brands b
SET project_id = (SELECT p.id FROM geo_projects p WHERE p.tenant_id = b.tenant_id AND p.is_default LIMIT 1)
WHERE b.project_id IS NULL;

UPDATE geo_tracked_queries q
SET project_id = (SELECT p.id FROM geo_projects p WHERE p.tenant_id = q.tenant_id AND p.is_default LIMIT 1)
WHERE q.project_id IS NULL;

UPDATE geo_drafts d
SET project_id = (SELECT p.id FROM geo_projects p WHERE p.tenant_id = d.tenant_id AND p.is_default LIMIT 1)
WHERE d.project_id IS NULL;

UPDATE geo_publications_v2 pub
SET project_id = (SELECT p.id FROM geo_projects p WHERE p.tenant_id = pub.tenant_id AND p.is_default LIMIT 1)
WHERE pub.project_id IS NULL;

-- 5. Индексы для быстрой фильтрации по проекту
CREATE INDEX IF NOT EXISTS geo_brands_project_idx          ON geo_brands (project_id);
CREATE INDEX IF NOT EXISTS geo_queries_project_idx         ON geo_tracked_queries (project_id);
CREATE INDEX IF NOT EXISTS geo_drafts_project_idx          ON geo_drafts (project_id);
CREATE INDEX IF NOT EXISTS geo_publications_v2_project_idx ON geo_publications_v2 (project_id);