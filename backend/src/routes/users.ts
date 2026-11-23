import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db";
import { sign } from "../auth";
export const authRoutes = Router();
const reg = z.object({ name: z.string().min(2), phone: z.string().regex(/^\+?\d{8,15}$/), password: z.string().min(8),
  role: z.enum(["client", "stylist"]), city: z.string().optional() });
authRoutes.post("/register", async (req, res) => {
  const p = reg.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Données invalides" });
  const { name, phone, password, role, city } = p.data;
  try {
    const u = await db.query("INSERT INTO users(role,name,phone,password_hash) VALUES($1,$2,$3,$4) RETURNING id",
      [role, name, phone, await bcrypt.hash(password, 12)]);
    if (role === "stylist") await db.query("INSERT INTO stylists(user_id,city) VALUES($1,$2)", [u.rows[0].id, city || "Abidjan"]);
    res.json({ token: sign(u.rows[0].id, role), role });
  } catch { res.status(409).json({ error: "Ce numéro est déjà utilisé" }); }
});
authRoutes.post("/login", async (req, res) => {
  const { phone, password } = req.body || {};
  const r = await db.query("SELECT id,role,password_hash,suspended FROM users WHERE phone=$1", [phone]);
  const u = r.rows[0];
  if (!u || u.role === "admin" || !(await bcrypt.compare(String(password), u.password_hash))) return res.status(401).json({ error: "Identifiants incorrects" });
  if (u.suspended) return res.status(403).json({ error: "Compte suspendu" });
  res.json({ token: sign(u.id, u.role), role: u.role });
});
