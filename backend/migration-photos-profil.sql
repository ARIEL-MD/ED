-- À exécuter une fois sur une base existante
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS photo_url text;
