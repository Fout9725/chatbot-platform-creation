CREATE TABLE IF NOT EXISTS t_p60354232_chatbot_platform_cre.procurement_bot_states (
    user_id VARCHAR(64) PRIMARY KEY,
    state VARCHAR(64) NOT NULL DEFAULT 'idle',
    state_data JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW()
);