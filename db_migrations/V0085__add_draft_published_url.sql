ALTER TABLE geo_drafts
  ADD COLUMN IF NOT EXISTS published_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NULL;

-- Гарантируем что статус 'ready' допустим — он уже есть в проверке backend, но добавим CHECK для надёжности (необязательно)
CREATE INDEX IF NOT EXISTS geo_drafts_status_idx ON geo_drafts (tenant_id, status);