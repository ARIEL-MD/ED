import { Router } from "express";
import crypto from "crypto";
import { db, notify } from "../db";
import { auth, AuthReq } from "../auth";
export const paymentRoutes = Router();
// Un paiement n'est JAMAIS marqué réussi par le client : seul un webhook signé du prestataire le fait.
// Wave Checkout est branché. Orange Money / MTN MoMo : passer par un agrégateur (ex. CinetPay, PayDunya) -> ajouter un adaptateur ci-dessous.
paymentRoutes.post("/init", auth("client"), async (req: AuthReq, res) => {
  const { bookingId, provider } = req.body || {};
  const b = (await db.query("SELECT b.deposit_fcfa,s.accepts_cash FROM bookings b JOIN stylists s ON s.user_id=b.stylist_id WHERE b.id=$1 AND b.client_id=$2 AND b.status IN('pending','accepted')", [bookingId, req.user!.id])).rows[0];
  if (!b) return res.status(404).json({ error: "Réservation introuvable" });
  if (provider === "cash") return b.accepts_cash ? res.json({ cash: true }) : res.status(400).json({ error: "Ce professionnel n'accepte pas les espèces" });
  if (provider !== "wave") return res.status(501).json({ error: "Ce moyen de paiement n'est pas encore disponible" });
  const key = process.env.WAVE_API_KEY;
  if (!key) return res.status(503).json({ error: "Wave n'est pas configuré" });
  const p = (await db.query("INSERT INTO payments(booking_id,provider,amount_fcfa) VALUES($1,'wave',$2) RETURNING id", [bookingId, b.deposit_fcfa])).rows[0];
  const web = process.env.CORS_ORIGIN || "http://localhost:5173";
  const r = await fetch("https://api.wave.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: String(b.deposit_fcfa), currency: "XOF", client_reference: p.id, success_url: `${web}/bookings?paid=1`, error_url: `${web}/bookings?paid=0` }) });
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok || !d.wave_launch_url) { await db.query("UPDATE payments SET status='failed' WHERE id=$1", [p.id]); return res.status(502).json({ error: "Wave a refusé la demande" }); }
  res.json({ url: d.wave_launch_url });
});
// Signature Wave : en-tête "Wave-Signature: t=<timestamp>,v1=<hmac>" ; HMAC-SHA256(secret, t + corps). À confirmer dans la doc Wave de votre compte.
paymentRoutes.post("/webhook", async (req, res) => {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret) return res.sendStatus(503);
  const h = Object.fromEntries(String(req.headers["wave-signature"] || "").split(",").map(x => x.split("=")));
  const exp = crypto.createHmac("sha256", secret).update(String(h.t) + req.body.toString()).digest("hex");
  const got = String(h.v1 || "");
  if (got.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(exp))) return res.sendStatus(401);
  const ev = JSON.parse(req.body.toString()); const d = ev.data || {};
  if (ev.type === "checkout.session.completed" && d.payment_status === "succeeded") {
    const rate = Number(process.env.COMMISSION_RATE || 0.1);
    const r = await db.query("UPDATE payments SET status='paid',provider_ref=$2,commission_fcfa=round(amount_fcfa*$3) WHERE id=$1 AND status<>'paid' RETURNING booking_id", [d.client_reference, d.id, rate]);
    if (r.rowCount) await notify((await db.query("SELECT client_id FROM bookings WHERE id=$1", [r.rows[0].booking_id])).rows[0].client_id, "paid", "Acompte reçu", r.rows[0].booking_id);
  } else if (ev.type === "checkout.session.payment_failed") await db.query("UPDATE payments SET status='failed' WHERE id=$1 AND status<>'paid'", [d.client_reference]);
  res.sendStatus(200);
});
