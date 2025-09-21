import { Outlet } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";
import { ConnectionBanner } from "../components/layout/ConnectionBanner";
import { useKioskSettings } from "../hooks/useKioskSettings";

export default function AppShell() {
  const { settings } = useKioskSettings();
  return (
    <div
      className="grid min-h-dvh w-full grid-cols-[40px_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-slate-950/90 text-slate-100 backdrop-blur"
      data-density={settings.density}
      style={{
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
        paddingLeft: "var(--safe-left)",
        paddingRight: "var(--safe-right)",
      }}
    >
      <header className="col-span-2 border-b border-slate-800/70 bg-slate-900/55">
        <TopBar />
        <ConnectionBanner />
      </header>
      <aside className="row-start-2 border-r border-slate-800/70 bg-slate-900/40">
        <Sidebar />
      </aside>
      <main className="row-start-2 col-start-2 overflow-y-auto p-4">
        <Outlet />
      </main>
      <footer className="col-span-2 border-t border-slate-800/70 bg-slate-900/55">
        <Footer />
      </footer>
    </div>
  );
}
