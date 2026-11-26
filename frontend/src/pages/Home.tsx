import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, fcfa } from "../api";
import { Certified } from "../ui";
import icCoiffure from "../assets/icons/coiffure.svg";
import icManucure from "../assets/icons/manucure.svg";
import icPedicure from "../assets/icons/pedicure.svg";
import icMaquillage from "../assets/icons/maquillage.svg";
import icCils from "../assets/icons/cils.svg";
interface S { id: string; name: string; avatar_url?: string | null; city: string; district?: string; salon_name?: string | null; certified?: boolean; rating: string; reviews: string; from_price?: number }
const icon = (d: string) => <svg viewBox="0 0 24 24"><path d={d} /></svg>;
const PIN = "M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10zM12 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z", HEART = "M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z", CAL = "M5 6h14v14H5zM5 10h14M9 3v4M15 3v4";
// Icône de catégorie selon son nom (repli : étincelle)
const R = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const };
// Icônes pleines dessinées pour l'appli (une par catégorie)
// Illustrations fournies (SVG) : colorées en bleu par masque CSS
const mask = (u: string) => <i className="cico" style={{ WebkitMaskImage: `url(${u})`, maskImage: `url(${u})` }} />;
const catIcon = (n: string) => { const k = n.toLowerCase();
  if (k.includes("coiff")) return mask(icCoiffure);
  if (k.includes("manu") || k.includes("ongl")) return mask(icManucure);
  if (k.includes("pédi") || k.includes("pedi")) return mask(icPedicure);
  if (k.includes("maqu")) return mask(icMaquillage);
  if (k.includes("cil") || k.includes("sourc") || k.includes("regard")) return mask(icCils);
  const g = k.includes("coiff") ? <><path d="M7.600 8.800L20.500 18.500M7.600 15.200L20.500 5.500" {...R} /><circle cx="5.5" cy="7.5" r="2.7" {...R} /><circle cx="5.5" cy="16.5" r="2.7" {...R} /></>
    : k.includes("manu") || k.includes("ongl") ? <><path d="M9.5 2h5v6h-5z" /><path d="M7 11a2 2 0 012-2h6a2 2 0 012 2v9a2 2 0 01-2 2H9a2 2 0 01-2-2z" /><rect x="9" y="12" width="1.6" height="6.5" rx=".8" fill="#fff" /></>
    : k.includes("pédi") || k.includes("pedi") ? <><rect x="6.5" y="2.5" width="4" height="11" rx="2" /><rect x="13.5" y="2.5" width="4" height="11" rx="2" /><path d="M2.5 13h19c0 4.800-3.200 7.500-7 7.500h-5c-3.800 0-7-2.700-7-7.500z" /><circle cx="12" cy="9" r=".1" /></>
    : k.includes("maqu") ? <><path d="M10 11V6l4-3v8z" /><path d="M8.500 11.500h7v3h-7z" /><path d="M8 15.500h8V21H8z" /></>
    : k.includes("soin") || k.includes("mass") ? <><path d="M12 3.500c2.800 2.700 3.200 6.500 0 11-3.200-4.500-2.800-8.300 0-11z" /><path d="M4.500 8c4.300 0 7.500 2.800 7.500 7.500-4.300 0-7.500-2.800-7.500-7.500zM19.500 8c0 4.700-3.200 7.500-7.500 7.500 0-4.700 3.200-7.500 7.500-7.500z" /><path d="M5 19.500h14" {...R} /></>
    : k.includes("tress") || k.includes("tiss") ? <><path d="M9 3c3.500 3-3.500 6 0 9s-3.500 6 0 9M15 3c3.500 3-3.500 6 0 9s-3.500 6 0 9" {...R} strokeWidth={2.600} /></>
    : k.includes("barb") ? <><path d="M3 9.500l14-6 1.500 3.500-14 6z" /><path d="M5 14l-2 6.500 4-3z" /></>
    : <path d="M12 2l2.400 6.600L21 11l-6.600 2.400L12 20l-2.400-6.600L3 11l6.600-2.400z" />;
  return <svg className="ci" viewBox="0 0 24 24" aria-hidden="true">{g}</svg>; };
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
