import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, fcfa, when } from "../api";
import { ask, toast, Skel, Empty } from "../ui";
interface B { id: string; starts_at: string; status: string; total_fcfa: number; service: string; client_name: string; place: string; address?: string }
export default function Dashboard() {
  const [l, setL] = useState<B[] | null>(null); const target = useSearchParams()[0].get("b");
  useEffect(() => { if (l && target) document.getElementById("b-" + target)?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [l, target]);
  const [todo, setTodo] = useState<{ ok: boolean; text: string; to: string }[]>([]); const [approved, setApproved] = useState(true);
  const load = () => api<B[]>("/bookings/mine").then(setL).catch(e => { setL([]); toast(e.message, "err"); });
  useEffect(() => { load();
    Promise.all([api<{ approved: boolean; lat: number | null }>("/manage/profile"), api<unknown[]>("/manage/services"), api<unknown[]>("/manage/availability"), api<{ avatar_url: string | null }>("/me"), api<{ certified: boolean; request: { status: string } | null }>("/manage/certification")])
      .then(([p, s, a, u, c]) => { setApproved(p.approved); setTodo([...(p.approved ? [{ ok: c.certified || c.request?.status === "pending", text: "Demander la certification (badge de confiance)", to: "/manage?tab=certification" }] : []), { ok: !!u.avatar_url, text: "Ajouter une photo de profil", to: "/profile" }, { ok: s.length > 0, text: "Publier une prestation", to: "/manage" }, { ok: a.length > 0, text: "Définir vos disponibilités", to: "/manage" }]); }).catch(() => {}); }, []);
  const act = async (path: string, body: object, ok: string) => { try { await api(path, { method: "PATCH", body: JSON.stringify(body) }); toast(ok); load(); } catch (e) { toast((e as Error).message, "err"); } };
  const refuse = async (id: string) => { if (await ask("Refuser cette demande ?", "Oui, refuser")) act(`/bookings/${id}/respond`, { accept: false }, "Demande refusée"); };
  const byDate = (x: B, y: B) => +new Date(x.starts_at) - +new Date(y.starts_at);
  const p = (l || []).filter(b => b.status === "pending").sort(byDate), a = (l || []).filter(b => b.status === "accepted").sort(byDate); const left = todo.filter(t => !t.ok);
  const day = (d: Date) => d.toISOString().slice(0, 10), today = day(new Date());
  const nToday = (l || []).filter(b => b.status === "accepted" && day(new Date(b.starts_at)) === today).length;
  const wk = (l || []).filter(b => b.status === "done" && +new Date(b.starts_at) > Date.now() - 7 * 864e5).reduce((t, b) => t + b.total_fcfa, 0);
  return (<main><h2>Demandes</h2>
    <div className="stats"><div><b>{nToday}</b><small>RDV aujourd’hui</small></div><div><b>{p.length}</b><small>en attente</small></div><div><b>{wk.toLocaleString("fr-FR")}</b><small>FCFA · 7 jours</small></div></div>
    {!approved && <div className="lock"><b>Profil en attente de validation.</b> L’équipe vérifie votre profil ; vous serez visible dès qu’il est validé.</div>}
    {left.length > 0 && <div className="sec"><h3>Complétez votre profil ({todo.length - left.length}/{todo.length})</h3><div className="bar"><i style={{ width: `${Math.round((todo.length - left.length) / todo.length * 100)}%` }} /></div>{left.map(t => <Link key={t.text} to={t.to} className="row todo"><span>{t.text}</span><span>›</span></Link>)}</div>}
    {l && p.length > 0 && <p className="muted"><b>{p.length}</b> demande{p.length > 1 ? "s" : ""} en attente de votre réponse</p>}
    {l === null && <Skel />}
    {l && p.length === 0 && <Empty title="Aucune nouvelle demande" text="Les demandes de réservation apparaîtront ici." />}
    {p.map(b => <div className={"card" + (b.id === target ? " hl" : "")} id={"b-" + b.id} key={b.id}><b>{b.service} · {b.client_name}</b><div>{when(b.starts_at)} · {fcfa(b.total_fcfa)}</div><div className="muted">{b.place === "salon" ? "Salon" : `${b.place === "office" ? "Bureau" : "Domicile"} : ${b.address}`}</div>
      <div className="two"><button onClick={() => act(`/bookings/${b.id}/respond`, { accept: true }, "Demande acceptée")}>Accepter</button><button className="ghost" onClick={() => refuse(b.id)}>Refuser</button></div>
      <Link to={`/chat/${b.id}`}><button className="ghost mt">Poser une question au client</button></Link></div>)}
    <h2>À venir</h2>{l && a.length === 0 && <Empty title="Aucun rendez-vous accepté" />}
    {a.map(b => <div className={"card" + (b.id === target ? " hl" : "")} id={"b-" + b.id} key={b.id}><b>{b.service} · {b.client_name}</b><div>{when(b.starts_at)}</div>
      <div className="two"><Link to={`/chat/${b.id}`}><button className="ghost">Messages</button></Link>{new Date(b.starts_at) < new Date() && <button onClick={() => act(`/bookings/${b.id}/complete`, {}, "Marquée comme terminée")}>Terminée</button>}</div></div>)}</main>);
}
