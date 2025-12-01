-- Add session data columns to neurophoto_users table
ALTER TABLE t_p60354232_chatbot_platform_cre.neurophoto_users 
ADD COLUMN IF NOT EXISTS session_state VARCHAR(50),
ADD COLUMN IF NOT EXISTS session_photo_url TEXT,
ADD COLUMN IF NOT EXISTS session_photo_prompt TEXT,
ADD COLUMN IF NOT EXISTS session_user_instruction TEXT,
ADD COLUMN IF NOT EXISTS session_updated_at TIMESTAMP;

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_neurophoto_users_session_state 
ON t_p60354232_chatbot_platform_cre.neurophoto_users(telegram_id, session_state);