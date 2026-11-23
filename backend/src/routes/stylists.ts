import { Router } from "express";
import { db } from "../db";
export const stylistRoutes = Router();
stylistRoutes.get("/", async (req, res) => {
  const { city, district, category, maxPrice } = req.query;
  const qs = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 60) : "";
  const q = qs ? `%${qs.replace(/[\\%_]/g, "\\$&")}%` : null;
  const r = await db.query(
    `SELECT u.name, u.avatar_url, s.cover_url, s.user_id AS id, s.city, s.district, s.home_service, s.salon_service, s.certified,
       MIN(sv.price_fcfa) AS from_price, COALESCE(AVG(rv.rating),0)::numeric(2,1) AS rating, COUNT(rv.rating) AS reviews
     FROM stylists s JOIN users u ON u.id=s.user_id AND NOT u.suspended
     LEFT JOIN services sv ON sv.stylist_id=s.user_id
     LEFT JOIN bookings b ON b.stylist_id=s.user_id LEFT JOIN reviews rv ON rv.booking_id=b.id
     WHERE s.approved AND ($1::text IS NULL OR s.city ILIKE $1) AND ($2::text IS NULL OR s.district ILIKE $2)
       AND ($3::text IS NULL OR sv.category=$3) AND ($4::int IS NULL OR sv.price_fcfa<=$4)
       AND ($5::text IS NULL OR u.name ILIKE $5 OR s.district ILIKE $5 OR s.city ILIKE $5 OR sv.name ILIKE $5 OR sv.category ILIKE $5)
     GROUP BY u.name, u.avatar_url, s.cover_url, s.user_id ORDER BY s.certified DESC, rating DESC LIMIT 50`,
    [city || null, district || null, category || null, maxPrice ? Number(maxPrice) : null, q]);
  res.json(r.rows);
});
stylistRoutes.get("/:id/services", async (req, res) =>
  res.json((await db.query("SELECT * FROM services WHERE stylist_id=$1", [req.params.id])).rows));
// Créneaux réellement libres pour une date (UTC = heure d'Abidjan)
stylistRoutes.get("/:id/slots", async (req, res) => {
  const { date, serviceId } = req.query as Record<string, string>;
  const sv = (await db.query("SELECT duration_min FROM services WHERE id=$1 AND stylist_id=$2", [serviceId, req.params.id])).rows[0];
  if (!sv || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "Paramètres invalides" });
  const wd = new Date(date + "T00:00:00Z").getUTCDay();
  const av = (await db.query("SELECT start_time,end_time FROM availability WHERE stylist_id=$1 AND weekday=$2", [req.params.id, wd])).rows;
  const taken = (await db.query(
    "SELECT starts_at,ends_at FROM bookings WHERE stylist_id=$1 AND status IN('pending','accepted') AND starts_at::date=$2::date", [req.params.id, date])).rows;
  const out: { start: string; free: boolean }[] = [];
  for (const a of av) {
    let t = new Date(`${date}T${a.start_time}Z`).getTime();
    const end = new Date(`${date}T${a.end_time}Z`).getTime(), dur = sv.duration_min * 60000;
    for (; t + dur <= end; t += 3600000) {
      const free = t > Date.now() && !taken.some((b: any) => t < +new Date(b.ends_at) && t + dur > +new Date(b.starts_at));
      out.push({ start: new Date(t).toISOString(), free });
    }
  }
  res.json(out);
});
