-- À exécuter une fois sur une base existante
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS salon_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city text, ADD COLUMN IF NOT EXISTS district text;
UPDATE users u SET city=s.city, district=s.district FROM stylists s WHERE s.user_id=u.id AND u.city IS NULL;
