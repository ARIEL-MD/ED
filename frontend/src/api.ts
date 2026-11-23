// Adresse de l'API : vide en développement (proxy Vite), complète dans l'appli Android (VITE_API_URL)
const BASE = ((import.meta as any).env?.VITE_API_URL || "").replace(/\/$/, "");
export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const r = await fetch(BASE + "/api" + path, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
  const data = await r.json().catch(() => ({}));
  // session expirée : retour à la connexion (sauf pendant la connexion elle-même)
  if (r.status === 401 && token && !path.startsWith("/auth") && !path.startsWith("/admin-auth")) { localStorage.clear(); window.location.href = "/login"; }
  if (!r.ok) throw new Error((data as any).error || "Erreur");
  return data as T;
}
export const fcfa = (n: number) => n.toLocaleString("fr-FR") + " FCFA";
// Réduit une photo avant envoi (JPEG), pour rester sous la limite du serveur
export const toDataUrl = (f: File, max: number) => new Promise<string>((ok, ko) => {
  const r = new FileReader(); r.onerror = () => ko(new Error("Lecture impossible"));
  r.onload = () => { const i = new Image(); i.onerror = () => ko(new Error("Image invalide"));
    i.onload = () => { const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
      c.getContext("2d")!.drawImage(i, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", 0.8)); };
    i.src = r.result as string; };
  r.readAsDataURL(f);
});
// Dates affichées en clair : « mar. 24 nov., 14:00 » (heure UTC, comme avant)
export const when = (iso: string) => new Date(iso).toLocaleString("fr-FR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
// Télécharge un fichier protégé (en-tête d'authentification) et renvoie une adresse temporaire à afficher
export async function blobUrl(path: string): Promise<string> {
  const r = await fetch(BASE + "/api" + path, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
  if (!r.ok) throw new Error("Fichier indisponible");
  return URL.createObjectURL(await r.blob());
}
