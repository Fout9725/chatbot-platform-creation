
CREATE TABLE IF NOT EXISTS t_p60354232_chatbot_platform_cre.backend_functions_backup (
    id SERIAL PRIMARY KEY,
    function_name VARCHAR(255) NOT NULL,
    function_id VARCHAR(255),
    file_path TEXT NOT NULL,
    file_content TEXT NOT NULL,
    backed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE t_p60354232_chatbot_platform_cre.neurophoto_users
ADD COLUMN IF NOT EXISTS original_photo_url TEXT NULL;
