import { lazy, Suspense, type LazyExoticComponent } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import AppShell from "./app/AppShell";

const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const SolarPage = lazy(() => import("./pages/SolarPage"));
const ClimatePage = lazy(() => import("./pages/ClimatePage"));
const EnergyPage = lazy(() => import("./pages/EnergyPage"));
const MediaPage = lazy(() => import("./pages/MediaPage"));
const SecurityPage = lazy(() => import("./pages/SecurityPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-300/80">
      Loading…
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="/solar" element={<LazyPage component={SolarPage} />} />
          <Route path="/overview" element={<LazyPage component={OverviewPage} />} />
          <Route path="/climate" element={<LazyPage component={ClimatePage} />} />
          <Route path="/energy" element={<LazyPage component={EnergyPage} />} />
          <Route path="/media" element={<LazyPage component={MediaPage} />} />
          <Route path="/security" element={<LazyPage component={SecurityPage} />} />
          <Route path="/settings" element={<LazyPage component={SettingsPage} />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function LazyPage({ component: Component }: { component: LazyExoticComponent<() => JSX.Element> }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}
