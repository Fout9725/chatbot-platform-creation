
CREATE TABLE procurement_tenders (
    id SERIAL PRIMARY KEY,
    owner_id VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    specifications TEXT,
    criteria TEXT,
    budget_max NUMERIC(12,2),
    min_suppliers INTEGER DEFAULT 5,
    response_deadline_days INTEGER DEFAULT 3,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft','searching','collecting','analyzing','awaiting_decision','approved','rejected','cancelled')),
    winner_supplier_id INTEGER,
    ai_report TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE procurement_suppliers (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER NOT NULL REFERENCES procurement_tenders(id),
    company_name VARCHAR(500) NOT NULL,
    email VARCHAR(500),
    website VARCHAR(1000),
    contact_person VARCHAR(300),
    source VARCHAR(100) DEFAULT 'search',
    status VARCHAR(30) DEFAULT 'found' CHECK (status IN ('found','contacted','responded','no_response','excluded','winner','rejected')),
    found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE procurement_proposals (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER NOT NULL REFERENCES procurement_tenders(id),
    supplier_id INTEGER NOT NULL REFERENCES procurement_suppliers(id),
    price_per_unit NUMERIC(12,2),
    total_price NUMERIC(12,2),
    delivery_days INTEGER,
    payment_terms TEXT,
    additional_info TEXT,
    raw_response TEXT,
    ai_score NUMERIC(5,2),
    rank INTEGER,
    parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE procurement_messages (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER NOT NULL REFERENCES procurement_tenders(id),
    supplier_id INTEGER REFERENCES procurement_suppliers(id),
    direction VARCHAR(5) NOT NULL CHECK (direction IN ('out','in')),
    message_type VARCHAR(30) DEFAULT 'rfq' CHECK (message_type IN ('rfq','response','clarification','winner','rejection','followup','support')),
    subject VARCHAR(500),
    body TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_auto_reply BOOLEAN DEFAULT FALSE
);

CREATE TABLE procurement_logs (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER NOT NULL REFERENCES procurement_tenders(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ai_reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_procurement_tenders_owner ON procurement_tenders(owner_id);
CREATE INDEX idx_procurement_tenders_status ON procurement_tenders(status);
CREATE INDEX idx_procurement_suppliers_tender ON procurement_suppliers(tender_id);
CREATE INDEX idx_procurement_proposals_tender ON procurement_proposals(tender_id);
CREATE INDEX idx_procurement_messages_tender ON procurement_messages(tender_id);
CREATE INDEX idx_procurement_logs_tender ON procurement_logs(tender_id);
