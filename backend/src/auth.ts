import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db";
export type Role = "client" | "stylist" | "admin";
export interface AuthReq extends Request { user?: { id: string; role: Role } }
const secret = () => { const s = process.env.JWT_SECRET; if (!s) throw new Error("JWT_SECRET manquant"); return s; };
export const sign = (id: string, role: Role, expSeconds = 7 * 24 * 3600) => jwt.sign({ id, role }, secret(), { expiresIn: expSeconds });
// Chaque requête vérifie que le compte existe et n'est pas suspendu : une suspension prend effet immédiatement, même avec un jeton encore valide
export const auth = (...roles: Role[]) => async (req: AuthReq, res: Response, next: NextFunction) => {
  let p: { id: string; role: Role };
  try { p = jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), secret()) as { id: string; role: Role }; }
  catch { return res.status(401).json({ error: "Non authentifié" }); }
  if (roles.length && !roles.includes(p.role)) return res.status(403).json({ error: "Accès refusé" });
  try {
    const u = (await db.query("SELECT suspended FROM users WHERE id=$1", [p.id])).rows[0];
    if (!u) return res.status(401).json({ error: "Non authentifié" });
    if (u.suspended) return res.status(403).json({ error: "Compte suspendu" });
  } catch { return res.status(500).json({ error: "Erreur serveur" }); }
  req.user = p; next();
};
