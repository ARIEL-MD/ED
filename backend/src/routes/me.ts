import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { auth, AuthReq } from "../auth";
import { saveImage, removeImage } from "../images";
export const meRoutes = Router();
meRoutes.use(auth());
meRoutes.get("/", async (req: AuthReq, res) => res.json((await db.query("SELECT id,role,name,phone,avatar_url,city,district FROM users WHERE id=$1", [req.user!.id])).rows[0]));
meRoutes.patch("/", async (req: AuthReq, res) => {
  const p = z.object({ name: z.string().min(2).max(80), city: z.string().trim().min(2).max(80), district: z.string().trim().min(2).max(120) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Nom, ville et quartier sont obligatoires" });
  await db.query("UPDATE users SET name=$2, city=$3, district=$4 WHERE id=$1", [req.user!.id, p.data.name, p.data.city, p.data.district]);
  await db.query("UPDATE stylists SET city=$2, district=$3 WHERE user_id=$1", [req.user!.id, p.data.city, p.data.district]); // professionnelle : même lieu partout
  res.json({ ok: true });
});
// Photo de profil : clients et coiffeuses
meRoutes.put("/avatar", async (req: AuthReq, res) => {
  const r = saveImage(req.body?.dataUrl); if ("error" in r) return res.status(r.status).json({ error: r.error });
  const old = (await db.query("SELECT avatar_url FROM users WHERE id=$1", [req.user!.id])).rows[0]?.avatar_url;
  await db.query("UPDATE users SET avatar_url=$2 WHERE id=$1", [req.user!.id, r.url]); removeImage(old); res.json({ avatar_url: r.url });
});
meRoutes.delete("/avatar", async (req: AuthReq, res) => {
  const r = await db.query("UPDATE users u SET avatar_url=NULL FROM (SELECT avatar_url FROM users WHERE id=$1) o WHERE u.id=$1 RETURNING o.avatar_url", [req.user!.id]);
  removeImage(r.rows[0]?.avatar_url); res.json({ ok: true });
});
meRoutes.get("/favorites", async (req: AuthReq, res) => res.json((await db.query(
  `SELECT s.user_id id,u.name,s.city,s.district,(SELECT MIN(price_fcfa) FROM services WHERE stylist_id=s.user_id) from_price
   FROM favorites f JOIN stylists s ON s.user_id=f.stylist_id JOIN users u ON u.id=s.user_id WHERE f.client_id=$1`, [req.user!.id])).rows));
meRoutes.put("/favorites/:id", auth("client"), async (req: AuthReq, res) => {
  await db.query("INSERT INTO favorites VALUES($1,$2) ON CONFLICT DO NOTHING", [req.user!.id, req.params.id]).catch(() => null); res.json({ ok: true });
});
meRoutes.delete("/favorites/:id", async (req: AuthReq, res) => { await db.query("DELETE FROM favorites WHERE client_id=$1 AND stylist_id=$2", [req.user!.id, req.params.id]); res.json({ ok: true }); });
meRoutes.get("/notifications", async (req: AuthReq, res) => res.json((await db.query("SELECT id,kind,body,booking_id,read,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50", [req.user!.id])).rows));
meRoutes.post("/notifications/read", async (req: AuthReq, res) => { await db.query("UPDATE notifications SET read=true WHERE user_id=$1", [req.user!.id]); res.json({ ok: true }); });
meRoutes.post("/complaints", async (req: AuthReq, res) => {
  const p = z.object({ body: z.string().min(5).max(2000), bookingId: z.string().uuid().optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Message trop court" });
  await db.query("INSERT INTO complaints(author_id,booking_id,body) VALUES($1,$2,$3)", [req.user!.id, p.data.bookingId || null, p.data.body]); res.status(201).json({ ok: true });
});
