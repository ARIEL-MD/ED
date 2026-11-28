import { LockIcon } from "./Icons";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, toDataUrl } from "../api";
import { ask, toast, Skel, Certified } from "../ui";
interface St { approved: boolean; certified: boolean; request: { status: string; reason?: string | null; doc_type: string; created_at: string } | null }
const DELAI = "72 heures";
const DOCS: [string, string][] = [["cni", "Carte d’identité"], ["passeport", "Passeport"], ["permis", "Permis"], ["autre", "Autre pièce"]];
// Demande du badge « Certifié » : pièce d'identité (ou pièce prouvant que c'est bien la personne) + selfie facultatif
export default function Certification() {
  const [s, setS] = useState<St | null>(null); const [type, setType] = useState("cni"); const [doc, setDoc] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false);
  const load = () => api<St>("/manage/certification").then(setS).catch(e => toast(e.message, "err"));
  useEffect(() => { load(); }, []);
  const pick = (set: (v: string) => void) => async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    try { set(await toDataUrl(f, 1600)); } catch (x) { toast((x as Error).message, "err"); } };
  const send = async () => { setBusy(true);
    try { await api("/manage/certification", { method: "POST", body: JSON.stringify({ docType: type, doc, selfie: selfie || undefined }) }); setDoc(null); setSelfie(null); setOk(false); toast(`Demande envoyée. Réponse sous ${DELAI}.`); await load(); }
    catch (e) { toast((e as Error).message, "err"); } setBusy(false); };
  const cancel = async () => { if (await ask("Annuler votre demande et supprimer les photos envoyées ?", "Annuler la demande")) { try { await api("/manage/certification", { method: "DELETE" }); toast("Demande annulée"); } catch (e) { toast((e as Error).message, "err"); } load(); } };
  if (!s) return <Skel n={1} />;
  if (s.certified) return <div className="sec"><h3>Certification</h3><p><Certified /></p><p className="muted">Votre profil est certifié : le badge est visible par les clients.</p></div>;
  if (!s.approved) return <div className="lock">La certification sera disponible une fois votre profil validé par l’équipe.</div>;
  if (s.request?.status === "pending") return <div className="sec"><h3>Demande en cours</h3><p className="muted">Envoyée le {new Date(s.request.created_at).toLocaleDateString("fr-FR")}. L’équipe examine votre pièce et vous répond sous {DELAI}. Vous serez notifié(e) de la décision.</p><button className="ghost" onClick={cancel}>Annuler la demande</button></div>;
  return (<div className="sec"><h3>Demander la certification</h3>
    <p className="muted">Le badge <b>Certifié</b> rassure les clients et vous met en avant. Envoyez une photo nette d’une pièce officielle avec votre photo et votre nom, ou d’une autre pièce qui prouve que c’est bien vous.</p>
    {s.request?.status === "rejected" && <p className="err">Dernière demande refusée{s.request.reason ? ` : ${s.request.reason}` : ""}. Vous pouvez en envoyer une nouvelle.</p>}
    <div className="seg">{DOCS.map(([v, l]) => <button key={v} type="button" className={type === v ? "on" : ""} onClick={() => setType(v)}>{l}</button>)}</div>
    <label className={"up" + (doc ? " has" : "")} style={doc ? { backgroundImage: `url(${doc})` } : undefined}><input type="file" accept="image/*" className="vh" onChange={pick(setDoc)} />{doc ? "Changer la photo de la pièce" : "Ajouter la photo de la pièce (obligatoire)"}</label>
    <label className={"up" + (selfie ? " has" : "")} style={selfie ? { backgroundImage: `url(${selfie})` } : undefined}><input type="file" accept="image/*" capture="user" className="vh" onChange={pick(setSelfie)} />{selfie ? "Changer le selfie" : "Selfie en tenant la pièce (facultatif, accélère la vérification)"}</label>
    <p className="muted">Délai de réponse : {DELAI} maximum.</p>
    <div className="lock"><LockIcon /> Votre pièce n’est vue que par l’équipe, jamais par les clients, et elle est supprimée dès la décision.</div>
    <label className="chk"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} /> <span>Je confirme que cette pièce est la mienne et j’autorise Esteti-Ma à la vérifier, comme expliqué dans la <Link to="/confidentialite" target="_blank">politique de confidentialité</Link>.</span></label>
    <button disabled={!doc || !ok || busy} onClick={send}>{busy ? "Envoi…" : "Envoyer ma demande"}</button></div>);
}
