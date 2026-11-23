import { FormEvent, useState } from "react";
import { api } from "../api";
// Adresse /admin/login : non liée depuis l'application des clients et des professionnels.
export default function AdminLogin() {
  const [f, setF] = useState({ phone: "", password: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const r = await api<{ token: string; role: string }>("/admin-auth/login", { method: "POST", body: JSON.stringify(f) });
      localStorage.setItem("token", r.token); localStorage.setItem("role", r.role); window.location.href = "/";
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (<main className="auth"><img className="brand sm" src="/logo.jpg" alt="Esteti-Ma" /><h1>Administration</h1><p className="muted">Espace réservé à l’équipe Esteti-Ma.</p>
    <form onSubmit={submit}>
      <label className="fl">Téléphone<input type="tel" inputMode="tel" autoComplete="username" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} required /></label>
      <label className="fl">Mot de passe<input type="password" autoComplete="current-password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required /></label>
      {err && <p className="err" role="alert">{err}</p>}<button type="submit" disabled={busy}>{busy ? "Patientez…" : "Se connecter"}</button>
    </form></main>);
}
