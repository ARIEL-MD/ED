-- À exécuter une fois sur une base existante
CREATE TABLE IF NOT EXISTS certification_requests(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid NOT NULL REFERENCES stylists(user_id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('cni','passeport','permis','autre')),
  doc_file text, selfie_file text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reason text, created_at timestamptz DEFAULT now(), reviewed_at timestamptz);
CREATE UNIQUE INDEX IF NOT EXISTS cert_one_pending ON certification_requests(stylist_id) WHERE status='pending';
