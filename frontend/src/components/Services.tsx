import { useEffect, useState } from "react";
import { ask, toast } from "../ui";
import { api, fcfa, toDataUrl } from "../api";
export interface Sv { id: string; name: string; category: string; price_fcfa: number; duration_min: number; description?: string | null; photo_url?: string | null }
// Modification d'une prestation existante (nom, prix, durée, description)
function EditRow({ s, onDone, run }: { s: Sv; onDone: () => void; run: (f: () => Promise<unknown>, ok: string) => Promise<void> }) {
  const [f, setF] = useState({ name: s.name, price: String(s.price_fcfa), dur: String(s.duration_min), desc: s.description || "" });
  const bad = f.name.trim().length < 2 || Number(f.price) < 500 || Number(f.dur) < 15;
  return (<div className="sec"><label className="fl">Nom<input value={f.name} maxLength={80} onChange={e => setF({ ...f, name: e.target.value })} /></label>
    <label className="fl">Prix (FCFA, 500 minimum)<input inputMode="numeric" value={f.price} onChange={e => setF({ ...f, price: e.target.value.replace(/\D/g, "") })} /></label>
    <label className="fl">Durée (minutes, 15 minimum)<input inputMode="numeric" value={f.dur} onChange={e => setF({ ...f, dur: e.target.value.replace(/\D/g, "") })} /></label>
    <label className="fl">Description (facultatif)<textarea rows={2} maxLength={200} value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} /></label>
    <div className="two"><button className="ghost" onClick={onDone}>Annuler</button><button disabled={bad} onClick={() => run(async () => { await api(`/manage/services/${s.id}`, { method: "PATCH", body: JSON.stringify({ name: f.name.trim(), price_fcfa: Number(f.price), duration_min: Number(f.dur), description: f.desc }) }); onDone(); }, "Prestation modifiée")}>Enregistrer</button></div></div>);
}
// Prestations d'un professionnel : liste avec photos + publication d'une nouvelle prestation (avec photo)
export default function Services() {
  const [edit, setEdit] = useState(""); const [svs, setSvs] = useState<Sv[]>([]); const [cats, setCats] = useState<{ id: number; name: string }[]>([]); const [msg, setMsg] = useState("");
  const [n, setN] = useState({ category: "", name: "", price_fcfa: "", duration_min: "120", description: "" }); const [photo, setPhoto] = useState<string | null>(null);
  const load = () => api<Sv[]>("/manage/services").then(setSvs);
  useEffect(() => { load(); api<typeof cats>("/categories").then(setCats); }, []);
  const run = async (f: () => Promise<unknown>, ok: string) => { try { await f(); await load(); toast(ok); } catch (e) { toast((e as Error).message, "err"); } };
  const changePhoto = (id: string, f?: File) => f && run(async () => { await api(`/manage/services/${id}/photo`, { method: "PUT", body: JSON.stringify({ dataUrl: await toDataUrl(f, 640) }) }); await load(); }, "Photo enregistrée");
  const publish = () => run(async () => {
    await api("/manage/services", { method: "POST", body: JSON.stringify({ category: n.category, name: n.name, price_fcfa: Number(n.price_fcfa), duration_min: Number(n.duration_min), description: n.description || undefined, dataUrl: photo || undefined }) });
    setN({ category: "", name: "", price_fcfa: "", duration_min: "120", description: "" }); setPhoto(null); await load();
  }, "Prestation publiée");
  return (<>
    <div className="sec"><h3>Mes prestations ({svs.length})</h3>{svs.length === 0 && <p className="muted">Aucune prestation publiée.</p>}
      {svs.map(s => edit === s.id ? <EditRow key={s.id} s={s} run={run} onDone={() => setEdit("")} /> : <div className="sl" key={s.id}>
        <label className="th" style={s.photo_url ? { backgroundImage: `url(${s.photo_url})` } : undefined} title="Changer la photo">{!s.photo_url && s.category[0]}<input type="file" accept="image/*" className="vh" onChange={e => { changePhoto(s.id, e.target.files?.[0]); e.target.value = ""; }} /></label>
        <div className="b"><b>{s.name}</b><small>{s.category} · {s.duration_min} min</small><small>{fcfa(s.price_fcfa)}</small></div>
        <button className="ghost sm" onClick={() => setEdit(s.id)}>Modifier</button> <button className="ghost sm" onClick={async () => { if (await ask(`Retirer « ${s.name} » ?`, "Retirer")) run(async () => { await api(`/manage/services/${s.id}`, { method: "DELETE" }); await load(); }, "Prestation retirée"); }}>Retirer</button></div>)}
      <p className="muted">Touchez la photo d’une prestation pour la changer.</p></div>
    <div className="sec"><h3>Publier une prestation</h3>
      <label className={"up" + (photo ? " has" : "")} style={photo ? { backgroundImage: `url(${photo})` } : undefined}>
        <input type="file" accept="image/*" className="vh" onChange={async e => { const f = e.target.files?.[0]; if (f) setPhoto(await toDataUrl(f, 640)); e.target.value = ""; }} />{photo ? "Changer la photo" : "Ajouter une photo de la prestation"}</label>
      <label className="fl">Catégorie<select value={n.category} onChange={e => setN({ ...n, category: e.target.value })}><option value="">Choisir…</option>{cats.map(c => <option key={c.id}>{c.name}</option>)}</select></label>
      <label className="fl">Nom de la prestation<input placeholder="ex. Knotless mi-dos" value={n.name} onChange={e => setN({ ...n, name: e.target.value })} /></label>
      <label className="fl">Prix (FCFA)<input inputMode="numeric" value={n.price_fcfa} onChange={e => setN({ ...n, price_fcfa: e.target.value.replace(/\D/g, "") })} /></label>
      <label className="fl">Durée (minutes)<input inputMode="numeric" value={n.duration_min} onChange={e => setN({ ...n, duration_min: e.target.value.replace(/\D/g, "") })} /></label>
      <label className="fl">Description (facultatif)<textarea rows={2} maxLength={200} value={n.description} onChange={e => setN({ ...n, description: e.target.value })} /></label>
      <button disabled={!n.category || n.name.trim().length < 2 || Number(n.price_fcfa) < 500 || Number(n.duration_min) < 15} onClick={publish}>Publier</button></div></>);
}
