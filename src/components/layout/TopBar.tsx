import { Link } from "react-router-dom";

export default function TopBar() {
  return (
    <div className="flex h-16 items-center gap-4 px-4 text-sm">
      <button
        aria-label="Open navigation"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800/70 bg-slate-900/40 text-xl shadow-sm transition hover:bg-slate-800/60"
        data-testid="menu-button"
      >
        ☰
      </button>
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-baseline gap-2">
          <Link to="/overview" className="text-2xl font-semibold tracking-wide">
            rpidash
          </Link>
          <span className="rounded-full border border-slate-800/70 px-3 py-1 text-xs uppercase tracking-widest text-slate-300/80">
            kiosk mode
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-300/70">
          <span className="hidden sm:inline">Viewport 1024×600</span>
          <time aria-live="polite" data-testid="clock">
            {new Intl.DateTimeFormat(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date())}
          </time>
        </div>
      </div>
    </div>
  );
}
