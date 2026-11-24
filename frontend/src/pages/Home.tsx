import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, fcfa } from "../api";
import { Certified } from "../ui";
interface S { id: string; name: string; avatar_url?: string | null; city: string; district?: string; certified?: boolean; rating: string; reviews: string; from_price?: number }
const icon = (d: string) => <svg viewBox="0 0 24 24"><path d={d} /></svg>;
const SEARCH = "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.5-4.5", BELL = "M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4";
function Card({ s }: { s: S }) {
  return (<Link className="pcard" to={`/stylist/${s.id}`}><div className="av img" style={s.avatar_url ? { backgroundImage: `url(${s.avatar_url})` } : undefined}>{!s.avatar_url && s.name[0]}</div>
    <div className="pinfo"><b>{s.name}{s.certified && <> <Certified mini /></>}</b><div className="muted">{s.district || s.city}{s.from_price ? ` · dès ${fcfa(s.from_price)}` : ""}</div>
      <div className="stars">{Number(s.reviews) > 0 ? <>★ {s.rating} <span>({s.reviews} avis)</span></> : <span className="muted">Nouveau</span>}</div></div><span className="pill">Réserver</span></Link>);
}
export default function Home() {
  const nav = useNavigate();
  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  const [top, setTop] = useState<S[]>([]);
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
    <h2>Catégories</h2>
    <div className="scroll">{cats.map(c => <Link className="chip" key={c.id} to={`/explore?category=${encodeURIComponent(c.name)}`}>{c.name}</Link>)}</div>
    {found !== null ? <>
      <p className="muted">{found.length} résultat{found.length > 1 ? "s" : ""}</p>
      <div className="cards">{found.map(s => <Card key={s.id} s={s} />)}</div>
      {found.length === 0 && <div className="sec"><b>Aucun résultat</b><div className="muted">Essayez un autre mot, un quartier ou une catégorie.</div></div>}
    </> : <>
      <div className="hs-t"><h2>Les mieux notés</h2><Link to="/explore">Tout voir</Link></div>
      <div className="cards">{top.slice(0, 4).map(s => <Card key={s.id} s={s} />)}</div>
      <Link className="pcard" to="/favorites"><div className="pinfo"><b>Mes favoris</b><div className="muted">Retrouvez les professionnels que vous aimez</div></div><span className="pill">Voir</span></Link>
      <Link className="pcard" to="/explore"><div className="pinfo"><b>Près de moi</b><div className="muted">Trouvez un professionnel disponible dans votre zone</div></div><span className="pill">Voir</span></Link>
    </>}
  </main>);
}
