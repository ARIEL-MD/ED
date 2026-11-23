import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, toDataUrl } from "../api";
import { ask, toast } from "../ui";
import Services from "../components/Services";
const CAM = "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z";
const Cam = ({ label, cls, onFile, children }: { label: string; cls: string; onFile: (f: File) => void; children?: React.ReactNode }) => (
  <label className={"cam " + cls} aria-label={label}><svg viewBox="0 0 24 24"><path d={CAM} /></svg>{children}
    <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} /></label>);
export default function Profile() {
  const stylist = localStorage.getItem("role") === "stylist";
  const [u, setU] = useState({ name: "", phone: "", avatar_url: null as string | null }); const [cover, setCover] = useState<string | null>(null);
  const [c, setC] = useState(""); const [msg, setMsg] = useState("");
  useEffect(() => { api<typeof u>("/me").then(setU); if (stylist) api<{ cover_url: string | null }>("/manage/profile").then(p => setCover(p.cover_url)).catch(() => {}); }, [stylist]);
  const run = async (f: () => Promise<unknown>, ok: string) => { try { await f(); toast(ok); } catch (e) { toast((e as Error).message, "err"); } };
  const setAvatar = (f: File) => run(async () => { const r = await api<{ avatar_url: string }>("/me/avatar", { method: "PUT", body: JSON.stringify({ dataUrl: await toDataUrl(f, 320) }) }); setU(x => ({ ...x, avatar_url: r.avatar_url })); }, "Photo de profil enregistrée");
  const setCov = (f: File) => run(async () => { const r = await api<{ cover_url: string }>("/manage/cover", { method: "PUT", body: JSON.stringify({ dataUrl: await toDataUrl(f, 900) }) }); setCover(r.cover_url); }, "Photo de couverture enregistrée");
  const delAvatar = () => run(async () => { await api("/me/avatar", { method: "DELETE" }); setU(x => ({ ...x, avatar_url: null })); }, "Photo de profil retirée");
  const delCover = () => run(async () => { await api("/manage/cover", { method: "DELETE" }); setCover(null); }, "Photo de couverture retirée");
  return (<main>
    <div className="ph0">
      {/* la couverture est réservée aux coiffeuses ; les clients n'ont qu'une photo de profil */}
      {stylist && <div className="cv" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>{!cover && "Ajoutez une photo de couverture"}<Cam label="Changer la photo de couverture" cls="c2" onFile={setCov}>Couverture</Cam></div>}
      <div className={"pr0" + (stylist ? "" : " solo")}>
        <div className="av" style={u.avatar_url ? { backgroundImage: `url(${u.avatar_url})` } : undefined}>{!u.avatar_url && (u.name?.[0] || "")}<Cam label="Changer la photo de profil" cls="a" onFile={setAvatar} /></div>
        <div className="tx"><h2>{u.name}</h2><div className="muted">{stylist ? "Professionnel(le)" : "Client"}</div></div>
      </div>
    </div>
    <div style={{ textAlign: "center" }}>{u.avatar_url && <a className="rm" onClick={delAvatar}>Retirer la photo de profil</a>}{stylist && cover && <> &nbsp; <a className="rm" onClick={delCover}>Retirer la couverture</a></>}</div>
    {stylist && <Services />}
    {!stylist && <Link className="pcard" to="/favorites"><div className="pinfo"><b>Mes favoris</b><div className="muted">Les professionnels que vous aimez</div></div><span className="pill">Voir</span></Link>}
    <h2>Mon profil</h2><label className="fl">Nom<input value={u.name} onChange={e => setU({ ...u, name: e.target.value })} /></label><label className="fl">Téléphone<input value={u.phone} disabled /></label><p className="muted">Le numéro de téléphone ne peut pas être modifié.</p>
    <button onClick={() => run(() => api("/me", { method: "PATCH", body: JSON.stringify({ name: u.name }) }), "Profil enregistré")}>Enregistrer</button>
    <div className="sec"><h3>Faire une réclamation</h3><textarea rows={3} value={c} onChange={e => setC(e.target.value)} placeholder="Décrivez le problème" />
      <p></p><button className="ghost" onClick={() => run(async () => { await api("/me/complaints", { method: "POST", body: JSON.stringify({ body: c }) }); setC(""); }, "Réclamation envoyée")}>Envoyer</button></div>
    <div className="sec"><h3>Informations légales</h3><Link className="row todo" to="/conditions"><span>Conditions d’utilisation</span><span>›</span></Link><Link className="row todo" to="/confidentialite"><span>Politique de confidentialité</span><span>›</span></Link></div>
    <button className="ghost" onClick={async () => { if (await ask("Se déconnecter ?", "Se déconnecter")) { localStorage.clear(); window.location.href = "/login"; } }}>Se déconnecter</button></main>);
}
