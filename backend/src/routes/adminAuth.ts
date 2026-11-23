import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { sign } from "../auth";
// Connexion réservée aux administrateurs : adresse séparée de /api/auth/login, session courte (2 h).
export const adminAuthRoutes = Router();
adminAuthRoutes.post("/login", async (req, res) => {
  const { phone, password } = req.body || {};
  const u = (await db.query("SELECT id,role,password_hash,suspended FROM users WHERE phone=$1", [phone])).rows[0];
  if (!u || u.role !== "admin" || u.suspended || !(await bcrypt.compare(String(password), u.password_hash)))
    return res.status(401).json({ error: "Identifiants incorrects" });
  res.json({ token: sign(u.id, "admin", 2 * 3600), role: "admin" });
});
