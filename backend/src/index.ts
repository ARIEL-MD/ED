import express from "express";
import helmet from "helmet";
import cors from "cors";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";
import { db, notify } from "./db";
import { authRoutes } from "./routes/users";
import { discoverRoutes } from "./routes/discover";
import { stylistRoutes } from "./routes/stylists";
import { bookingRoutes } from "./routes/bookings";
import { extraRoutes } from "./routes/extra";
import { paymentRoutes } from "./routes/payments";
import { adminRoutes } from "./routes/admin";
import { admin2Routes } from "./routes/admin2";
import { adminAuthRoutes } from "./routes/adminAuth";
import { meRoutes } from "./routes/me";
import { manageRoutes } from "./routes/manage";
const app = express();
fs.mkdirSync("uploads", { recursive: true });
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: { useDefaults: true, directives: { "img-src": ["'self'", "data:", "blob:", "https:"] } } }));
app.set("trust proxy", 1);   // derrière le proxy de Render
app.use(cors({ origin: (process.env.CORS_ORIGIN || "").split(",").map(x => x.trim()).filter(Boolean) }));
app.use("/api/payments/webhook", express.raw({ type: "*/*" }));   // corps brut pour la signature
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static("uploads"));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120 }));
app.use("/api/manage/certification", rateLimit({ windowMs: 3_600_000, limit: 10 }));   // envoi de pièces : 10 par heure
app.use("/api/auth", authRoutes);
app.use("/api", discoverRoutes);
app.use("/api/stylists", stylistRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/bookings", extraRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/me", meRoutes);
app.use("/api/manage", manageRoutes);
app.use("/api/admin-auth", rateLimit({ windowMs: 15 * 60_000, limit: 10 }), adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", admin2Routes);
app.get("/health", (_q, res) => res.json({ ok: true }));
// Site web : l'application (frontend/dist) est servie par la même adresse que l'API
const WEB = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(WEB)) {
  app.use(express.static(WEB, { index: false, maxAge: "1h" }));
  app.get(/^\/(?!api\/|uploads\/).*/, (_q, res) => res.sendFile(path.join(WEB, "index.html")));
}
app.use((e: Error, _q: express.Request, res: express.Response, _n: express.NextFunction) => { console.error(e); res.status(500).json({ error: "Erreur serveur" }); });
// Rappels : 2 h avant chaque rendez-vous accepté
setInterval(async () => {
  try {
    const r = await db.query("UPDATE bookings SET reminded=true WHERE status='accepted' AND NOT reminded AND starts_at BETWEEN now() AND now()+interval '2 hours' RETURNING id,client_id,stylist_id");
    for (const b of r.rows) { await notify(b.client_id, "reminder", "Rappel : rendez-vous dans moins de 2 h", b.id); await notify(b.stylist_id, "reminder", "Rappel : rendez-vous dans moins de 2 h", b.id); }
  } catch (e) { console.error(e); }
}, 5 * 60_000);
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log("Esteti-Ma API :" + PORT));
