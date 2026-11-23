import { Router } from "express";
import { db, notify } from "../db";
import { PRIVATE_DIR, removePrivate } from "../images";
import { auth } from "../auth";
export const adminRoutes = Router();
adminRoutes.use(auth("admin"));
adminRoutes.get("/stats", async (_q, res) => res.json((await db.query(
  `SELECT (SELECT count(*) FROM users WHERE role='client') clients, (SELECT count(*) FROM stylists WHERE approved) stylists,
   (SELECT count(*) FROM bookings) bookings, (SELECT COALESCE(sum(commission_fcfa),0) FROM payments WHERE status='paid') commissions, (SELECT count(*) FROM certification_requests WHERE status='pending') certifications,
   (SELECT count(*) FROM stylists s JOIN users u ON u.id=s.user_id WHERE NOT s.approved AND NOT u.suspended) validations, (SELECT count(*) FROM complaints WHERE status='open') complaints`)).rows[0]));
adminRoutes.get("/stylists/pending", async (_q, res) => res.json((await db.query(
  "SELECT u.id,u.name,u.phone,s.city FROM stylists s JOIN users u ON u.id=s.user_id WHERE NOT s.approved AND NOT u.suspended")).rows));
adminRoutes.patch("/stylists/:id/approve", async (req, res) => { await db.query("UPDATE stylists SET approved=true WHERE user_id=$1", [req.params.id]); res.json({ ok: true }); });
// Certification : accordée uniquement après examen d'une demande avec pièce d'identité ; l'admin peut ensuite la retirer
adminRoutes.patch("/stylists/:id/certify", async (req, res) => {
  if (req.body?.certified !== false) return res.status(400).json({ error: "La certification s'accorde en examinant une demande" });
  const r = await db.query("UPDATE stylists SET certified=false WHERE user_id=$1 RETURNING user_id", [req.params.id]);
  if (!r.rowCount) return res.status(404).json({ error: "Profil introuvable" });
  res.json({ ok: true });
});
adminRoutes.get("/certifications", async (_q, res) => res.json((await db.query(
  `SELECT c.id,c.doc_type,c.created_at,(c.selfie_file IS NOT NULL) has_selfie,u.name,u.phone,s.city FROM certification_requests c
   JOIN stylists s ON s.user_id=c.stylist_id JOIN users u ON u.id=c.stylist_id WHERE c.status='pending' ORDER BY c.created_at`)).rows));
// Les pièces ne sont lisibles que par un administrateur connecté, jamais mises en cache
adminRoutes.get("/certifications/:id/file/:kind", async (req, res) => {
  if (!/^[0-9a-f-]{36}$/.test(req.params.id) || !["doc", "selfie"].includes(req.params.kind)) return res.status(400).json({ error: "Demande invalide" });
  const r = (await db.query("SELECT doc_file,selfie_file FROM certification_requests WHERE id=$1 AND status='pending'", [req.params.id])).rows[0];
  const f = r && (req.params.kind === "doc" ? r.doc_file : r.selfie_file);
  if (!f) return res.status(404).json({ error: "Fichier introuvable" });
  res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); res.sendFile(f, { root: PRIVATE_DIR });
});
adminRoutes.patch("/certifications/:id", async (req, res) => {
  const ok = req.body?.approve === true; const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 200) : "";
  if (!ok && !reason) return res.status(400).json({ error: "Indiquez le motif du refus" });
  const old = (await db.query("SELECT doc_file,selfie_file FROM certification_requests WHERE id=$1 AND status='pending'", [req.params.id])).rows[0];
  const r = await db.query("UPDATE certification_requests SET status=$2,reason=$3,reviewed_at=now(),doc_file=NULL,selfie_file=NULL WHERE id=$1 AND status='pending' RETURNING stylist_id",
    [req.params.id, ok ? "approved" : "rejected", ok ? null : reason]);
  if (!r.rowCount) return res.status(404).json({ error: "Demande introuvable" });
  removePrivate(old?.doc_file); removePrivate(old?.selfie_file);   // pièces supprimées dès la décision
  if (ok) { await db.query("UPDATE stylists SET certified=true WHERE user_id=$1", [r.rows[0].stylist_id]); await notify(r.rows[0].stylist_id, "certified", "Félicitations, votre profil est maintenant certifié"); }
  else await notify(r.rows[0].stylist_id, "cert_rejected", `Certification refusée : ${reason}`);
  res.json({ ok: true });
});
adminRoutes.patch("/users/:id/suspend", async (req, res) => { await db.query("UPDATE users SET suspended=$2 WHERE id=$1 AND role<>'admin'", [req.params.id, req.body?.suspended !== false]); res.json({ ok: true }); });
