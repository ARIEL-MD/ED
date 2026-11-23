import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { Avatar, Conv } from "./Messages";
interface M { id: string; sender_id: string; body: string; created_at: string; read_at?: string | null }
const hm = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const dayLabel = (iso: string) => { const d = new Date(iso), n = new Date(); const y = new Date(n.getTime() - 86400000);
  return d.toDateString() === n.toDateString() ? "Aujourd’hui" : d.toDateString() === y.toDateString() ? "Hier" : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); };
export default function Chat() {
  const { id } = useParams(); const [ms, setMs] = useState<M[]>([]); const [me, setMe] = useState(""); const [conv, setConv] = useState<Conv | null>(null);
  const [t, setT] = useState(""); const [err, setErr] = useState(""); const [ready, setReady] = useState(false); const [sending, setSending] = useState(false); const end = useRef<HTMLDivElement>(null);
  const load = () => api<M[]>(`/bookings/${id}/messages`).then(l => { setMs(l); setReady(true); setErr(""); }).catch(e => { setErr(e.message); setReady(true); });
  useEffect(() => { api<{ id: string }>("/me").then(u => setMe(u.id)); api<Conv[]>("/bookings/conversations").then(l => setConv(l.find(c => c.id === id) || null)).catch(() => {});
    load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [id]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [ms.length]);
  const send = async () => { const body = t.trim(); if (!body || sending) return; setSending(true); try { await api(`/bookings/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) }); setT(""); await load(); } catch (e) { setErr((e as Error).message); } setSending(false); };
  return (<main className="chat">
    {conv && <div className="chead"><Avatar name={conv.other_name} url={conv.other_avatar} /><div><b>{conv.other_name}</b><div className="muted">{conv.service}</div></div></div>}
    {err && <p className="err">{err}</p>}
    {!ready && <div className="skel" />}
    {ready && ms.length === 0 && !err && <p className="muted" style={{ textAlign: "center" }}>Aucun message. Dites bonjour !</p>}
    {ms.map((m, i) => { const mine = m.sender_id === me; const newDay = i === 0 || new Date(ms[i - 1].created_at).toDateString() !== new Date(m.created_at).toDateString(); const lastMine = mine && !ms.slice(i + 1).some(x => x.sender_id === me);
      return (<div key={m.id}>{newDay && <div className="dsep">{dayLabel(m.created_at)}</div>}<div className={"msg" + (mine ? " me" : "")}>{m.body}<small>{hm(m.created_at)}{lastMine && (m.read_at ? " · Lu" : " · Envoyé")}</small></div></div>); })}<div ref={end} />
    <div className="composer"><input placeholder="Écrire un message" maxLength={1000} value={t} onChange={e => setT(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
      <button className="send" aria-label="Envoyer" disabled={!t.trim() || sending} onClick={send}><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-7z" /></svg></button></div>
  </main>);
}
