import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
export interface Conv { id: string; status: string; starts_at: string; service: string; other_id: string; other_name: string; other_avatar?: string | null;
  last_body?: string | null; last_at?: string | null; last_sender?: string | null; unread: number }
const label: Record<string, string> = { pending: "En attente", accepted: "Acceptée", done: "Terminée" };
export const ago = (iso?: string | null) => {
  if (!iso) return ""; const d = new Date(iso), n = new Date(), day = 86400000;
  if (d.toDateString() === n.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (n.getTime() - d.getTime() < 2 * day && new Date(n.getTime() - day).toDateString() === d.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};
export const Avatar = ({ name, url }: { name: string; url?: string | null }) =>
  <div className="av img" style={url ? { backgroundImage: `url(${url})` } : undefined}>{!url && (name[0] || "")}</div>;
export default function Messages() {
  const [l, setL] = useState<Conv[] | null>(null); const [q, setQ] = useState(""); const [err, setErr] = useState("");
  const load = () => api<Conv[]>("/bookings/conversations").then(setL).catch(e => setErr(e.message));
  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i); }, []);
  const shown = (l || []).filter(c => !q.trim() || (c.other_name + " " + c.service).toLowerCase().includes(q.trim().toLowerCase()));
  return (<main><h2>Messages</h2>
    {l && l.length > 3 && <input type="search" placeholder="Rechercher une conversation" value={q} onChange={e => setQ(e.target.value)} />}
    {err && <p className="err">{err}</p>}{l === null && !err && <p className="muted">Chargement…</p>}
    {l && l.length === 0 && <div className="sec"><b>Aucune conversation</b><div className="muted">Vos échanges avec {localStorage.getItem("role") === "stylist" ? "vos clients" : "les professionnels"} apparaissent ici dès qu’une réservation est demandée.</div></div>}
    {l && l.length > 0 && shown.length === 0 && <p className="muted">Aucun résultat.</p>}
    {shown.map(c => <Link className={"pcard conv" + (c.unread ? " unread" : "")} key={c.id} to={`/chat/${c.id}`}>
      <Avatar name={c.other_name} url={c.other_avatar} />
      <div className="pinfo"><div className="ctop"><b>{c.other_name}</b><span className="muted">{ago(c.last_at)}</span></div>
        <div className="muted">{c.service} · {label[c.status] || c.status}</div>
        <div className={"cl" + (c.unread ? " b" : "")}>{c.last_body ? (c.last_sender !== c.other_id ? "Vous : " : "") + c.last_body : "Écrivez le premier message"}</div></div>
      {c.unread > 0 && <span className="badge">{c.unread}</span>}</Link>)}
  </main>);
}
