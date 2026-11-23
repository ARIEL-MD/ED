import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
export default function Login() {
  const [f, setF] = useState({ name: "", phone: "", password: "", role: "client" });
  const [signup, setSignup] = useState(false); const [show, setShow] = useState(false); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (signup && !ok) return setErr("Merci d’accepter les conditions d’utilisation.");
    setBusy(true);
    try {
      const r = await api<{ token: string; role: string }>(signup ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify(f) });
      localStorage.setItem("token", r.token); localStorage.setItem("role", r.role); window.location.href = "/";
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (<main className="auth"><h1 className="wordmark">Esteti-Ma</h1><p className="muted">La beauté et les soins esthétiques à portée de main.</p>
    <form onSubmit={submit}>
      {signup && <div className="seg" role="group" aria-label="Type de compte">{[["client", "Je cherche un professionnel"], ["stylist", "Je suis professionnel(le)"]].map(([v, l]) =>
        <button type="button" key={v} className={f.role === v ? "on" : ""} onClick={() => setF({ ...f, role: v })}>{l}</button>)}</div>}
      {signup && <label className="fl">Nom<input placeholder="Votre nom" autoComplete="name" value={f.name} onChange={set("name")} required /></label>}
      <label className="fl">Téléphone<input placeholder="Votre numéro" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} required /></label>
      <label className="fl" htmlFor="pwd">{signup ? "Mot de passe (8 caractères min.)" : "Mot de passe"}</label><div className="pw"><input id="pwd" placeholder="••••••••" type={show ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 8 : undefined} value={f.password} onChange={set("password")} required />
        <button type="button" onClick={() => setShow(!show)}>{show ? "Masquer" : "Afficher"}</button></div>
      {signup && <label className="chk"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} /> <span>J’accepte les <Link to="/conditions" target="_blank">conditions d’utilisation</Link> et la <Link to="/confidentialite" target="_blank">politique de confidentialité</Link></span></label>}
      {err && <p className="err" role="alert">{err}</p>}
      <button type="submit" disabled={busy}>{busy ? "Patientez…" : signup ? "Créer mon compte" : "Se connecter"}</button>
    </form>
    <p className="swap"><button type="button" className="linkbtn" onClick={() => { setSignup(!signup); setErr(""); }}>{signup ? "J’ai déjà un compte" : "Créer un compte"}</button></p></main>);
}
