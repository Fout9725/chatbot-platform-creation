
ALTER TABLE t_p60354232_chatbot_platform_cre.bots ALTER COLUMN ai_model TYPE VARCHAR(200);

ALTER TABLE t_p60354232_chatbot_platform_cre.bots ADD COLUMN IF NOT EXISTS ai_prompt TEXT;
ALTER TABLE t_p60354232_chatbot_platform_cre.bots ADD COLUMN IF NOT EXISTS owner_id VARCHAR(100);

CREATE TABLE IF NOT EXISTS t_p60354232_chatbot_platform_cre.knowledge_sources (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL,
    source_type VARCHAR(20) NOT NULL,
    title VARCHAR(500),
    content TEXT,
    url TEXT,
    file_url TEXT,
    file_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p60354232_chatbot_platform_cre.admin_sessions (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);
