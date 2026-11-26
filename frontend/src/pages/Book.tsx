import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { api, fcfa, when } from "../api";
import { toast, Skel } from "../ui";
interface Sv { id: string; name: string; price_fcfa: number; duration_min?: number }
interface Slot { start: string; free: boolean }
interface Pro { home_service: boolean; salon_service: boolean; travel_fee_fcfa: number; accepts_cash: boolean }
const PLACES: [string, string][] = [["home", "Domicile"], ["office", "Bureau"], ["salon", "Salon"]];
export default function Book() {
  const { id } = useParams(); const nav = useNavigate();
  const [svs, setSvs] = useState<Sv[] | null>(null); const [sv, setSv] = useState(useSearchParams()[0].get("service") || ""); const [place, setPlace] = useState("home");
  const [address, setAddress] = useState(""); const [date, setDate] = useState(""); const [slots, setSlots] = useState<Slot[] | null>(null);
  const [pro, setPro] = useState<Pro | null>(null);
  const [slot, setSlot] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { api<Sv[]>(`/stylists/${id}/services`).then(l => { setSvs(l); setSv(v => (l.some(s => s.id === v) ? v : l.length === 1 ? l[0].id : "")); }).catch(e => setErr(e.message));
    api<Pro>(`/stylists/${id}`).then(p => { setPro(p); if (!p.home_service && p.salon_service) setPlace("salon"); }).catch(() => {}); }, [id]);
  useEffect(() => { setSlot(""); setSlots(null); if (sv && date) api<Slot[]>(`/stylists/${id}/slots?date=${date}&serviceId=${sv}`).then(setSlots).catch(e => { setErr(e.message); setSlots([]); }); }, [sv, date, id]);
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + i); return d; });
  const months = [...new Set(days.map(d => d.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" })))].join(" – ");
  const cur = svs?.find(s => s.id === sv); const needAddr = place !== "salon";
  const places = PLACES.filter(([v]) => !pro || (v === "salon" ? pro.salon_service : pro.home_service));
  const fee = needAddr ? pro?.travel_fee_fcfa || 0 : 0; const total = (cur?.price_fcfa || 0) + fee; const deposit = Math.round(total * 0.3);
  const ready = !!(sv && slot && (!needAddr || address.trim()));
  const confirm = async () => {
    setBusy(true); setErr("");
    try { const b = await api<{ id: string }>("/bookings", { method: "POST", body: JSON.stringify({ stylistId: id, serviceId: sv, place, address, startsAt: slot }) }); toast("Demande envoyée. Réglez maintenant l’acompte pour la confirmer."); nav(`/bookings?b=${b.id}&pay=1&new=1`, { replace: true }); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (<main>
    <h3 className="step"><i>1</i> Prestation</h3>
    <div className="svl">{svs === null ? <Skel n={2} /> : svs.length === 0 ? <p className="muted">Aucune prestation publiée.</p> : svs.map(s => <div key={s.id} role="radio" aria-checked={sv === s.id} tabIndex={0} className={"svr" + (sv === s.id ? " on" : "")} onClick={() => setSv(s.id)} onKeyDown={e => e.key === "Enter" && setSv(s.id)}><span><b>{s.name}</b></span><em>{fcfa(s.price_fcfa)}</em></div>)}</div>
    {svs !== null && svs.length === 0 ? <div className="sec"><b>Ce professionnel n’a pas encore publié de prestation</b><div className="muted">Vous pourrez réserver dès qu’il en aura ajouté. Revenez bientôt ou choisissez un autre professionnel.</div></div> : <>
    <h3 className="step"><i>2</i> Lieu</h3>
    <div className="seg">{places.map(([v, l]) => <button key={v} type="button" className={place === v ? "on" : ""} onClick={() => setPlace(v)}>{l}</button>)}</div>
    {needAddr && <input placeholder="Adresse (quartier, repère…)" autoComplete="street-address" value={address} onChange={e => setAddress(e.target.value)} />}
    <h3 className="step"><i>3</i> Date et heure</h3>
    <div className="calw"><div className="mo2">{months}</div><div className="cal">{days.map(d => { const iso = d.toISOString().slice(0, 10);
      return <button type="button" key={iso} aria-pressed={date === iso} className={"cd" + (date === iso ? " on" : "")} onClick={() => setDate(iso)}><small>{d.toLocaleDateString("fr-FR", { weekday: "narrow", timeZone: "UTC" })}</small><b>{d.getUTCDate()}</b></button>; })}</div></div>
    {!sv && <p className="muted">Choisissez d’abord une prestation (étape 1) pour voir les heures.</p>}
    {sv && !date && <p className="muted">Choisissez un jour pour voir les heures disponibles.</p>}
    {sv && date && slots === null && <Skel n={1} />}
    {slots && slots.length === 0 && <p className="muted">Aucune heure disponible ce jour-là. Essayez un autre jour.</p>}
    <div className="slots">{slots?.map(s => <button key={s.start} disabled={!s.free} className={slot === s.start ? "on" : ""} onClick={() => setSlot(s.start)}>{s.start.slice(11, 16)}</button>)}</div>
    {ready && cur && <div className="sec recap"><h3>Récapitulatif</h3>
      <div className="row"><span>Prestation</span><b>{cur.name}</b></div>
      <div className="row"><span>Lieu</span><b>{PLACES.find(p => p[0] === place)![1]}{needAddr && ` · ${address}`}</b></div>
      <div className="row"><span>Date</span><b>{when(slot)}</b></div>
      <div className="row"><span>Prestation</span><b>{fcfa(cur.price_fcfa)}</b></div>
      {fee > 0 && <div className="row"><span>Déplacement</span><b>{fcfa(fee)}</b></div>}
      <div className="row"><span>Total</span><b>{fcfa(total)}</b></div>
      <div className="row"><span>Acompte à payer (30 %)</span><b>{fcfa(deposit)}</b></div>
      <div className="row"><span>Reste à régler au professionnel</span><b>{fcfa(total - deposit)}</b></div>
      <p className="muted">Le professionnel doit accepter votre demande avant la prestation. Vous réglerez l’acompte juste après l’envoi.</p></div>}
</>}
    {err && <p className="err" role="alert">{err}</p>}
    {!(svs !== null && svs.length === 0) && <button disabled={!ready || busy} onClick={confirm}>{busy ? "Envoi…" : ready ? `Envoyer la demande · acompte ${fcfa(deposit)}` : "Envoyer la demande"}</button>}</main>);
}
