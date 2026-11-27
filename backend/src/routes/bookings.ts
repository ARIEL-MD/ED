import { Router } from "express";
import { z } from "zod";
import { db, notify } from "../db";
import { auth, AuthReq } from "../auth";
export const bookingRoutes = Router();
const body = z.object({ stylistId: z.string().uuid(), serviceId: z.string().uuid(), place: z.enum(["home", "salon"]),
  address: z.string().optional(), startsAt: z.string().datetime() });
bookingRoutes.post("/", auth("client"), async (req: AuthReq, res) => {
  const p = body.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Données invalides" });
  const b = p.data;
  const sv = (await db.query(
    `SELECT sv.price_fcfa, sv.duration_min, s.travel_fee_fcfa, s.home_service, s.salon_service FROM services sv
     JOIN stylists s ON s.user_id=sv.stylist_id WHERE sv.id=$1 AND sv.stylist_id=$2 AND s.approved`, [b.serviceId, b.stylistId])).rows[0];
  if (!sv) return res.status(404).json({ error: "Prestation introuvable" });
  if ((b.place !== "salon" && (!sv.home_service || !b.address)) || (b.place === "salon" && !sv.salon_service))
    return res.status(400).json({ error: "Lieu non disponible" });
  const start = new Date(b.startsAt), end = new Date(+start + sv.duration_min * 60000);
  const total = sv.price_fcfa + (b.place !== "salon" ? sv.travel_fee_fcfa : 0);
  try {
    const r = await db.query(
      `INSERT INTO bookings(client_id,stylist_id,service_id,place,address,starts_at,ends_at,total_fcfa,deposit_fcfa)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user!.id, b.stylistId, b.serviceId, b.place, b.address, start, end, total, Math.round(total * 0.3)]);
    await notify(b.stylistId, "new_request", "Nouvelle demande de réservation", r.rows[0].id);
    res.status(201).json(r.rows[0]);
  } catch (e: any) {
    if (e.code === "23P01") return res.status(409).json({ error: "Ce créneau vient d'être réservé" });
    throw e;
  }
});
bookingRoutes.get("/mine", auth(), async (req: AuthReq, res) => {
  const col = req.user!.role === "stylist" ? "stylist_id" : "client_id";
  res.json((await db.query(`SELECT b.*,sv.name AS service,cu.name AS client_name,su.name AS stylist_name,s.accepts_cash FROM bookings b JOIN services sv ON sv.id=b.service_id JOIN users cu ON cu.id=b.client_id JOIN users su ON su.id=b.stylist_id JOIN stylists s ON s.user_id=b.stylist_id WHERE b.${col}=$1 ORDER BY b.starts_at DESC`, [req.user!.id])).rows);
});
bookingRoutes.patch("/:id/respond", auth("stylist"), async (req: AuthReq, res) => {
  const accept = req.body?.accept === true;
  const r = await db.query("UPDATE bookings SET status=$1 WHERE id=$2 AND stylist_id=$3 AND status='pending' RETURNING client_id",
    [accept ? "accepted" : "refused", req.params.id, req.user!.id]);
  if (!r.rowCount) return res.status(404).json({ error: "Demande introuvable" });
  await notify(r.rows[0].client_id, accept ? "accepted" : "refused", accept ? "Réservation acceptée" : "Réservation refusée", req.params.id);
  res.json({ ok: true });
});
bookingRoutes.patch("/:id/cancel", auth("client"), async (req: AuthReq, res) => {
  const r = await db.query("UPDATE bookings SET status='cancelled' WHERE id=$1 AND client_id=$2 AND status IN('pending','accepted') RETURNING stylist_id", [req.params.id, req.user!.id]);
  if (!r.rowCount) return res.status(404).json({ error: "Réservation introuvable" });
  await notify(r.rows[0].stylist_id, "cancelled", "Une réservation a été annulée", req.params.id);
  res.json({ ok: true });
});
