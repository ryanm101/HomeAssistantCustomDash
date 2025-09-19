import { NavLink } from "react-router-dom";

const links = [
  { to: "/overview", label: "Overview" },
  { to: "/climate", label: "Climate" },
  { to: "/energy", label: "Energy" },
  { to: "/media", label: "Media" },
  { to: "/security", label: "Security" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <nav className="flex h-full w-24 flex-col gap-2 border-r p-2" aria-label="Sidebar">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            `block rounded-md px-2 py-3 text-center text-sm ${isActive ? "bg-gray-200 dark:bg-gray-800 font-medium" : "hover:bg-gray-100 dark:hover:bg-gray-900"}`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

