-- Add openrouter_request_id column to neurophoto_queue for async polling
ALTER TABLE t_p60354232_chatbot_platform_cre.neurophoto_queue 
ADD COLUMN IF NOT EXISTS openrouter_request_id VARCHAR(255) DEFAULT NULL;