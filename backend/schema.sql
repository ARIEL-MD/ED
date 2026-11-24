CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TYPE role_t AS ENUM ('client','stylist','admin');
CREATE TABLE users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), role role_t NOT NULL, name text NOT NULL, city text, district text,
 phone text UNIQUE NOT NULL, password_hash text NOT NULL, suspended boolean NOT NULL DEFAULT false, avatar_url text, created_at timestamptz DEFAULT now());
CREATE TABLE stylists(user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE, bio text, city text NOT NULL, district text,
 home_service boolean DEFAULT true, salon_service boolean DEFAULT false, travel_fee_fcfa int DEFAULT 0, approved boolean NOT NULL DEFAULT true, certified boolean NOT NULL DEFAULT false, cover_url text, salon_name text);
CREATE TABLE services(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), stylist_id uuid REFERENCES stylists(user_id) ON DELETE CASCADE,
 category text NOT NULL, name text NOT NULL, price_fcfa int NOT NULL CHECK(price_fcfa>0), duration_min int NOT NULL CHECK(duration_min>0), description text, photo_url text);
CREATE TABLE availability(stylist_id uuid REFERENCES stylists(user_id) ON DELETE CASCADE, weekday int CHECK(weekday BETWEEN 0 AND 6),
 start_time time NOT NULL, end_time time NOT NULL);
CREATE TYPE booking_status AS ENUM ('pending','accepted','refused','cancelled','done');
CREATE TABLE bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES users, stylist_id uuid NOT NULL REFERENCES stylists(user_id),
 service_id uuid NOT NULL REFERENCES services, place text NOT NULL CHECK(place IN('home','office','salon')), address text, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 total_fcfa int NOT NULL, deposit_fcfa int NOT NULL, status booking_status NOT NULL DEFAULT 'pending', created_at timestamptz DEFAULT now(),
 -- un créneau actif ne peut jamais être réservé deux fois, même en concurrence
 EXCLUDE USING gist (stylist_id WITH =, tstzrange(starts_at,ends_at) WITH &&) WHERE (status IN ('pending','accepted')));
CREATE TABLE payments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid REFERENCES bookings, provider text NOT NULL,
 provider_ref text UNIQUE, amount_fcfa int NOT NULL, status text NOT NULL DEFAULT 'initiated', commission_fcfa int DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE TABLE reviews(booking_id uuid PRIMARY KEY REFERENCES bookings, rating int CHECK(rating BETWEEN 1 AND 5), comment text, created_at timestamptz DEFAULT now());
CREATE TABLE favorites(client_id uuid REFERENCES users, stylist_id uuid REFERENCES stylists(user_id), PRIMARY KEY(client_id,stylist_id));
CREATE TABLE notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users, kind text, body text, booking_id uuid, read boolean DEFAULT false, created_at timestamptz DEFAULT now());

-- ===== Extensions v2 =====
ALTER TABLE stylists ADD COLUMN lat double precision, ADD COLUMN lng double precision, ADD COLUMN radius_km int DEFAULT 10, ADD COLUMN accepts_cash boolean DEFAULT false;
ALTER TABLE bookings ADD COLUMN reminded boolean DEFAULT false;
CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL REFERENCES bookings, sender_id uuid NOT NULL REFERENCES users,
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 1000), created_at timestamptz DEFAULT now(), read_at timestamptz);
CREATE INDEX messages_booking_idx ON messages(booking_id, created_at);
CREATE TABLE photos(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), stylist_id uuid NOT NULL REFERENCES stylists(user_id) ON DELETE CASCADE, url text NOT NULL, caption text, created_at timestamptz DEFAULT now());
CREATE TABLE categories(id serial PRIMARY KEY, name text UNIQUE NOT NULL, active boolean NOT NULL DEFAULT true);
INSERT INTO categories(name) VALUES ('Coiffure'),('Manucure'),('Pédicure'),('Maquillage'),('Onglerie et soins');
CREATE TABLE complaints(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users, booking_id uuid REFERENCES bookings,
 body text NOT NULL, status text NOT NULL DEFAULT 'open', created_at timestamptz DEFAULT now());
-- Demandes de certification : les photos des pièces sont dans le dossier privé (jamais servi au public) et supprimées après la décision
CREATE TABLE certification_requests(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid NOT NULL REFERENCES stylists(user_id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('cni','passeport','permis','autre')),
  doc_file text, selfie_file text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reason text, created_at timestamptz DEFAULT now(), reviewed_at timestamptz);
CREATE UNIQUE INDEX cert_one_pending ON certification_requests(stylist_id) WHERE status='pending';
