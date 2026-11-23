import fs from "fs";
import crypto from "crypto";
// Adresse publique du serveur (ex. https://esteti-ma-api.onrender.com) : les photos sont lues depuis l'appli Android, donc adresse complète
export const publicUrl = (p: string) => (process.env.PUBLIC_URL || "").replace(/\/$/, "") + p;
// Stockage disque local pour le développement. En production, remplacer par S3/Cloudinary.
export function saveImage(dataUrl: unknown, maxBytes = 3_000_000): { url: string } | { error: string; status: number } {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) return { error: "Image PNG, JPEG ou WebP requise", status: 400 };
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > maxBytes) return { error: "Image trop lourde (3 Mo max)", status: 413 };
  const file = `${crypto.randomUUID()}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
  fs.writeFileSync(`uploads/${file}`, buf);
  return { url: publicUrl("/uploads/" + file) };
}
export const removeImage = (url?: string | null) => { if (url && url.includes("/uploads/")) fs.unlink("uploads/" + url.split("/").pop(), () => {}); };
// Pièces d'identité : dossier PRIVÉ, jamais exposé par express.static ; lues uniquement via la route admin
import path from "path";
export const PRIVATE_DIR = path.resolve("private");
export function savePrivate(dataUrl: unknown, maxBytes = 3_000_000): { file: string } | { error: string; status: number } {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) return { error: "Photo PNG, JPEG ou WebP requise", status: 400 };
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > maxBytes) return { error: "Photo trop lourde (3 Mo max)", status: 413 };
  fs.mkdirSync(PRIVATE_DIR, { recursive: true, mode: 0o700 });
  const file = `${crypto.randomUUID()}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
  fs.writeFileSync(path.join(PRIVATE_DIR, file), buf, { mode: 0o600 });
  return { file };
}
export const removePrivate = (file?: string | null) => { if (file && /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(file)) fs.unlink(path.join(PRIVATE_DIR, file), () => {}); };
