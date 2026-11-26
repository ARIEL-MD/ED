import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./styles.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Stylist from "./pages/Stylist";
import Book from "./pages/Book";
import Bookings from "./pages/Bookings";
import Chat from "./pages/Chat";
import Favorites from "./pages/Favorites";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Manage from "./pages/Manage";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Messages from "./pages/Messages";
import { Conditions, Confidentialite } from "./pages/Legal";
import { api } from "./api";
import { UiHost } from "./ui";
const titles: Record<string, string> = { explore: "Explorer", stylist: "Profil", book: "Réserver", bookings: "Réservations", chat: "Conversation", messages: "Messages", favorites: "Favoris", notifications: "Notifications", profile: "Profil", manage: "Mon activité" };
function Shell({ children }: { children: JSX.Element }) {
  const { pathname } = useLocation(); const nav = useNavigate(); const root = pathname === "/"; const r = localStorage.getItem("role");
  const parts = pathname.split("/").filter(Boolean); const deep = parts.length > 1;
  const title = root ? (r === "admin" ? "Administration" : r === "stylist" ? "Demandes" : "") : titles[parts[0]] || "";
  const back = () => (window.history.state?.idx > 0 ? nav(-1) : nav("/"));
  return (<div className={"app" + (r === "admin" ? " adm" : "")}>{title && <div className="topbar">{(deep || parts[0] === "favorites" || (parts[0] === "notifications" && r === "client")) && <button className="back" aria-label="Retour" onClick={back}>‹</button>}<h1 className="tt">{title}</h1></div>}<div className="body">{children}</div></div>);
}
// Un compte garde son type : un professionnel n'accède pas aux écrans client, et inversement
const Guard = ({ children, only }: { children: JSX.Element; only?: "client" | "stylist" }) =>
  !localStorage.getItem("token") ? <Navigate to="/login" /> : only && localStorage.getItem("role") !== only ? <Navigate to="/" /> : <Shell>{children}</Shell>;
const paths: Record<string, string> = { home: "M4 11l8-7 8 7v9H4z", search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.5-4.5", cal: "M5 5h14v15H5zM5 10h14M9 3v4M15 3v4",
  heart: "M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z", user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6",
  bell: "M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4", grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", chat: "M4 5h16v11H9l-5 4z", shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" };
const role = localStorage.getItem("role");
const home = role === "admin" ? <Admin /> : role === "stylist" ? <Dashboard /> : <Home />;
const tabs: [string, string, string][] = role === "admin" ? [["/", "Admin", "shield"], ["/profile", "Profil", "user"]]
  : role === "stylist" ? [["/", "Demandes", "cal"], ["/messages", "Messages", "chat"], ["/manage", "Activité", "grid"], ["/notifications", "Alertes", "bell"], ["/profile", "Profil", "user"]]
  : [["/", "Accueil", "home"], ["/explore", "Explorer", "search"], ["/bookings", "RDV", "cal"], ["/messages", "Messages", "chat"], ["/profile", "Profil", "user"]];
// Barre du bas : pastille du nombre de messages non lus
function Tabs() {
  const loc = useLocation(); const [n, setN] = useState(0);
  useEffect(() => { let on = true; const f = () => api<{ count: number }>("/bookings/messages/unread").then(r => on && setN(r.count)).catch(() => {}); f(); const i = setInterval(f, 20000); return () => { on = false; clearInterval(i); }; }, [loc.pathname]);
  return (<nav>{tabs.map(([to, l, ic]) => <NavLink key={l} to={to} aria-label={l} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}><svg viewBox="0 0 24 24"><path d={paths[ic]} /></svg><span>{l}</span>{ic === "chat" && n > 0 && <i className="badge">{n > 9 ? "9+" : n}</i>}</NavLink>)}</nav>);
}
createRoot(document.getElementById("root")!).render(
  <StrictMode><BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/conditions" element={<Conditions />} />
      <Route path="/confidentialite" element={<Confidentialite />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/" element={<Guard>{home}</Guard>} />
      <Route path="/explore" element={<Guard only="client"><Explore /></Guard>} />
      <Route path="/stylist/:id" element={<Guard><Stylist /></Guard>} />
      <Route path="/book/:id" element={<Guard only="client"><Book /></Guard>} />
      <Route path="/bookings" element={<Guard only="client"><Bookings /></Guard>} />
      <Route path="/chat/:id" element={<Guard><Chat /></Guard>} />
      <Route path="/messages" element={<Guard><Messages /></Guard>} />
      <Route path="/favorites" element={<Guard only="client"><Favorites /></Guard>} />
      <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
      <Route path="/profile" element={<Guard><Profile /></Guard>} />
      <Route path="/manage" element={<Guard only="stylist"><Manage /></Guard>} />
    </Routes>
    {localStorage.getItem("token") && <Tabs />}
    <UiHost />
  </BrowserRouter></StrictMode>);

// Petit retour tactile sur les boutons et la navigation (si le téléphone le permet)
document.addEventListener("click", e => { if ((e.target as HTMLElement).closest("button, nav a, .quick a, .cat")) navigator.vibrate?.(8); }, { passive: true });
