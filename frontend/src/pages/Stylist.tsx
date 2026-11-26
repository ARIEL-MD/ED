import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, fcfa } from "../api";
import { toast, Lightbox, Certified } from "../ui";
interface D { name: string; avatar_url?: string | null; cover_url?: string | null; bio?: string; city: string; district?: string; salon_name?: string | null; home_service: boolean; salon_service: boolean; travel_fee_fcfa: number; certified?: boolean; done_count?: number; member_since?: string; radius_km: number; accepts_cash: boolean;
  photos: { id: string; url: string; caption?: string }[]; services: { id: string; name: string; category: string; price_fcfa: number; duration_min: number; description?: string | null; photo_url?: string | null }[];
  reviews: { rating: number; comment?: string; name: string; created_at: string }[] }
export default function Stylist() {
  const { id } = useParams(); const [d, setD] = useState<D | null>(null); const [fav, setFav] = useState(false); const [err, setErr] = useState(""); const [zoom, setZoom] = useState<number | null>(null);
  useEffect(() => { api<D>(`/stylists/${id}`).then(setD).catch(e => setErr(e.message));
    if (localStorage.getItem("role") === "client") api<{ id: string }[]>("/me/favorites").then(f => setFav(f.some(x => x.id === id))); }, [id]);
  const toggle = async () => { try { await api(`/me/favorites/${id}`, { method: fav ? "DELETE" : "PUT" }); setFav(!fav); toast(fav ? "Retiré des favoris" : "Ajouté aux favoris"); } catch (e) { toast((e as Error).message, "err"); } };
  const share = async () => { const url = location.href; try { if (navigator.share) await navigator.share({ title: d?.name, url }); else { await navigator.clipboard.writeText(url); toast("Lien copié"); } } catch { /* annulé */ } };
  const avg = d?.reviews.length ? (d.reviews.reduce((a, r) => a + r.rating, 0) / d.reviews.length).toFixed(1) : null;
  if (err) return <main><p className="err">{err}</p></main>; if (!d) return <main><div className="skel" /><div className="skel" /></main>;
  return (<main><div className="ph0"><div className="cv" style={d.cover_url ? { backgroundImage: `url(${d.cover_url})` } : undefined} />
      <div className="pr0"><div className="av" style={d.avatar_url ? { backgroundImage: `url(${d.avatar_url})` } : undefined}>{!d.avatar_url && d.name[0]}</div><div className="tx"><h2>{d.name}{d.certified && <> <Certified mini /></>}</h2>{d.salon_name && <div className="muted">{d.salon_name}</div>}{avg && <div className="stars">★ {avg} <span>({d.reviews.length} avis)</span></div>}</div></div>{localStorage.getItem("role") === "client" && <button className={"fav" + (fav ? " on" : "")} aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={fav} onClick={toggle}><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" /></svg></button>}</div>
    <div className="stats"><div><b>{avg ? `★ ${avg}` : "Nouveau"}</b><small>{d.reviews.length} avis</small></div><div><b>{d.done_count || 0}</b><small>prestation{(d.done_count || 0) > 1 ? "s" : ""}</small></div><div><b>{d.radius_km} km</b><small>de zone</small></div></div>
    <div className="trust">{d.certified && <Certified />}{d.home_service && <span className="tb">À domicile</span>}{d.salon_service && <span className="tb">En salon</span>}
      {d.member_since && <span className="tb">Depuis {new Date(d.member_since).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}</span>}</div>
    <div className="loc"><span>{[d.salon_name, [d.district, d.city].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</span><button type="button" className="ghost sm" onClick={share}>Partager</button></div>
    {d.bio && <p>{d.bio}</p>}
    <div className="sec"><h3>Réalisations</h3>{d.photos.length === 0 ? <p className="muted">Pas encore de photos.</p> : <div className="gal">{d.photos.map((p, k) => <img key={p.id} src={p.url} alt={p.caption || "Réalisation"} tabIndex={0} role="button" onClick={() => setZoom(k)} onKeyDown={e => e.key === "Enter" && setZoom(k)} />)}</div>}</div>
    <div className="sec"><h3>Prestations et tarifs</h3>{d.services.map(s => <Link className="sl" key={s.id} to={localStorage.getItem("role") === "client" ? `/book/${id}?service=${s.id}` : "#"} onClick={e => localStorage.getItem("role") !== "client" && e.preventDefault()}><div className="th" style={s.photo_url ? { backgroundImage: `url(${s.photo_url})` } : undefined}>{!s.photo_url && s.category[0]}</div><div className="b"><b>{s.name}</b><small>{s.category} · {s.duration_min} min</small>{s.description && <small>{s.description}</small>}</div><b>{fcfa(s.price_fcfa)}</b></Link>)}
      {d.home_service && <p className="muted">Déplacement à domicile : {fcfa(d.travel_fee_fcfa)}</p>}</div>
    
    <div className="sec"><h3>Avis</h3>{d.reviews.length === 0 && <p className="muted">Aucun avis.</p>}{d.reviews.map((r, i) => <div className="rv" key={i}><div className="rvh"><span className="rva">{(r.name || "?")[0]}</span><span><b>{r.name}</b><br /><span className="stars">{"★".repeat(r.rating)}<span className="off">{"★".repeat(5 - r.rating)}</span></span></span><span className="muted rvd">{new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span></div>{r.comment && <p>{r.comment}</p>}</div>)}</div>
    {localStorage.getItem("role") === "client" && <div className="cta">{d.services.length === 0 ? <button disabled>Aucune prestation publiée pour le moment</button> : <Link to={`/book/${id}`}><button>{d.services.length ? `Réserver · dès ${fcfa(Math.min(...d.services.map(s => s.price_fcfa)))}` : "Réserver"}</button></Link>}</div>}{zoom !== null && <Lightbox items={d.photos} start={zoom} onClose={() => setZoom(null)} />}</main>);
}
