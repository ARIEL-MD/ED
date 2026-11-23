import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { auth } from "../auth";
export const admin2Routes = Router();
admin2Routes.use(auth("admin"));
admin2Routes.get("/users", async (_q, res) => res.json((await db.query("SELECT u.id,u.role,u.name,u.phone,u.suspended,u.created_at,COALESCE(s.certified,false) certified FROM users u LEFT JOIN stylists s ON s.user_id=u.id ORDER BY u.created_at DESC LIMIT 200")).rows));
admin2Routes.get("/bookings", async (_q, res) => res.json((await db.query(
  "SELECT b.id,b.status,b.starts_at,b.total_fcfa,cu.name client,su.name stylist FROM bookings b JOIN users cu ON cu.id=b.client_id JOIN users su ON su.id=b.stylist_id ORDER BY b.created_at DESC LIMIT 200")).rows));
admin2Routes.get("/payments", async (_q, res) => res.json((await db.query("SELECT id,booking_id,provider,amount_fcfa,commission_fcfa,status,created_at FROM payments ORDER BY created_at DESC LIMIT 200")).rows));
admin2Routes.get("/commissions", async (_q, res) => res.json((await db.query(
  "SELECT to_char(date_trunc('day',created_at),'YYYY-MM-DD') day, sum(commission_fcfa)::int commission, sum(amount_fcfa)::int volume FROM payments WHERE status='paid' GROUP BY 1 ORDER BY 1 DESC LIMIT 30")).rows));
admin2Routes.get("/categories", async (_q, res) => res.json((await db.query("SELECT id,name,active FROM categories ORDER BY id")).rows));
admin2Routes.post("/categories", async (req, res) => {
  const p = z.object({ name: z.string().min(2).max(60) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Nom invalide" });
  await db.query("INSERT INTO categories(name) VALUES($1) ON CONFLICT DO NOTHING", [p.data.name]); res.status(201).json({ ok: true });
});
admin2Routes.patch("/categories/:id", async (req, res) => { await db.query("UPDATE categories SET active=$2 WHERE id=$1", [req.params.id, req.body?.active === true]); res.json({ ok: true }); });
admin2Routes.get("/complaints", async (_q, res) => res.json((await db.query("SELECT c.id,c.body,c.status,c.created_at,c.booking_id,u.name author,u.phone,u.role FROM complaints c JOIN users u ON u.id=c.author_id ORDER BY c.created_at DESC LIMIT 100")).rows));
admin2Routes.patch("/complaints/:id", async (req, res) => { await db.query("UPDATE complaints SET status='closed' WHERE id=$1", [req.params.id]); res.json({ ok: true }); });
