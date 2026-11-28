// Icônes en trait (même famille que le reste de l'appli)
const P = { viewBox: "0 0 24 24", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
export const PinIcon = () => <svg className="ico" {...P}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.400-6.500 11-6.500 11z" /><circle cx="12" cy="10" r="2.300" /></svg>;
export const LockIcon = () => <svg className="ico" {...P}><rect x="5" y="10.500" width="14" height="9.500" rx="2" /><path d="M8.500 10.500V8a3.500 3.500 0 017 0v2.500" /></svg>;

const D: Record<string, string> = {
  cal: "M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 10h16M8 3v4M16 3v4",
  ok: "M5 12.500l4.500 4.500L19 7.500",
  no: "M6 6l12 12M18 6L6 18",
  clock: "M12 7v5l3 2M12 3.500a8.500 8.500 0 100 17 8.500 8.500 0 000-17z",
  badge: "M12 3.500l2.300 2.200 3.100-.2.600 3.100 2.500 1.900-1.500 2.700.5 3.100-3 .9-1.800 2.600L12 18.500l-2.700 1.300-1.800-2.600-3-.9.500-3.100L3.500 10.800 6 8.900l.6-3.100 3.100.2z",
  card: "M4 7h16v10H4zM4 10.500h16",
  chat: "M5 6h14a1 1 0 011 1v8a1 1 0 01-1 1h-7l-4 3.500V16H5a1 1 0 01-1-1V7a1 1 0 011-1z",
  star: "M12 4l2.400 5 5.500.7-4 3.800 1 5.500L12 16.400 7.100 19l1-5.500-4-3.800L9.600 9z",
  bell: "M6 16V11a6 6 0 0112 0v5l1.500 2h-15zM10 20.500h4",
};
export const KIND_ICON: Record<string, string> = { new_request: "cal", accepted: "ok", refused: "no", cancelled: "no", reminder: "clock", certified: "badge", cert_rejected: "no", paid: "card", message: "chat", review: "star", done: "ok" };
export const NotifIcon = ({ kind }: { kind: string }) => <svg {...P} width={18} height={18}><path d={D[KIND_ICON[kind] || "bell"]} /></svg>;
