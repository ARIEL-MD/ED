-- À exécuter une fois sur une base existante
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS salon_name text;
