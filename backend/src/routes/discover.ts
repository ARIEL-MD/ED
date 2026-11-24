import { Router } from "express";
import { db } from "../db";
export const discoverRoutes = Router();
const uuid = /^[0-9a-f-]{36}$/i;
discoverRoutes.get("/categories", async (_q, res) => res.json((await db.query("SELECT id,name FROM categories WHERE active ORDER BY id")).rows));
// Recherche par proximité (formule de haversine, sans extension PostGIS)
discoverRoutes.get("/stylists/nearby", async (req, res) => {
  const lat = Number(req.query.lat), lng = Number(req.query.lng), km = Math.min(Number(req.query.km) || 10, 50);
  if (!isFinite(lat) || !isFinite(lng)) return res.status(400).json({ error: "Position invalide" });
  const r = await db.query(
    `SELECT * FROM (SELECT u.name, u.avatar_url, s.cover_url, s.user_id id, s.city, s.district, s.salon_name, s.radius_km, s.certified,
      6371*acos(least(1, cos(radians($1))*cos(radians(s.lat))*cos(radians(s.lng)-radians($2))+sin(radians($1))*sin(radians(s.lat)))) AS km,
      (SELECT MIN(price_fcfa) FROM services WHERE stylist_id=s.user_id) from_price,
      (SELECT COALESCE(AVG(r.rating),0)::numeric(2,1) FROM reviews r JOIN bookings b ON b.id=r.booking_id WHERE b.stylist_id=s.user_id) rating,
      (SELECT COUNT(*) FROM reviews r JOIN bookings b ON b.id=r.booking_id WHERE b.stylist_id=s.user_id) reviews
      FROM stylists s JOIN users u ON u.id=s.user_id AND NOT u.suspended WHERE s.approved AND s.lat IS NOT NULL) t
     WHERE km<=$3 ORDER BY km LIMIT 50`, [lat, lng, km]);
  res.json(r.rows);
});
discoverRoutes.get("/stylists/:id", async (req, res) => {
  const id = req.params.id; if (!uuid.test(id)) return res.status(400).json({ error: "Identifiant invalide" });
  const s = (await db.query("SELECT u.name,u.avatar_url,s.cover_url,s.user_id id,s.bio,s.city,s.district,s.salon_name,s.home_service,s.salon_service,s.travel_fee_fcfa,s.radius_km,s.accepts_cash,s.certified,u.created_at member_since,(SELECT count(*) FROM bookings b WHERE b.stylist_id=s.user_id AND b.status='done')::int done_count FROM stylists s JOIN users u ON u.id=s.user_id WHERE s.user_id=$1 AND s.approved AND NOT u.suspended", [id])).rows[0];
  if (!s) return res.status(404).json({ error: "Professionnel introuvable" });
  const [photos, services, reviews] = await Promise.all([
    db.query("SELECT id,url,caption FROM photos WHERE stylist_id=$1 ORDER BY created_at DESC", [id]),
    db.query("SELECT id,category,name,price_fcfa,duration_min,description,photo_url FROM services WHERE stylist_id=$1 ORDER BY price_fcfa", [id]),
    db.query("SELECT r.rating,r.comment,r.created_at,u.name FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN users u ON u.id=b.client_id WHERE b.stylist_id=$1 ORDER BY r.created_at DESC LIMIT 30", [id])]);
  res.json({ ...s, photos: photos.rows, services: services.rows, reviews: reviews.rows });
});
