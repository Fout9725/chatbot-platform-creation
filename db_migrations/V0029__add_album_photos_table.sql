CREATE TABLE IF NOT EXISTS t_p60354232_chatbot_platform_cre.neurophoto_album_photos (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    media_group_id VARCHAR(100) NOT NULL,
    photo_url TEXT NOT NULL,
    photo_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_album_photos_group ON t_p60354232_chatbot_platform_cre.neurophoto_album_photos (telegram_id, media_group_id);

ALTER TABLE t_p60354232_chatbot_platform_cre.neurophoto_users
ADD COLUMN IF NOT EXISTS session_media_group VARCHAR(100) NULL;

ALTER TABLE t_p60354232_chatbot_platform_cre.neurophoto_users
ADD COLUMN IF NOT EXISTS session_photos TEXT[] NULL;