-- À exécuter une fois sur une base existante
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS certified boolean NOT NULL DEFAULT false;
