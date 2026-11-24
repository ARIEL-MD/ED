import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, fcfa, when } from "../api";
import { ask, toast, Skel, Empty, Badge } from "../ui";
interface B { id: string; starts_at: string; status: string; total_fcfa: number; deposit_fcfa: number; service: string; stylist_name: string; accepts_cash: boolean }
const label: Record<string, string> = { pending: "En attente", accepted: "Acceptée", refused: "Refusée", cancelled: "Annulée", done: "Terminée" };
export default function Bookings() {
  const [rateFor, setRateFor] = useState("");
  const [l, setL] = useState<B[] | null>(null); const [rate, setRate] = useState<Record<string, number>>({}); const [payFor, setPayFor] = useState(""); const sp = useSearchParams()[0]; const target = sp.get("b"); const [rc, setRc] = useState<Record<string, string>>({});
  useEffect(() => { if (l && target) document.getElementById("b-" + target)?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [l, target]);
  const load = () => api<B[]>("/bookings/mine").then(setL).catch(e => { setL([]); toast(e.message, "err"); });
  useEffect(() => { load(); }, []);
  // Juste après une réservation, on ouvre directement le choix du moyen de paiement
  useEffect(() => { if (target && sp.get("pay") === "1") setPayFor(target); }, [target]);
  const run = async (f: () => Promise<unknown>, ok?: string) => { try { await f(); await load(); ok && toast(ok); } catch (e) { toast((e as Error).message, "err"); } };
  const pay = (id: string, provider: string) => run(async () => { const r = await api<{ url?: string; cash?: boolean }>("/payments/init", { method: "POST", body: JSON.stringify({ bookingId: id, provider }) });
    if (r.url) window.location.href = r.url; else if (r.cash) toast("Paiement en espèces à régler directement avec le professionnel."); });
  const cancel = async (id: string) => { if (await ask("Annuler cette réservation ?", "Oui, annuler")) run(() => api(`/bookings/${id}/cancel`, { method: "PATCH" }), "Réservation annulée"); };
  const methods = (b: B): [string, string, boolean][] => [["wave", "Payer avec Wave", true], ...(b.accepts_cash ? [["cash", "Payer en espèces au professionnel", true] as [string, string, boolean]] : [])];
  // Ajout à l'agenda (Google Agenda, s'ouvre dans le navigateur)
  const addToCalendar = (b: B) => { const d = new Date(b.starts_at), e = new Date(+d + 3600_000), f = (x: Date) => x.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${b.service} - ${b.stylist_name}`)}&dates=${f(d)}/${f(e)}`, "_blank"); };
  const STEPS = ["Demandée", "Acceptée", "Terminée"], stepIdx: Record<string, number> = { pending: 0, accepted: 1, done: 2 };
  const up = (x: B, y: B) => +new Date(x.starts_at) - +new Date(y.starts_at);
  const active = (l || []).filter(b => ["pending", "accepted"].includes(b.status)).sort(up), history = (l || []).filter(b => !["pending", "accepted"].includes(b.status)).sort((x, y) => up(y, x));
  const card = (b: B) => (<div className={"card" + (b.id === target ? " hl" : "")} id={"b-" + b.id} key={b.id}><div className="ctop"><b>{b.service}</b><Badge s={b.status} label={label} /></div>
      {b.status in stepIdx && <ol className="steps" aria-label="Avancement">{STEPS.map((t, i) => <li key={t} className={i <= stepIdx[b.status] ? "on" : ""}>{t}</li>)}</ol>}
      <div className="muted">{b.stylist_name}</div><div>{when(b.starts_at)}</div>
      <div className="muted">{fcfa(b.total_fcfa)} · acompte {fcfa(b.deposit_fcfa)}</div>
      {["pending", "accepted"].includes(b.status) && <div className="two"><button onClick={() => setPayFor(payFor === b.id ? "" : b.id)}>Payer l’acompte</button><button className="ghost" onClick={() => cancel(b.id)}>Annuler</button></div>}
      {payFor === b.id && <div className="pay"><div className="muted">Acompte à régler : <b>{fcfa(b.deposit_fcfa)}</b></div>{methods(b).map(([v, n, on]) => <button key={v} className="ghost" disabled={!on} onClick={() => pay(b.id, v)}>{n}</button>)}</div>}
      <Link to={`/chat/${b.id}`}><button className="ghost mt">Messages</button></Link>
      {b.status === "done" && <button className="mt" onClick={() => setRateFor(b.id)}>Noter la prestation</button>}</div>);
  const nb = (l || []).find(x => x.id === target);
  const rb = (l || []).find(x => x.id === rateFor);
  return (<main><h2>Mes réservations</h2>
    {sp.get("new") === "1" && nb && <div className="okbox"><b>Demande envoyée ✓</b><p>{nb.service} avec {nb.stylist_name} · {when(nb.starts_at)}</p><button type="button" className="ghost sm" onClick={() => addToCalendar(nb)}>Ajouter à l’agenda</button></div>}
    {l === null && <Skel />}
    {l?.length === 0 && <Empty title="Aucune réservation" text="Trouvez un professionnel et réservez en quelques secondes."><Link to="/explore"><button className="sm">Explorer</button></Link></Empty>}
    {active.length > 0 && <h3 className="grp">À venir</h3>}{active.map(card)}
    {history.length > 0 && <h3 className="grp">Historique</h3>}{history.map(card)}
    {rb && <div className="modal" onClick={() => setRateFor("")}><div className="sheet" role="dialog" aria-label="Noter la prestation" onClick={e => e.stopPropagation()}><h3>Noter {rb.stylist_name}</h3><div className="muted">{rb.service}</div>
      <div className="rate">{[1, 2, 3, 4, 5].map(n => <button key={n} aria-label={`${n} sur 5`} className={(rate[rb.id] || 0) >= n ? "on" : ""} onClick={() => setRate({ ...rate, [rb.id]: n })}>★</button>)}</div>
      <textarea rows={3} maxLength={1000} placeholder="Votre commentaire (facultatif) : ponctualité, résultat, accueil…" value={rc[rb.id] || ""} onChange={e => setRc({ ...rc, [rb.id]: e.target.value })} />
      <button disabled={!rate[rb.id]} onClick={async () => { await run(() => api(`/bookings/${rb.id}/review`, { method: "POST", body: JSON.stringify({ rating: rate[rb.id], comment: (rc[rb.id] || "").trim() || undefined }) }), "Merci pour votre avis"); setRateFor(""); }}>Envoyer mon avis</button>
      <button className="ghost mt" onClick={() => setRateFor("")}>Plus tard</button></div></div>}</main>);
}
