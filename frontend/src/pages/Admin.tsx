import { useEffect, useState } from "react";
import { api, fcfa, blobUrl } from "../api";
import { ask, toast, Lightbox, Empty } from "../ui";
type R = Record<string, any>;
const ST: Record<string, string> = { pending: "En attente", accepted: "Acceptée", refused: "Refusée", cancelled: "Annulée", done: "Terminée", open: "Ouverte", closed: "Clôturée", paid: "Payé", failed: "Échoué" };
const TAB: Record<string, string> = { stats: "Statistiques", certifications: "Certifications", comptes: "Comptes", réservations: "Réservations", paiements: "Paiements", commissions: "Commissions", catégories: "Catégories", réclamations: "Réclamations" };
const CNT: Record<string, string> = { certifications: "certifications", réclamations: "complaints" };
const ROLE: Record<string, string> = { client: "Client", stylist: "Professionnel", admin: "Admin" };
const PROV: Record<string, string> = { wave: "Wave", cash: "Espèces", orange_money: "Orange Money", mtn_momo: "MTN MoMo" };
const DOC: Record<string, string> = { cni: "Carte d’identité", passeport: "Passeport", permis: "Permis", autre: "Autre pièce" };
// Examen d'une demande de certification : pièces chargées à la demande, jamais en cache, supprimées après décision
function CertCard({ r, act }: { r: R; act: (path: string, body: object) => Promise<void> }) {
  const [view, setView] = useState<string | null>(null); const [rej, setRej] = useState(false); const [reason, setReason] = useState("");
  const open = async (kind: string) => { try { setView(await blobUrl(`/admin/certifications/${r.id}/file/${kind}`)); } catch (e) { toast((e as Error).message, "err"); } };
  const close = () => { if (view) URL.revokeObjectURL(view); setView(null); };
  const approve = async () => { if (await ask(`Certifier ${r.name} ? Vérifiez que le nom et la photo correspondent bien à la pièce.`, "Certifier")) act(`/admin/certifications/${r.id}`, { approve: true }); };
  return (<div className="card"><b>{r.name}</b> · {r.city}<div className="muted">{r.phone} · {DOC[r.doc_type] || r.doc_type} · {new Date(r.created_at).toLocaleDateString("fr-FR")}</div>
    <div className="two"><button className="ghost" onClick={() => open("doc")}>Voir la pièce</button>{r.has_selfie ? <button className="ghost" onClick={() => open("selfie")}>Voir le selfie</button> : <span className="muted">Pas de selfie</span>}</div>
    {rej ? <><textarea rows={2} maxLength={200} placeholder="Motif du refus (visible par le professionnel)" value={reason} onChange={e => setReason(e.target.value)} />
      <div className="two"><button className="ghost" onClick={() => setRej(false)}>Retour</button><button disabled={!reason.trim()} onClick={() => act(`/admin/certifications/${r.id}`, { approve: false, reason })}>Confirmer le refus</button></div></>
      : <div className="two"><button onClick={approve}>Certifier</button><button className="ghost" onClick={() => setRej(true)}>Refuser</button></div>}
    {view && <Lightbox items={[{ url: view }]} start={0} onClose={close} />}</div>);
}
export default function Admin() {
  const [tab, setTab] = useState("stats"); const [rows, setRows] = useState<R[]>([]); const [stats, setStats] = useState<R | null>(null); const [cat, setCat] = useState(""); const [err, setErr] = useState(""); const [q, setQ] = useState(""); const [fl, setFl] = useState(""); const [counts, setCounts] = useState<R>({});
  const paths: R = { certifications: "/admin/certifications", comptes: "/admin/users", réservations: "/admin/bookings", paiements: "/admin/payments", commissions: "/admin/commissions", catégories: "/admin/categories", réclamations: "/admin/complaints" };
  const load = () => { setErr(""); api<R>("/admin/stats").then(setCounts).catch(() => {}); if (tab === "stats") api<R>("/admin/stats").then(setStats).catch(e => setErr(e.message)); else api<R[]>(paths[tab]).then(setRows).catch(e => setErr(e.message)); };
  useEffect(() => { setRows([]); setQ(""); setFl(""); load(); }, [tab]);
  const FL: Record<string, [string, string][]> = { comptes: [["client", "Clients"], ["stylist", "Professionnels"], ["certified", "Certifiés"], ["suspended", "Suspendus"]], réservations: ["pending", "accepted", "done", "cancelled", "refused"].map(k => [k, ST[k]]), paiements: ["paid", "pending", "failed"].map(k => [k, ST[k]]), réclamations: [["open", "Ouvertes"], ["closed", "Clôturées"]] };
  const shown = rows.filter(r => (!q.trim() || Object.values(r).join(" ").toLowerCase().includes(q.trim().toLowerCase())) && (!fl || (fl === "suspended" ? r.suspended : fl === "certified" ? r.certified : r.role === fl || r.status === fl)));
  const act = async (path: string, body: object) => { try { await api(path, { method: "PATCH", body: JSON.stringify(body) }); load(); } catch (e) { setErr((e as Error).message); } };
  return (<main><h2>Administration</h2><div className="scroll">{["stats", ...Object.keys(paths)].map(t => <button key={t} aria-pressed={tab === t} className={"chip" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{TAB[t]}{Number(counts[CNT[t]]) > 0 && <i className="badge2">{counts[CNT[t]]}</i>}</button>)}</div>{err && <p className="err">{err}</p>}
    {!["stats", "catégories"].includes(tab) && <><input type="search" placeholder="Rechercher…" aria-label="Rechercher" value={q} onChange={e => setQ(e.target.value)} />
      {FL[tab] && <div className="scroll">{[["", "Tous"] as [string, string], ...FL[tab]].map(([k, n]) => <button key={k} className={"chip" + (fl === k ? " on" : "")} onClick={() => setFl(k)}>{n}</button>)}</div>}
      <p className="muted">{shown.length} résultat{shown.length > 1 ? "s" : ""}</p></>}
    {tab === "stats" && stats && <div className="sec">{[["Clients", stats.clients], ["Professionnels validés", stats.stylists], ["Réservations", stats.bookings], ["Certifications à examiner", stats.certifications], ["Commissions", fcfa(Number(stats.commissions))]].map(([k, v]) => <div className="row" key={k}><span>{k}</span><b>{v}</b></div>)}</div>}
    {tab === "certifications" && (rows.length === 0 ? <Empty title="Aucune demande en attente" /> : shown.map(r => <CertCard key={r.id} r={r} act={act} />))}
    {tab === "comptes" && shown.map(r => <div className="row" key={r.id}><span>{r.name}{r.certified && " ✓"}<div className="muted">{ROLE[r.role] || r.role}{r.certified && " · certifié"}{r.suspended && " · suspendu"} · {r.phone}</div></span><span className="acts">{r.role === "stylist" && r.certified && <button className="sm" onClick={async () => { if (await ask(`Retirer la certification de ${r.name} ?`, "Retirer")) act(`/admin/stylists/${r.id}/certify`, { certified: false }); }}>Décertifier</button>}{r.role !== "admin" && <button className="sm ghost" onClick={async () => { if (r.suspended || await ask(`Suspendre ${r.name} ? Cette personne ne pourra plus se connecter.`, "Suspendre")) act(`/admin/users/${r.id}/suspend`, { suspended: !r.suspended }); }}>{r.suspended ? "Réactiver" : "Suspendre"}</button>}</span></div>)}
    {tab === "réservations" && shown.map(r => <div className="row" key={r.id}><span>{r.client} → {r.stylist}<div className="muted">{new Date(r.starts_at).toLocaleString("fr-FR", { timeZone: "UTC" })}</div></span><span>{ST[r.status] || r.status}<div className="muted">{fcfa(r.total_fcfa)}</div></span></div>)}
    {tab === "paiements" && shown.map(r => <div className="row" key={r.id}><span>{PROV[r.provider] || r.provider} · {ST[r.status] || r.status}</span><span>{fcfa(r.amount_fcfa)}<div className="muted">commission {fcfa(r.commission_fcfa)}</div></span></div>)}
    {tab === "commissions" && shown.map(r => <div className="row" key={r.day}><span>{r.day}</span><span>{fcfa(r.commission)}<div className="muted">volume {fcfa(r.volume)}</div></span></div>)}
    {tab === "catégories" && <><div className="sec">{rows.map(r => <div className="row" key={r.id}><span>{r.name}{!r.active && <span className="muted"> · masquée</span>}</span><button className="sm ghost" onClick={async () => { if (!r.active || await ask(`Masquer la catégorie « ${r.name} » ? Elle n’apparaîtra plus aux clients ni dans les nouvelles prestations.`, "Masquer")) act(`/admin/categories/${r.id}`, { active: !r.active }); }}>{r.active ? "Masquer" : "Réactiver"}</button></div>)}</div>
      <input placeholder="Nouvelle catégorie" value={cat} onChange={e => setCat(e.target.value)} /><button onClick={async () => { try { await api("/admin/categories", { method: "POST", body: JSON.stringify({ name: cat }) }); setCat(""); load(); } catch (e) { setErr((e as Error).message); } }}>Ajouter</button></>}
    {tab === "réclamations" && shown.map(r => <div className="card" key={r.id}><b>{r.author}</b> · {ROLE[r.role] || r.role} · {ST[r.status] || r.status}<div className="muted">{r.phone} · {new Date(r.created_at).toLocaleDateString("fr-FR")}{r.booking_id && " · liée à une réservation"}</div><p>{r.body}</p>{r.status === "open" && <button className="sm" onClick={() => act(`/admin/complaints/${r.id}`, {})}>Clore</button>}</div>)}</main>);
}
