import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
const BUDGETS = ["10000", "25000", "50000"];
import { api, fcfa } from "../api";
import { Certified } from "../ui";
interface S { id: string; name: string; avatar_url?: string | null; city: string; district?: string; certified?: boolean; rating: string; reviews: string; from_price?: number; km?: number }
export default function Explore() {
  const [sp, setSp] = useSearchParams(); const [cats, setCats] = useState<{ id: number; name: string }[]>([]); const [loaded, setLoaded] = useState(false);
  const [list, setList] = useState<S[]>([]); const [district, setDistrict] = useState(""); const [maxPrice, setMax] = useState(""); const [err, setErr] = useState("");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const category = sp.get("category") || ""; const text = sp.get("q") || "";
  useEffect(() => { api<typeof cats>("/categories").then(setCats).catch(() => {}); }, []);
  const pickCat = (n: string) => { const q = new URLSearchParams(sp); if (category === n) q.delete("category"); else q.set("category", n); setSp(q, { replace: true }); };
  useEffect(() => {
    const q = new URLSearchParams(); if (district) q.set("district", district); if (category) q.set("category", category); if (text) q.set("q", text); if (maxPrice) q.set("maxPrice", maxPrice);
    const url = pos ? `/stylists/nearby?lat=${pos.lat}&lng=${pos.lng}&km=15` : `/stylists?${q}`;
    setErr(""); api<S[]>(url).then(l => { setList(l); setLoaded(true); }).catch(e => { setErr(e.message); setLoaded(true); });
  }, [district, maxPrice, category, text, pos]);
  const locate = () => navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }), () => setErr("Position refusée"))
    : setErr("Géolocalisation indisponible");
  return (<main><h2>Explorer</h2>{text && <p className="muted">Recherche : « {text} »</p>}
    <div className="scroll">{cats.map(c => <button type="button" key={c.id} aria-pressed={category === c.name} className={"chip" + (category === c.name ? " on" : "")} onClick={() => pickCat(c.name)}>{c.name}</button>)}</div>
    <button className="ghost" onClick={locate}>Professionnels près de moi</button>{pos && <p className="muted">Résultats triés par distance (15 km autour de vous) ; les autres filtres sont désactivés. <button type="button" className="linkbtn" onClick={() => setPos(null)}>Annuler</button></p>}
    {!pos && <><input placeholder="Quartier (ex. Cocody)" value={district} onChange={e => setDistrict(e.target.value)} />
      <div className="scroll"><span className="muted" style={{ alignSelf: "center" }}>Budget max</span>{BUDGETS.map(b => <button type="button" key={b} aria-pressed={maxPrice === b} className={"chip" + (maxPrice === b ? " on" : "")} onClick={() => setMax(maxPrice === b ? "" : b)}>{fcfa(Number(b))}</button>)}</div></>}
    {err && <p className="err">{err}</p>}{loaded && !err && list.length === 0 && <div className="sec"><b>Aucun professionnel trouvé</b><div className="muted">Essayez une autre catégorie, un autre quartier ou un budget plus large.</div></div>}
    {list.map(s => <Link className="pcard" key={s.id} to={`/stylist/${s.id}`}><div className="av img" style={s.avatar_url ? { backgroundImage: `url(${s.avatar_url})` } : undefined}>{!s.avatar_url && s.name[0]}</div>
      <div className="pinfo"><b>{s.name}{s.certified && <> <Certified mini /></>}</b><div className="muted">{s.district || s.city}{s.km !== undefined && ` · ${s.km.toFixed(1)} km`}{s.from_price ? ` · dès ${fcfa(s.from_price)}` : ""}</div>
        <div className="stars">{Number(s.reviews) > 0 ? <>★ {s.rating} <span>({s.reviews} avis)</span></> : <span className="muted">Nouveau</span>}</div></div><span className="pill">Réserver</span></Link>)}</main>);
}
