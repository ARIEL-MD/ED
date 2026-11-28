// Icônes en trait (même famille que le reste de l'appli)
const P = { viewBox: "0 0 24 24", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
export const PinIcon = () => <svg className="ico" {...P}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.400-6.500 11-6.500 11z" /><circle cx="12" cy="10" r="2.300" /></svg>;
export const LockIcon = () => <svg className="ico" {...P}><rect x="5" y="10.500" width="14" height="9.500" rx="2" /><path d="M8.500 10.500V8a3.500 3.500 0 017 0v2.500" /></svg>;
