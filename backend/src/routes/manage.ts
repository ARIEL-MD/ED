import { Router } from "express";
import { z } from "zod";
import fs from "fs";
import crypto from "crypto";
import { db } from "../db";
import { auth, AuthReq } from "../auth";
import { saveImage, removeImage, savePrivate, removePrivate, publicUrl } from "../images";
export const manageRoutes = Router();
manageRoutes.use(auth("stylist"));
manageRoutes.get("/profile", async (req: AuthReq, res) => res.json((await db.query("SELECT bio,city,district,home_service,salon_service,travel_fee_fcfa,lat,lng,radius_km,accepts_cash,approved,certified,cover_url FROM stylists WHERE user_id=$1", [req.user!.id])).rows[0]));
manageRoutes.patch("/profile", async (req: AuthReq, res) => {
  const p = z.object({ bio: z.string().max(1000).optional(), city: z.string().min(2), district: z.string().max(80).optional(), home_service: z.boolean(), salon_service: z.boolean(),
    travel_fee_fcfa: z.number().int().min(0).max(50000), lat: z.number().min(-90).max(90).nullable().optional(), lng: z.number().min(-180).max(180).nullable().optional(),
    radius_km: z.number().int().min(1).max(50), accepts_cash: z.boolean() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Données invalides" });
  const d = p.data;
  await db.query("UPDATE stylists SET bio=$2,city=$3,district=$4,home_service=$5,salon_service=$6,travel_fee_fcfa=$7,lat=$8,lng=$9,radius_km=$10,accepts_cash=$11 WHERE user_id=$1",
    [req.user!.id, d.bio, d.city, d.district, d.home_service, d.salon_service, d.travel_fee_fcfa, d.lat ?? null, d.lng ?? null, d.radius_km, d.accepts_cash]);
  res.json({ ok: true });
});
manageRoutes.get("/services", async (req: AuthReq, res) => res.json((await db.query("SELECT * FROM services WHERE stylist_id=$1 ORDER BY category,name", [req.user!.id])).rows));
manageRoutes.post("/services", async (req: AuthReq, res) => {
  const p = z.object({ category: z.string().min(2), name: z.string().min(2).max(80), price_fcfa: z.number().int().min(500).max(1000000), duration_min: z.number().int().min(15).max(720),
    description: z.string().max(200).optional(), dataUrl: z.string().optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Données invalides" });
  const d = p.data; let photo: string | null = null;
  if (d.dataUrl) { const r = saveImage(d.dataUrl); if ("error" in r) return res.status(r.status).json({ error: r.error }); photo = r.url; }
  res.status(201).json((await db.query("INSERT INTO services(stylist_id,category,name,price_fcfa,duration_min,description,photo_url) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
    [req.user!.id, d.category, d.name, d.price_fcfa, d.duration_min, d.description || null, photo])).rows[0]);
});
manageRoutes.patch("/services/:id", async (req: AuthReq, res) => {
  const p = z.object({ price_fcfa: z.number().int().min(500).max(1000000).optional(), name: z.string().trim().min(2).max(80).optional(), duration_min: z.number().int().min(15).max(720).optional(), description: z.string().max(200).optional() }).safeParse(req.body);
  if (!p.success || !Object.keys(p.data).length) return res.status(400).json({ error: "Informations invalides" });
  await db.query("UPDATE services SET price_fcfa=COALESCE($3,price_fcfa), name=COALESCE($4,name), duration_min=COALESCE($5,duration_min), description=COALESCE($6,description) WHERE id=$1 AND stylist_id=$2", [req.params.id, req.user!.id, p.data.price_fcfa ?? null, p.data.name ?? null, p.data.duration_min ?? null, p.data.description ?? null]); res.json({ ok: true });
});
// Photo d'une prestation (ajout ou remplacement)
manageRoutes.put("/services/:id/photo", async (req: AuthReq, res) => {
  const r = saveImage(req.body?.dataUrl); if ("error" in r) return res.status(r.status).json({ error: r.error });
  const old = (await db.query("SELECT photo_url FROM services WHERE id=$1 AND stylist_id=$2", [req.params.id, req.user!.id])).rows[0];
  if (!old) { removeImage(r.url); return res.status(404).json({ error: "Prestation introuvable" }); }
  await db.query("UPDATE services SET photo_url=$3 WHERE id=$1 AND stylist_id=$2", [req.params.id, req.user!.id, r.url]); removeImage(old.photo_url); res.json({ photo_url: r.url });
});
manageRoutes.delete("/services/:id", async (req: AuthReq, res) => {
  const r = await db.query("SELECT photo_url FROM services WHERE id=$1 AND stylist_id=$2", [req.params.id, req.user!.id]);
  await db.query("DELETE FROM services WHERE id=$1 AND stylist_id=$2", [req.params.id, req.user!.id]).catch(() => null); removeImage(r.rows[0]?.photo_url); res.json({ ok: true });
});
manageRoutes.get("/availability", async (req: AuthReq, res) => res.json((await db.query("SELECT weekday,start_time,end_time FROM availability WHERE stylist_id=$1 ORDER BY weekday", [req.user!.id])).rows));
manageRoutes.put("/availability", async (req: AuthReq, res) => {
  const p = z.array(z.object({ weekday: z.number().int().min(0).max(6), start: z.string().regex(/^\d\d:\d\d$/), end: z.string().regex(/^\d\d:\d\d$/) })).max(7).safeParse(req.body);
  if (!p.success || p.data.some(a => a.start >= a.end)) return res.status(400).json({ error: "Horaires invalides" });
  const c = await db.connect();
  try { await c.query("BEGIN"); await c.query("DELETE FROM availability WHERE stylist_id=$1", [req.user!.id]);
    for (const a of p.data) await c.query("INSERT INTO availability VALUES($1,$2,$3,$4)", [req.user!.id, a.weekday, a.start, a.end]);
    await c.query("COMMIT"); res.json({ ok: true }); } catch { await c.query("ROLLBACK"); res.status(500).json({ error: "Erreur" }); } finally { c.release(); }
});
// Photo de couverture (coiffeuses uniquement : les clients n'ont qu'une photo de profil)
manageRoutes.put("/cover", async (req: AuthReq, res) => {
  const r = saveImage(req.body?.dataUrl); if ("error" in r) return res.status(r.status).json({ error: r.error });
  const old = (await db.query("SELECT cover_url FROM stylists WHERE user_id=$1", [req.user!.id])).rows[0]?.cover_url;
  await db.query("UPDATE stylists SET cover_url=$2 WHERE user_id=$1", [req.user!.id, r.url]); removeImage(old); res.json({ cover_url: r.url });
});
manageRoutes.delete("/cover", async (req: AuthReq, res) => {
  const old = (await db.query("SELECT cover_url FROM stylists WHERE user_id=$1", [req.user!.id])).rows[0]?.cover_url;
  await db.query("UPDATE stylists SET cover_url=NULL WHERE user_id=$1", [req.user!.id]); removeImage(old); res.json({ ok: true });
});
// Photos : stockage disque local pour le développement. En production, remplacer par S3/Cloudinary.
manageRoutes.post("/photos", async (req: AuthReq, res) => {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.dataUrl || ""));
  if (!m) return res.status(400).json({ error: "Image PNG, JPEG ou WebP requise" });
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 3_000_000) return res.status(413).json({ error: "Image trop lourde (3 Mo max)" });
  const n = (await db.query("SELECT count(*) FROM photos WHERE stylist_id=$1", [req.user!.id])).rows[0].count;
  if (Number(n) >= 30) return res.status(400).json({ error: "30 photos maximum" });
  const file = `${crypto.randomUUID()}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
  fs.writeFileSync(`uploads/${file}`, buf);
  res.status(201).json((await db.query("INSERT INTO photos(stylist_id,url,caption) VALUES($1,$2,$3) RETURNING id,url,caption", [req.user!.id, publicUrl("/uploads/" + file), String(req.body?.caption || "").slice(0, 100)])).rows[0]);
});
manageRoutes.get("/photos", async (req: AuthReq, res) => res.json((await db.query("SELECT id,url,caption FROM photos WHERE stylist_id=$1 ORDER BY created_at DESC", [req.user!.id])).rows));
manageRoutes.delete("/photos/:id", async (req: AuthReq, res) => {
  const r = await db.query("DELETE FROM photos WHERE id=$1 AND stylist_id=$2 RETURNING url", [req.params.id, req.user!.id]);
  if (r.rowCount) fs.unlink("uploads/" + r.rows[0].url.split("/").pop(), () => {});
  res.json({ ok: true });
});
manageRoutes.get("/revenue", async (req: AuthReq, res) => res.json({ commissionRate: Number(process.env.COMMISSION_RATE || 0.1), months: (await db.query(
  "SELECT to_char(date_trunc('month',starts_at),'YYYY-MM') month, count(*)::int done, sum(total_fcfa)::int gross FROM bookings WHERE stylist_id=$1 AND status='done' GROUP BY 1 ORDER BY 1 DESC LIMIT 12", [req.user!.id])).rows }));

// ---- Demande de certification (badge « Certifié ») : pièce d'identité + selfie facultatif ----
manageRoutes.get("/certification", async (req: AuthReq, res) => {
  const s = (await db.query("SELECT approved,certified FROM stylists WHERE user_id=$1", [req.user!.id])).rows[0];
  const r = (await db.query("SELECT id,doc_type,status,reason,created_at FROM certification_requests WHERE stylist_id=$1 ORDER BY created_at DESC LIMIT 1", [req.user!.id])).rows[0] || null;
  res.json({ approved: !!s?.approved, certified: !!s?.certified, request: r });
});
const certBody = z.object({ docType: z.enum(["cni", "passeport", "permis", "autre"]), doc: z.string().max(4_500_000), selfie: z.string().max(4_500_000).optional() });
manageRoutes.post("/certification", async (req: AuthReq, res) => {
  const p = certBody.safeParse(req.body); if (!p.success) return res.status(400).json({ error: "Type de pièce et photo requis" });
  const s = (await db.query("SELECT approved,certified FROM stylists WHERE user_id=$1", [req.user!.id])).rows[0];
  if (!s?.approved) return res.status(403).json({ error: "Votre profil doit d'abord être validé par l'équipe" });
  if (s.certified) return res.status(409).json({ error: "Votre profil est déjà certifié" });
  if ((await db.query("SELECT 1 FROM certification_requests WHERE stylist_id=$1 AND status='pending'", [req.user!.id])).rowCount) return res.status(409).json({ error: "Une demande est déjà en cours d'examen" });
  const d = savePrivate(p.data.doc); if ("error" in d) return res.status(d.status).json({ error: d.error });
  let sf: string | null = null;
  if (p.data.selfie) { const x = savePrivate(p.data.selfie); if ("error" in x) { removePrivate(d.file); return res.status(x.status).json({ error: x.error }); } sf = x.file; }
  try { await db.query("INSERT INTO certification_requests(stylist_id,doc_type,doc_file,selfie_file) VALUES($1,$2,$3,$4)", [req.user!.id, p.data.docType, d.file, sf]); }
  catch (e) { removePrivate(d.file); removePrivate(sf); throw e; }
  res.status(201).json({ ok: true });
});
manageRoutes.delete("/certification", async (req: AuthReq, res) => {
  const r = await db.query("DELETE FROM certification_requests WHERE stylist_id=$1 AND status='pending' RETURNING doc_file,selfie_file", [req.user!.id]);
  r.rows.forEach(x => { removePrivate(x.doc_file); removePrivate(x.selfie_file); });
  res.json({ ok: true });
});
