import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Skel, Empty } from "../ui";
interface N { id: string; kind: string; body: string; booking_id?: string | null; read: boolean; created_at: string }
const ICON: Record<string, string> = { new_request: "\u{1F4C5}", accepted: "\u2705", refused: "\u274C", cancelled: "\u{1F6AB}", reminder: "\u23F0", certified: "\u{1F3C5}", cert_rejected: "\u274C", paid: "\u{1F4B3}", message: "\u{1F4AC}", review: "\u2B50", done: "\u2728" };
// Destination selon le type de notification et le rôle ; la réservation concernée est mise en évidence
const dest = (n: N) => { if (n.kind === "certified" || n.kind === "cert_rejected") return "/manage?tab=certification"; if (n.kind === "message" && n.booking_id) return `/chat/${n.booking_id}`; const stylist = localStorage.getItem("role") === "stylist"; const q = n.booking_id ? `?b=${n.booking_id}` : "";
  return stylist ? `/${q}` : `/bookings${q}`; };
const ago = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); if (m < 1) return "À l’instant"; if (m < 60) return `Il y a ${m} min`; if (m < 1440) return `Il y a ${Math.round(m / 60)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); };
export default function Notifications() {
  const [l, setL] = useState<N[] | null>(null);
  useEffect(() => { api<N[]>("/me/notifications").then(setL).catch(() => setL([])); }, []);
  return (<main><h2>Notifications</h2>{l === null && <Skel />}{l?.length === 0 && <Empty title="Rien pour le moment" text="Vos alertes de réservation apparaîtront ici." />}
    {l?.map(n => <Link key={n.id} to={dest(n)} className={"card notif" + (n.read ? "" : " unread")}><span className="ni" aria-hidden>{ICON[n.kind] || "\u{1F514}"}</span>
      <span className="nb"><b>{n.body}</b><span className="muted">{ago(n.created_at)}</span></span><span className="muted">›</span></Link>)}
    {l?.some(n => !n.read) && <button onClick={async () => { await api("/me/notifications/read", { method: "POST" }); setL(l.map(n => ({ ...n, read: true }))); }}>Tout marquer comme lu</button>}</main>);
}
