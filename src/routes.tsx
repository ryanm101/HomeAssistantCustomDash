import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import AppShell from "./app/AppShell";

const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const ClimatePage = lazy(() => import("./pages/ClimatePage"));
const EnergyPage = lazy(() => import("./pages/EnergyPage"));
const MediaPage = lazy(() => import("./pages/MediaPage"));
const SecurityPage = lazy(() => import("./pages/SecurityPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}> 
          <Route
            index
            element={
              <Suspense fallback={<div className="p-3">Loading…</div>}>
                <Navigate to="/overview" replace />
              </Suspense>
            }
          />
          <Route
            path="/overview"
            element={
              <Suspense fallback={<div className="p-3">Loading…</div>}>
                <OverviewPage />
              </Suspense>
            }
          />
          <Route path="/climate" element={<Suspense fallback={<div className=\"p-3\">Loading…</div>}><ClimatePage /></Suspense>} />
          <Route path="/energy" element={<Suspense fallback={<div className=\"p-3\">Loading…</div>}><EnergyPage /></Suspense>} />
          <Route path="/media" element={<Suspense fallback={<div className=\"p-3\">Loading…</div>}><MediaPage /></Suspense>} />
          <Route path="/security" element={<Suspense fallback={<div className=\"p-3\">Loading…</div>}><SecurityPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<div className=\"p-3\">Loading…</div>}><SettingsPage /></Suspense>} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

