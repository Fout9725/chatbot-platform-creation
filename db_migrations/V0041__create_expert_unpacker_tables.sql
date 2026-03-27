
CREATE TABLE expert_users (
    id SERIAL PRIMARY KEY,
    telegram_id TEXT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pay')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'completed', 'finished')),
    question_step INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expert_answers (
    id SERIAL PRIMARY KEY,
    telegram_id TEXT NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(telegram_id, question_number)
);

CREATE INDEX idx_expert_users_telegram_id ON expert_users(telegram_id);
CREATE INDEX idx_expert_answers_telegram_id ON expert_answers(telegram_id);
