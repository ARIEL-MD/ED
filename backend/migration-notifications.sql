-- À exécuter une fois sur une base existante
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS booking_id uuid;
