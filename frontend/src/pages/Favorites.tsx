import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fcfa } from "../api";
import { ask, toast, Skel, Empty } from "../ui";
interface F { id: string; name: string; avatar_url?: string | null; city: string; district?: string; from_price?: number }
export default function Favorites() {
  const [l, setL] = useState<F[] | null>(null);
  const load = () => api<F[]>("/me/favorites").then(setL).catch(e => { setL([]); toast(e.message, "err"); });
  useEffect(() => { load(); }, []);
  const remove = async (f: F) => { if (!(await ask(`Retirer ${f.name} de vos favoris ?`, "Retirer"))) return;
    try { await api(`/me/favorites/${f.id}`, { method: "DELETE" }); toast("Retiré des favoris"); load(); } catch (e) { toast((e as Error).message, "err"); } };
  return (<main><h2>Mes favoris</h2>
    {l === null && <Skel n={2} />}
    {l?.length === 0 && <Empty title="Aucun favori" text="Touchez le cœur sur le profil d’un professionnel pour le retrouver ici."><Link to="/explore"><button className="sm">Explorer</button></Link></Empty>}
    {l?.map(f => <div className="pcard" key={f.id}><Link to={`/stylist/${f.id}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, color: "inherit", textDecoration: "none" }}>
      <div className="av img" style={f.avatar_url ? { backgroundImage: `url(${f.avatar_url})` } : undefined}>{!f.avatar_url && f.name[0]}</div>
      <div className="pinfo"><b>{f.name}</b><div className="muted">{f.district || f.city}{f.from_price ? ` · dès ${fcfa(f.from_price)}` : ""}</div></div></Link>
      <button className="ghost sm" onClick={() => remove(f)}>Retirer</button></div>)}</main>);
}
