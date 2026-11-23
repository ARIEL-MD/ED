import { useEffect, useRef, useState } from "react";
// Petits composants partagés : notifications (toast), confirmation, chargement, état vide
const ev = new EventTarget();
export const toast = (text: string, kind: "ok" | "err" = "ok") => ev.dispatchEvent(new CustomEvent("toast", { detail: { text, kind } }));
export const ask = (text: string, yes = "Confirmer") => new Promise<boolean>(res => ev.dispatchEvent(new CustomEvent("ask", { detail: { text, yes, res } })));
export const Skel = ({ n = 3 }: { n?: number }) => <>{[...Array(n)].map((_, i) => <div key={i} className="skel" />)}</>;
export const Empty = ({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) =>
  <div className="empty"><b>{title}</b>{text && <p className="muted">{text}</p>}{children}</div>;
export const Badge = ({ s, label }: { s: string; label: Record<string, string> }) => <span className={"bd " + s}>{label[s] || s}</span>;
export function UiHost() {
  const [ts, setTs] = useState<{ id: number; text: string; kind: string }[]>([]);
  const [q, setQ] = useState<{ text: string; yes: string; res: (v: boolean) => void } | null>(null);
  useEffect(() => {
    let n = 0;
    const t = (e: Event) => { const d = (e as CustomEvent).detail, id = ++n; setTs(x => [...x.slice(-2), { id, ...d }]); setTimeout(() => setTs(x => x.filter(y => y.id !== id)), d.kind === "err" ? 7000 : 3500); };
    const a = (e: Event) => setQ((e as CustomEvent).detail);
    ev.addEventListener("toast", t); ev.addEventListener("ask", a);
    return () => { ev.removeEventListener("toast", t); ev.removeEventListener("ask", a); };
  }, []);
  const close = (v: boolean) => { q?.res(v); setQ(null); };
  return (<>
    <div className="toasts" role="status" aria-live="polite">{ts.map(x => <div key={x.id} className={"toast " + x.kind}>{x.text}</div>)}</div>
    {q && <div className="ovl" onClick={() => close(false)}><div className="dlg" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      <p>{q.text}</p><div className="two"><button className="ghost" onClick={() => close(false)}>Non</button><button onClick={() => close(true)}>{q.yes}</button></div></div></div>}
  </>);
}

// Galerie plein écran : flèches, balayage, Échap
export function Lightbox({ items, start, onClose }: { items: { url: string; caption?: string }[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start); const x0 = useRef(0); const n = items.length;
  const go = (d: number) => setI(k => (k + d + n) % n);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" ? onClose() : e.key === "ArrowLeft" ? go(-1) : e.key === "ArrowRight" && go(1);
    window.addEventListener("keydown", k); const o = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = o; }; }, []);
  return (<div className="lb" role="dialog" aria-modal="true" onClick={onClose} onTouchStart={e => { x0.current = e.touches[0].clientX; }}
    onTouchEnd={e => { const d = e.changedTouches[0].clientX - x0.current; if (Math.abs(d) > 50 && n > 1) go(d < 0 ? 1 : -1); }}>
    <button className="lbx" aria-label="Fermer" onClick={onClose}>×</button>
    <img src={items[i].url} alt={items[i].caption || "Réalisation"} onClick={e => e.stopPropagation()} />
    {n > 1 && <><button className="lbn l" aria-label="Précédente" onClick={e => { e.stopPropagation(); go(-1); }}>‹</button><button className="lbn r" aria-label="Suivante" onClick={e => { e.stopPropagation(); go(1); }}>›</button><div className="lbc">{i + 1} / {n}</div></>}
  </div>);
}

// Badge « Certifié » : accordé par l'équipe ; `mini` = simple coche à côté d'un nom
export const Certified = ({ mini }: { mini?: boolean }) => <span className={mini ? "cert mini" : "tb gold"} title="Professionnel certifié par Esteti-Ma"><svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5" /></svg>{!mini && "Certifié"}<span className="sr">{mini && "Certifié"}</span></span>;
