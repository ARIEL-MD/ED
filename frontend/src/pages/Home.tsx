import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, fcfa } from "../api";
import { Certified } from "../ui";
interface S { id: string; name: string; avatar_url?: string | null; city: string; district?: string; salon_name?: string | null; certified?: boolean; rating: string; reviews: string; from_price?: number }
const icon = (d: string) => <svg viewBox="0 0 24 24"><path d={d} /></svg>;
const PIN = "M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10zM12 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z", HEART = "M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z", CAL = "M5 6h14v14H5zM5 10h14M9 3v4M15 3v4";
// Icône de catégorie selon son nom (repli : étincelle)
const catIcon = (n: string) => { const k = n.toLowerCase();
  return icon(k.includes("coiff") ? "M6 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM6 15.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM8 8l12 10M8 16L20 6"
    : k.includes("manu") ? "M10 2h4v6h-4zM8 11a2 2 0 012-2h4a2 2 0 012 2v9a2 2 0 01-2 2h-4a2 2 0 01-2-2zM10.5 13v5"
    : k.includes("pédi") || k.includes("pedi") ? "M8 9c0-1.800 1.200-3 3.500-3S15.500 7.500 15.500 9.500c0 3-1.200 4.500-1.200 7.500 0 2.500-1 4.500-3.300 4.500S7.700 19.500 7.700 17c0-3 .3-4.500.3-8zM7.500 3.500a1 1 0 102 0 1 1 0 10-2 0zM11 2.300a1 1 0 102 0 1 1 0 10-2 0zM14.500 3.300a1 1 0 102 0 1 1 0 10-2 0z"
    : k.includes("maqu") ? "M8 21v-6h8v6zM9 15v-3h6v3zM10 12V6l4-3v9"
    : k.includes("tress") || k.includes("tiss") ? "M9 3c3 3-3 6 0 9s-3 6 0 9M15 3c3 3-3 6 0 9s-3 6 0 9"
    : k.includes("barb") ? "M4 6h16v4H4zM6 10v9M10 10v9M14 10v9M18 10v9"
    : k.includes("soin") || k.includes("mass") ? "M12 20c-4-2-6-6-5-11 3 1 5 3 5 6 0-3 2-5 5-6 1 5-1 9-5 11z"
    : "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"); };
const SEARCH = "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.5-4.5", BELL = "M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4";
function Card({ s }: { s: S }) {
  return (<Link className="pcard" to={`/stylist/${s.id}`}><div className="av img" style={s.avatar_url ? { backgroundImage: `url(${s.avatar_url})` } : undefined}>{!s.avatar_url && s.name[0]}</div>
    <div className="pinfo"><b>{s.name}{s.certified && <> <Certified mini /></>}</b><div className="muted">{[s.salon_name, [s.district, s.city].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}{s.from_price ? ` · dès ${fcfa(s.from_price)}` : ""}</div>
      <div className="stars">{Number(s.reviews) > 0 ? <>★ {s.rating} <span>({s.reviews} avis)</span></> : <span className="muted">Nouveau</span>}</div></div><span className="pill">Réserver</span></Link>);
}
export default function Home() {
  const nav = useNavigate();
  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  const [top, setTop] = useState<S[]>([]);
  const [me, setMe] = useState("");
  const [q, setQ] = useState(""); const [found, setFound] = useState<S[] | null>(null);
  useEffect(() => { api<typeof cats>("/categories").then(setCats).catch(() => {}); api<S[]>("/stylists").then(setTop).catch(() => {}); api<{ name: string }>("/me").then(m => setMe((m.name || "").split(" ")[0])).catch(() => {}); }, []);
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
    {found === null && <p className="hi">{me ? `Bonjour ${me} 👋` : "Bienvenue"}</p>}
    {found === null && <div className="quick"><Link to="/explore"><span>{icon(PIN)}</span>Près de moi</Link><Link to="/favorites"><span>{icon(HEART)}</span>Favoris</Link><Link to="/bookings"><span>{icon(CAL)}</span>Mes RDV</Link></div>}
    <h2>Catégories</h2>
    <div className="scroll cats">{cats.map(c => <Link className="cat" key={c.id} to={`/explore?category=${encodeURIComponent(c.name)}`}><span>{catIcon(c.name)}</span>{c.name}</Link>)}</div>
    {found !== null ? <>
      <p className="muted">{found.length} résultat{found.length > 1 ? "s" : ""}</p>
      <div className="cards">{found.map(s => <Card key={s.id} s={s} />)}</div>
      {found.length === 0 && <div className="sec"><b>Aucun résultat</b><div className="muted">Essayez un autre mot, un quartier ou une catégorie.</div></div>}
    </> : <>
      <div className="hs-t"><h2>Les mieux notés</h2><Link to="/explore">Tout voir</Link></div>
      <div className="cards">{top.slice(0, 4).map(s => <Card key={s.id} s={s} />)}</div>
      {top.length > 4 && <><div className="hs-t"><h2>Autres professionnels</h2><Link to="/explore">Tout voir</Link></div><div className="cards">{top.slice(4, 10).map(s => <Card key={s.id} s={s} />)}</div></>}
      {top.length === 0 && <div className="sec"><b>Les premières professionnelles arrivent bientôt</b><div className="muted">Revenez très vite, ou lancez une recherche près de chez vous.</div></div>}
    </>}
  </main>);
}
