import { NavLink } from "react-router-dom";

const links = [
  { to: "/overview", label: "Overview", abbr: "OV" },
  { to: "/climate", label: "Climate", abbr: "CL" },
  { to: "/energy", label: "Energy", abbr: "EN" },
  { to: "/media", label: "Media", abbr: "MD" },
  { to: "/security", label: "Security", abbr: "SC" },
  { to: "/settings", label: "Settings", abbr: "ST" },
];

export default function Sidebar() {
  return (
    <nav className="flex h-full w-[92px] flex-col gap-3 p-3" aria-label="Sidebar">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `group flex-1 rounded-2xl border border-slate-800/70 px-3 py-4 text-center text-xs font-medium uppercase tracking-wide transition ${
              isActive
                ? "bg-slate-800/70 text-cyan-200 shadow-[0_10px_30px_rgba(15,118,212,0.25)]"
                : "bg-slate-900/30 text-slate-300/80 hover:bg-slate-800/40"
            }`
          }
        >
          <span className="mb-1 block text-base tracking-widest" aria-hidden>
            {link.abbr}
          </span>
          <span className="block">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
