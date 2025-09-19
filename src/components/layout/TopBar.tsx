import { Link } from "react-router-dom";

export default function TopBar() {
  return (
    <div className="flex h-14 items-center justify-between border-b px-3">
      <div className="flex items-center gap-3">
        <button aria-label="Menu" className="h-9 w-9 rounded-md border" data-testid="menu-button">☰</button>
        <Link to="/overview" className="text-lg font-medium">rpidash</Link>
      </div>
      <div className="opacity-70 text-sm">1024×600 • Touch</div>
    </div>
  );
}

