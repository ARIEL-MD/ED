import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, fcfa } from "../api";
import { Certified } from "../ui";
interface S { id: string; cover_url?: string | null; name: string; avatar_url?: string | null; city: string; district?: string; salon_name?: string | null; certified?: boolean; rating: string; reviews: string; from_price?: number }
const icon = (d: string) => <svg viewBox="0 0 24 24"><path d={d} /></svg>;
const PIN = "M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10zM12 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z", HEART = "M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z", CAL = "M5 6h14v14H5zM5 10h14M9 3v4M15 3v4";
// Icône de catégorie selon son nom (repli : étincelle)
interface Sp { id: string; name: string; category: string; price_fcfa: number; duration_min?: number; photo_url?: string | null; stylist_id: string; stylist_name: string; avatar_url?: string | null; cover_url?: string | null; salon_name?: string | null; city?: string; district?: string }
function Svc({ v }: { v: Sp }) {
  const img = v.photo_url || v.cover_url || v.avatar_url; const place = [v.district, v.city].filter(Boolean).join(", ");
  return (<Link className="svcard" to={`/book/${v.stylist_id}?service=${v.id}`}>
    <div className="sph" style={img ? { backgroundImage: `url(${img})` } : undefined}><span className="rt">{fcfa(v.price_fcfa)}</span></div>
    <div className="sbd"><b>{v.name}</b><span className="muted">{v.salon_name || v.stylist_name}{place ? ` · ${place}` : ""}</span>{v.duration_min ? <span className="muted">{v.duration_min} min</span> : null}</div></Link>);
}
const SEARCH = "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.5-4.5", BELL = "M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4";
function Card({ s }: { s: S }) {
  return (<Link className="pcard" to={`/stylist/${s.id}`}><div className="av img" style={s.avatar_url ? { backgroundImage: `url(${s.avatar_url})` } : undefined}>{!s.avatar_url && s.name[0]}</div>
    <div className="pinfo"><b>{s.name}{s.certified && <> <Certified mini /></>}</b><div className="muted">{[s.salon_name, [s.district, s.city].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}{s.from_price ? ` · dès ${fcfa(s.from_price)}` : ""}</div>
      <div className="stars">{Number(s.reviews) > 0 ? <>★ {s.rating} <span>({s.reviews} avis)</span></> : <span className="muted">Nouveau</span>}</div></div><span className="pill">Réserver</span></Link>);
}
function Salon({ s, onBook }: { s: S; onBook: (s: S) => void }) {
  const img = s.cover_url || s.avatar_url; const place = [s.district, s.city].filter(Boolean).join(", ");
  return (<Link className="salon" to={`/stylist/${s.id}`}>
    <div className="sph" style={img ? { backgroundImage: `url(${img})` } : undefined}>{Number(s.reviews) > 0 ? <span className="rt">★ {s.rating} <small>({s.reviews} avis)</small></span> : <span className="rt new">Nouveau</span>}</div>
    <div className="sbd"><div className="sid"><i className="sav" style={s.avatar_url ? { backgroundImage: `url(${s.avatar_url})` } : undefined}>{!s.avatar_url && s.name[0]}</i>
      <div><b>{s.salon_name || s.name}{s.certified && <> <Certified mini /></>}</b><span className="muted">{place}</span></div></div>
      {s.from_price ? <div className="from">À partir de <b>{fcfa(s.from_price)}</b></div> : <div className="from">&nbsp;</div>}
      <button type="button" className="rbtn" onClick={e => { e.preventDefault(); e.stopPropagation(); onBook(s); }}>Réserver →</button></div></Link>);
}
export default function Home() {
  const nav = useNavigate();
  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  const [top, setTop] = useState<S[]>([]);
  const [cat, setCat] = useState(""); const [prest, setPrest] = useState<Sp[] | null>(null);
  useEffect(() => { setPrest(null); api<Sp[]>(`/services${cat ? `?category=${encodeURIComponent(cat)}` : ""}`).then(setPrest).catch(() => setPrest([])); }, [cat]);
  const [bk, setBk] = useState<S | null>(null); const [svs, setSvs] = useState<{ id: string; name: string; price_fcfa: number; duration_min?: number }[] | null>(null);
  const openBook = (s: S) => { setBk(s); setSvs(null); api<NonNullable<typeof svs>>(`/stylists/${s.id}/services`).then(setSvs).catch(() => setSvs([])); };
  const [q, setQ] = useState(""); const [found, setFound] = useState<S[] | null>(null);
  useEffect(() => { api<typeof cats>("/categories").then(setCats).catch(() => {}); api<S[]>("/stylists").then(setTop).catch(() => {}); }, []);
  // recherche en direct, avec un petit délai pour ne pas interroger le serveur à chaque lettre
  useEffect(() => {
    const t = q.trim(); if (!t) { setFound(null); return; }
    const h = setTimeout(() => api<S[]>(`/stylists?q=${encodeURIComponent(t)}`).then(setFound).catch(() => setFound([])), 250);
    return () => clearTimeout(h);
  }, [q]);
  return (<main>
    <div className="sbar">
      <img className="mark" src="/mark.jpg" alt="Esteti-Ma" />
      <form className={"sbox" + (q ? " has" : "")} role="search" onSubmit={e => { e.preventDefault(); nav(`/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); }}>
        {icon(SEARCH)}<input type="search" enterKeyHint="search" autoComplete="off" aria-label="Rechercher" placeholder="Service, quartier ou nom" value={q} onChange={e => setQ(e.target.value)} />
        <button type="button" aria-label="Effacer" onClick={() => setQ("")}>×</button>
      </form>
      <Link className="sbtn" to="/notifications" aria-label="Notifications">{icon(BELL)}</Link>
    </div>
    {found === null && <div className="quick"><Link to="/explore"><span>{icon(PIN)}</span>Près de moi</Link><Link to="/favorites"><span>{icon(HEART)}</span>Favoris</Link><Link to="/bookings"><span>{icon(CAL)}</span>Mes RDV</Link></div>}
    <h2>Catégories</h2>
    <div className="scroll cats">{[{ id: 0, name: "" }, ...cats].map(c => <button type="button" key={c.id} className={"chipc" + (cat === c.name ? " on" : "")} aria-pressed={cat === c.name} onClick={() => setCat(c.name)}>{c.name || "Toutes"}</button>)}</div>
    {found !== null ? <>
      <p className="muted">{found.length} résultat{found.length > 1 ? "s" : ""}</p>
      <div className="cards">{found.map(s => <Card key={s.id} s={s} />)}</div>
      {found.length === 0 && <div className="sec"><b>Aucun résultat</b><div className="muted">Essayez un autre mot, un quartier ou une catégorie.</div></div>}
    </> : <>
      <div className="hs-t gold"><h2>Prestations</h2><Link to={`/explore${cat ? `?category=${encodeURIComponent(cat)}` : ""}`}>Tout voir →</Link></div>
      {prest === null ? <p className="muted">Chargement…</p> : prest.length === 0 ? <div className="sec"><b>Aucune prestation{cat ? ` en « ${cat} »` : ""} pour le moment</b><div className="muted">Les professionnels publient leurs prestations ici.</div></div> : <div className="salons">{prest.map(v => <Svc key={v.id} v={v} />)}</div>}
      <div className="hs-t gold"><h2>Salons populaires</h2><Link to="/explore">Voir plus →</Link></div>
      <div className="salons">{top.slice(0, 8).map(s => <Salon key={s.id} s={s} onBook={openBook} />)}</div>
      {top.length === 0 && <div className="sec"><b>Les premières professionnelles arrivent bientôt</b><div className="muted">Revenez très vite, ou lancez une recherche près de chez vous.</div></div>}
    </>}
    {bk && <div className="modal" onClick={() => setBk(null)}><div className="sheet" role="dialog" aria-label="Choisir une prestation" onClick={e => e.stopPropagation()}>
      <h3>Que souhaitez-vous réserver ?</h3><div className="muted">{bk.salon_name || bk.name}</div>
      <div className="svl">{svs === null ? <p className="muted">Chargement…</p> : svs.length === 0 ? <p className="muted">Ce professionnel n’a pas encore publié de prestation.</p> : svs.map(v => <button key={v.id} type="button" className="svr" onClick={() => nav(`/book/${bk.id}?service=${v.id}`)}><span><b>{v.name}</b>{v.duration_min ? <small className="muted"> · {v.duration_min} min</small> : null}</span><b>{fcfa(v.price_fcfa)}</b></button>)}</div>
      <Link className="muted" to={`/stylist/${bk.id}`} onClick={() => setBk(null)}>Voir le profil du professionnel</Link>
    </div></div>}
  </main>);
}
