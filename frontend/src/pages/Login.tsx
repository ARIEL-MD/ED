import { FormEvent, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
export default function Login() {
  // Accès discret à l'espace administrateur : 5 touches rapides sur le logo
  const nav = useNavigate(); const taps = useRef({ n: 0, t: 0 });
  const secret = () => { const now = Date.now(), k = taps.current; k.n = now - k.t < 1500 ? k.n + 1 : 1; k.t = now; if (k.n >= 5) { k.n = 0; nav("/admin/login"); } };
  const [f, setF] = useState({ name: "", phone: "", password: "", role: "client" });
  const [signup, setSignup] = useState(false); const [show, setShow] = useState(false); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const phoneBad = signup && !!f.phone && !/^\+?\d{8,15}$/.test(f.phone.replace(/\s/g, ""));
  const sc = (f.password.length >= 8 ? 1 : 0) + (f.password.length >= 12 ? 1 : 0) + (/\d/.test(f.password) && /[A-Za-z]/.test(f.password) ? 1 : 0);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (signup && !ok) return setErr("Merci d’accepter les conditions d’utilisation.");
    setBusy(true);
    try {
      const r = await api<{ token: string; role: string }>(signup ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify({ ...f, phone: f.phone.replace(/\s/g, "") }) });
      localStorage.setItem("token", r.token); localStorage.setItem("role", r.role); window.location.href = "/";
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (<main className="auth"><img className="brand" src="/logo.jpg" alt="Esteti-Ma" onClick={secret} /><p className="muted">La beauté et les soins esthétiques à portée de main.</p>
    <form onSubmit={submit}>
      {signup && <div className="roles" role="group" aria-label="Type de compte">{([["client", "Je cherche", "Réservez une prestation près de vous", "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0"], ["stylist", "Je propose", "Recevez des clientes et gérez vos rendez-vous", "M3.5 5a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0zM3.5 19a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0zM8 6.5L21 18M8 17.5L21 6"]] as const).map(([v, t, sub, ic]) =>
        <button type="button" key={v} className={"rc" + (f.role === v ? " on" : "")} aria-pressed={f.role === v} onClick={() => setF({ ...f, role: v })}><svg viewBox="0 0 24 24"><path d={ic} /></svg><b>{t}</b><small>{sub}</small></button>)}</div>}
      {signup && <label className="fl">Nom<input placeholder="Votre nom" autoComplete="name" value={f.name} onChange={set("name")} required /></label>}
      <label className="fl">Téléphone<div className={"pf" + (phoneBad ? " bad" : "")}>{!f.phone.startsWith("+") && <span className="pre">+225</span>}<input placeholder="Votre numéro" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} required /></div>{phoneBad && <small className="err">Numéro invalide (8 à 15 chiffres)</small>}</label>
      <label className="fl" htmlFor="pwd">{signup ? "Mot de passe (8 caractères min.)" : "Mot de passe"}</label><div className="pw"><input id="pwd" placeholder="••••••••" type={show ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 8 : undefined} value={f.password} onChange={set("password")} required />
        <button type="button" onClick={() => setShow(!show)}>{show ? "Masquer" : "Afficher"}</button></div>
      {signup && !!f.password && <div className="meter" aria-live="polite"><div>{[0, 1, 2].map(k => <i key={k} className={k < sc ? "s" + sc : ""} />)}</div><small>{["Trop court", "Faible", "Correct", "Solide"][sc]}</small></div>}
      {signup && <label className="chk"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} /> <span>J’accepte les <Link to="/conditions" target="_blank">conditions d’utilisation</Link> et la <Link to="/confidentialite" target="_blank">politique de confidentialité</Link></span></label>}
      {err && <p className="err" role="alert">{err}</p>}
      <button type="submit" disabled={busy}>{busy ? "Patientez…" : signup ? "Créer mon compte" : "Se connecter"}</button>
    </form>
    <p className="swap"><button type="button" className="linkbtn" onClick={() => { setSignup(!signup); setErr(""); }}>{signup ? "J’ai déjà un compte" : "Créer un compte"}</button></p></main>);
}
