import { NavLink } from "react-router-dom";

const links = [
  { to: "/solar", label: "Solar", icon: "☀" },
  { to: "/washing-machine", label: "Laundry", icon: "🧺" },
  { to: "/climate", label: "Climate", icon: "🌡" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar() {
  return (
    <nav className="flex h-full w-[40px] flex-col gap-1 bg-slate-950/80 p-1" aria-label="Sidebar">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `group flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-800/60 px-1 py-2 text-center transition-all duration-200 ${
              isActive
                ? "bg-slate-800/70 text-cyan-200 shadow-[0_10px_20px_rgba(8,126,164,0.25)]"
                : "bg-slate-900/20 text-slate-300/80 hover:border-cyan-400/50 hover:text-cyan-100"
            }`
          }
        >
          <span className="text-[18px]" aria-hidden>
            {link.icon}
          </span>
          <span className="text-[7px] font-semibold uppercase tracking-[0.25em] leading-3 text-slate-300">
            {link.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
