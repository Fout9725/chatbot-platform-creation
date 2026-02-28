
ALTER TABLE procurement_tenders ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMP;
UPDATE procurement_tenders SET response_deadline = created_at + (response_deadline_days * INTERVAL '1 day') WHERE response_deadline IS NULL AND response_deadline_days IS NOT NULL;

ALTER TABLE procurement_suppliers ALTER COLUMN status TYPE VARCHAR(30);
ALTER TABLE procurement_suppliers DROP CONSTRAINT IF EXISTS procurement_suppliers_status_check;

ALTER TABLE procurement_proposals ADD COLUMN IF NOT EXISTS price NUMERIC(12,2);
ALTER TABLE procurement_proposals ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'RUB';
ALTER TABLE procurement_proposals ADD COLUMN IF NOT EXISTS warranty_months INTEGER;
ALTER TABLE procurement_proposals ADD COLUMN IF NOT EXISTS proposal_text TEXT;
ALTER TABLE procurement_proposals ADD COLUMN IF NOT EXISTS score NUMERIC(5,2);
ALTER TABLE procurement_proposals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE procurement_suppliers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE procurement_messages ALTER COLUMN direction TYPE VARCHAR(10);
ALTER TABLE procurement_messages DROP CONSTRAINT IF EXISTS procurement_messages_direction_check;
ALTER TABLE procurement_messages DROP CONSTRAINT IF EXISTS procurement_messages_message_type_check;
ALTER TABLE procurement_messages ALTER COLUMN message_type TYPE VARCHAR(50);
