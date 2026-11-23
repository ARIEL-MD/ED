import { Router } from "express";
import { z } from "zod";
import { db, notify } from "../db";
import { auth, AuthReq } from "../auth";
export const extraRoutes = Router();
extraRoutes.patch("/:id/complete", auth("stylist"), async (req: AuthReq, res) => {
  const r = await db.query("UPDATE bookings SET status='done' WHERE id=$1 AND stylist_id=$2 AND status='accepted' AND starts_at<now() RETURNING client_id", [req.params.id, req.user!.id]);
  if (!r.rowCount) return res.status(404).json({ error: "Impossible de terminer cette réservation" });
  await notify(r.rows[0].client_id, "done", "Prestation terminée : donnez votre avis"); res.json({ ok: true });
});
extraRoutes.post("/:id/review", auth("client"), async (req: AuthReq, res) => {
  const p = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Note invalide" });
  const b = (await db.query("SELECT stylist_id FROM bookings WHERE id=$1 AND client_id=$2 AND status='done'", [req.params.id, req.user!.id])).rows[0];
  if (!b) return res.status(404).json({ error: "Réservation non terminée" });
  const r = await db.query("INSERT INTO reviews(booking_id,rating,comment) VALUES($1,$2,$3) ON CONFLICT DO NOTHING", [req.params.id, p.data.rating, p.data.comment]);
  if (!r.rowCount) return res.status(409).json({ error: "Déjà évaluée" });
  await notify(b.stylist_id, "review", "Nouvel avis reçu"); res.status(201).json({ ok: true });
});
// Espace Messages : une conversation par réservation (client <-> coiffeuse)
extraRoutes.get("/conversations", auth(), async (req: AuthReq, res) => {
  res.json((await db.query(
    `SELECT b.id, b.status, b.starts_at, sv.name AS service,
       o.id AS other_id, o.name AS other_name, o.avatar_url AS other_avatar,
       lm.body AS last_body, lm.created_at AS last_at, lm.sender_id AS last_sender,
       (SELECT count(*) FROM messages m WHERE m.booking_id=b.id AND m.sender_id<>$1 AND m.read_at IS NULL)::int AS unread
     FROM bookings b
     JOIN services sv ON sv.id=b.service_id
     JOIN users o ON o.id = CASE WHEN b.client_id=$1 THEN b.stylist_id ELSE b.client_id END
     LEFT JOIN LATERAL (SELECT body,created_at,sender_id FROM messages WHERE booking_id=b.id ORDER BY created_at DESC LIMIT 1) lm ON true
     WHERE (b.client_id=$1 OR b.stylist_id=$1) AND b.status IN ('pending','accepted','done')
     ORDER BY COALESCE(lm.created_at, b.created_at) DESC LIMIT 100`, [req.user!.id])).rows);
});
extraRoutes.get("/messages/unread", auth(), async (req: AuthReq, res) => {
  const r = await db.query(
    `SELECT count(*)::int AS count FROM messages m JOIN bookings b ON b.id=m.booking_id
     WHERE (b.client_id=$1 OR b.stylist_id=$1) AND m.sender_id<>$1 AND m.read_at IS NULL`, [req.user!.id]);
  res.json({ count: r.rows[0].count });
});
// Messagerie liée à une réservation (client <-> coiffeuse)
const party = async (bid: string, uid: string) => (await db.query("SELECT client_id,stylist_id FROM bookings WHERE id=$1 AND (client_id=$2 OR stylist_id=$2)", [bid, uid])).rows[0];
extraRoutes.get("/:id/messages", auth(), async (req: AuthReq, res) => {
  if (!(await party(req.params.id, req.user!.id))) return res.status(404).json({ error: "Introuvable" });
  // ouvrir la conversation marque les messages de l'autre personne comme lus
  await db.query("UPDATE messages SET read_at=now() WHERE booking_id=$1 AND sender_id<>$2 AND read_at IS NULL", [req.params.id, req.user!.id]);
  res.json((await db.query("SELECT id,sender_id,body,created_at,read_at FROM messages WHERE booking_id=$1 ORDER BY created_at", [req.params.id])).rows);
});
extraRoutes.post("/:id/messages", auth(), async (req: AuthReq, res) => {
  const p = z.object({ body: z.string().min(1).max(1000) }).safeParse(req.body);
  const b = await party(req.params.id, req.user!.id);
  if (!p.success || !b) return res.status(400).json({ error: "Message invalide" });
  await db.query("INSERT INTO messages(booking_id,sender_id,body) VALUES($1,$2,$3)", [req.params.id, req.user!.id, p.data.body]);
  await notify(b.client_id === req.user!.id ? b.stylist_id : b.client_id, "message", "Nouveau message", req.params.id); res.status(201).json({ ok: true });
});
