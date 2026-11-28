import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, fcfa } from "../api";
import Certification from "../components/Certification";
import { ask, toast } from "../ui";
import Services from "../components/Services";
const TABS: [string, string][] = [["prestations", "Prestations"], ["disponibilités", "Disponibilités"], ["photos", "Photos"], ["profil", "Profil pro"], ["certification", "Certification"], ["revenus", "Revenus"]];
const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
interface Sv { id: string; name: string; category: string; price_fcfa: number; duration_min: number }
interface P { bio?: string; city: string; district?: string; salon_name?: string | null; home_service: boolean; salon_service: boolean; travel_fee_fcfa: number; lat: number | null; lng: number | null; radius_km: number; accepts_cash: boolean; approved: boolean }
export default function Manage() {
  const [tab, setTab] = useState(useSearchParams()[0].get("tab") || "prestations"); const [msg, setMsg] = useState("");
  const [svs, setSvs] = useState<Sv[]>([]); const [cats, setCats] = useState<{ id: number; name: string }[]>([]); const [nsv, setNsv] = useState({ category: "", name: "", price_fcfa: "", duration_min: "120" });
  const [av, setAv] = useState<{ on: boolean; start: string; end: string }[]>(days.map(() => ({ on: false, start: "08:00", end: "18:00" })));
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]); const [pf, setPf] = useState<P | null>(null);
  const [rev, setRev] = useState<{ commissionRate: number; months: { month: string; done: number; gross: number }[] } | null>(null);
  const run = async (f: () => Promise<unknown>, ok = "Enregistré") => { try { await f(); toast(ok); } catch (e) { toast((e as Error).message, "err"); } };
  const loadSv = () => api<Sv[]>("/manage/services").then(setSvs);
  const loadPh = () => api<typeof photos>("/manage/photos").then(setPhotos);
  useEffect(() => { loadSv(); loadPh(); api<typeof cats>("/categories").then(setCats); api<P>("/manage/profile").then(setPf); api<typeof rev>("/manage/revenue").then(setRev);
    api<{ weekday: number; start_time: string; end_time: string }[]>("/manage/availability").then(rows => setAv(days.map((_, i) => { const r = rows.find(x => x.weekday === i); return r ? { on: true, start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5) } : { on: false, start: "08:00", end: "18:00" }; }))); }, []);
  const upload = (f?: File) => { if (!f) return; const r = new FileReader(); r.onload = () => run(async () => { await api("/manage/photos", { method: "POST", body: JSON.stringify({ dataUrl: r.result }) }); loadPh(); }, "Photo ajoutée"); r.readAsDataURL(f); };
  const locate = () => navigator.geolocation?.getCurrentPosition(p => pf && setPf({ ...pf, lat: p.coords.latitude, lng: p.coords.longitude }), () => setMsg("Position refusée"));
  return (<main><h2>Mon activité</h2>{pf && !pf.approved && <p className="err">Votre profil est en attente de validation par l’équipe Esteti-Ma.</p>}
    <div className="chips">{TABS.map(([t, l]) => <button key={t} aria-pressed={tab === t} className={"chip" + (tab === t ? " on" : "")} onClick={() => { setTab(t); setMsg(""); }}>{l}</button>)}</div>{msg && <p>{msg}</p>}
    {tab === "prestations" && <Services />}
    {tab === "certification" && <Certification />}
    {tab === "disponibilités" && <div className="sec"><p className="muted">Les clients ne peuvent réserver que sur les jours et horaires cochés.</p>{av.map((d, i) => <div className="row" key={i}><label><input type="checkbox" style={{ width: "auto" }} checked={d.on} onChange={e => setAv(av.map((x, j) => j === i ? { ...x, on: e.target.checked } : x))} /> {days[i]}</label>
      {d.on ? <span><input type="time" className="tm" value={d.start} onChange={e => setAv(av.map((x, j) => j === i ? { ...x, start: e.target.value } : x))} /> <input type="time" className="tm" value={d.end} onChange={e => setAv(av.map((x, j) => j === i ? { ...x, end: e.target.value } : x))} /></span> : <span className="muted">Repos</span>}</div>)}
      <p></p><button onClick={() => { const bad = av.find(d => d.on && d.end <= d.start); if (bad) return toast("L’heure de fin doit être après l’heure de début.", "err"); run(() => api("/manage/availability", { method: "PUT", body: JSON.stringify(av.map((d, i) => d.on ? { weekday: i, start: d.start, end: d.end } : null).filter(Boolean)) })); }}>Enregistrer</button></div>}
    {tab === "photos" && <div className="sec"><p className="muted">Montrez vos plus belles réalisations : les profils avec photos reçoivent plus de demandes.</p><label className="upl">+ Ajouter une photo<input type="file" className="vh" accept="image/png,image/jpeg,image/webp" onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }} /></label>{photos.length === 0 && <p className="muted">Aucune photo pour le moment.</p>}<div className="gal">{photos.map(p => <div key={p.id}><img src={p.url} alt="Réalisation" />
      <button className="ghost sm" onClick={async () => { if (await ask("Supprimer cette photo ?", "Supprimer")) run(async () => { await api(`/manage/photos/${p.id}`, { method: "DELETE" }); loadPh(); }, "Photo supprimée"); }}>Supprimer</button></div>)}</div></div>}
    {tab === "profil" && pf && <div className="sec"><label className="fl">Présentation<textarea rows={3} placeholder="Votre parcours, votre style, vos spécialités…" value={pf.bio || ""} onChange={e => setPf({ ...pf, bio: e.target.value })} /></label>
      <label className="fl">Nom du salon (facultatif)<input placeholder="Ex. Salon Belle Étoile" value={pf.salon_name || ""} onChange={e => setPf({ ...pf, salon_name: e.target.value })} maxLength={120} /></label><label className="fl">Ville<input placeholder="Ville" value={pf.city} onChange={e => setPf({ ...pf, city: e.target.value })} /></label><label className="fl">Quartier<input placeholder="Quartier" value={pf.district || ""} onChange={e => setPf({ ...pf, district: e.target.value })} /></label>
      <label><input type="checkbox" style={{ width: "auto" }} checked={pf.home_service} onChange={e => setPf({ ...pf, home_service: e.target.checked })} /> À domicile</label><br />
      <label><input type="checkbox" style={{ width: "auto" }} checked={pf.salon_service} onChange={e => setPf({ ...pf, salon_service: e.target.checked })} /> En salon</label><br />
      <label><input type="checkbox" style={{ width: "auto" }} checked={pf.accepts_cash} onChange={e => setPf({ ...pf, accepts_cash: e.target.checked })} /> J’accepte les espèces</label>
      <label className="fl">Frais de déplacement (FCFA)<input placeholder="0" inputMode="numeric" value={pf.travel_fee_fcfa} onChange={e => setPf({ ...pf, travel_fee_fcfa: Number(e.target.value.replace(/\D/g, "")) })} /></label>
      <label className="fl">Rayon d’intervention (km)<input placeholder="10" inputMode="numeric" value={pf.radius_km} onChange={e => setPf({ ...pf, radius_km: Number(e.target.value.replace(/\D/g, "")) || 1 })} /></label>
      <button className="ghost" onClick={locate}>{pf.lat ? "Position enregistrée · mettre à jour" : "Utiliser ma position"}</button><p></p>
      <button onClick={() => run(() => api("/manage/profile", { method: "PATCH", body: JSON.stringify(pf) }))}>Enregistrer</button></div>}
    {tab === "revenus" && rev && <div className="sec"><h3>Revenus (prestations terminées)</h3>{rev.months.length === 0 && <p className="muted">Aucune prestation terminée.</p>}
      {rev.months.map(m => <div className="row" key={m.month}><span>{m.month} · {m.done} prestation(s)</span><span><b>{fcfa(m.gross)}</b><div className="muted">commission {Math.round(rev.commissionRate * 100)} % : {fcfa(Math.round(m.gross * rev.commissionRate))}</div></span></div>)}</div>}</main>);
}
