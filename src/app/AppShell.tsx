import { Outlet } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";

export default function AppShell() {
  return (
    <div className="grid h-screen w-screen grid-rows-[auto_1fr_auto] grid-cols-[auto_1fr] select-none">
      <header className="col-span-2">
        <TopBar />
      </header>
      <aside className="row-start-2">
        <Sidebar />
      </aside>
      <main className="row-start-2 col-start-2 overflow-auto p-3">
        <Outlet />
      </main>
      <footer className="col-span-2">
        <Footer />
      </footer>
    </div>
  );
}

