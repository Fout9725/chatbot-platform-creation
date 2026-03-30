
CREATE TABLE qualifier_users (
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    utm_source TEXT,
    current_state TEXT DEFAULT 'start',
    last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE qualifier_answers (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES qualifier_users(user_id),
    niche TEXT,
    pain TEXT,
    automation_level TEXT,
    sales_channel TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE qualifier_leads (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES qualifier_users(user_id),
    contact_name TEXT,
    contact_phone TEXT,
    contact_telegram TEXT,
    preferred_format TEXT,
    preferred_time TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qualifier_users_user_id ON qualifier_users(user_id);
CREATE INDEX idx_qualifier_answers_user_id ON qualifier_answers(user_id);
CREATE INDEX idx_qualifier_leads_user_id ON qualifier_leads(user_id);
CREATE INDEX idx_qualifier_leads_status ON qualifier_leads(status);
