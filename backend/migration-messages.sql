-- À exécuter une fois sur une base existante
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
CREATE INDEX IF NOT EXISTS messages_booking_idx ON messages(booking_id, created_at);
