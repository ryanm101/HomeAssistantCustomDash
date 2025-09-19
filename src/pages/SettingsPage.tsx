import type { ReactNode } from "react";
import { FormEvent, useEffect, useState } from "react";
import { useHAConnection } from "../hooks/useHAConnection";
import { useKioskControls } from "../hooks/useKioskControls";
import { useKioskSettings, type DensityPreference, type ThemePreference } from "../hooks/useKioskSettings";

export default function SettingsPage() {
  const { status, credentials, actions } = useHAConnection();
  const kioskControls = useKioskControls();
  const canWakeLock = typeof navigator !== "undefined" && "wakeLock" in navigator;
  const { settings, resolvedTheme, setDensity, setTheme } = useKioskSettings();
  const [formState, setFormState] = useState(() => ({
    baseUrl: credentials?.baseUrl ?? "",
    token: credentials?.token ?? "",
  }));
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormState({ baseUrl: credentials?.baseUrl ?? "", token: credentials?.token ?? "" });
  }, [credentials?.baseUrl, credentials?.token]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formState.baseUrl || !formState.token) {
      setSaveMessage("Base URL and token required.");
      return;
    }
    actions.setCredentials({ baseUrl: formState.baseUrl.trim(), token: formState.token.trim() });
    setSaveMessage("Credentials saved. Connecting…");
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold text-slate-100">Home Assistant</h1>
        <p className="mt-1 text-sm text-slate-400">
          Provide the base URL and long-lived access token with the <code>homeassistant</code> scope.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate-200">
            Base URL
            <input
              value={formState.baseUrl}
              onChange={(event) => setFormState((prev) => ({ ...prev, baseUrl: event.target.value }))}
              placeholder="https://homeassistant.local:8123"
              className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-200">
            Long-lived token
            <input
              value={formState.token}
              onChange={(event) => setFormState((prev) => ({ ...prev, token: event.target.value }))}
              placeholder="eyJ0eXAiOiJKV1QiLCJh..."
              className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              required
            />
          </label>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Status: {status.phase}</span>
            {saveMessage ? <span className="text-cyan-300">{saveMessage}</span> : null}
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900">
              Save &amp; Connect
            </button>
            <button
              type="button"
              onClick={() => {
                actions.clearCredentials();
                setSaveMessage("Credentials cleared.");
              }}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6">
        <h2 className="text-xl font-semibold text-slate-100">Display &amp; Density</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SettingTile title="Theme" description={`Current: ${resolvedTheme}`}>
            <ToggleGroup
              value={settings.theme}
              options={[
                { label: "System", value: "system" },
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
              ]}
              onChange={(value) => setTheme(value as ThemePreference)}
            />
          </SettingTile>
          <SettingTile title="Density" description={`Current: ${settings.density}`}>
            <ToggleGroup
              value={settings.density}
              options={[
                { label: "Comfortable", value: "comfortable" },
                { label: "Compact", value: "compact" },
              ]}
              onChange={(value) => setDensity(value as DensityPreference)}
            />
          </SettingTile>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6">
        <h2 className="text-xl font-semibold text-slate-100">Kiosk Controls</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SettingTile title="Screen" description={kioskControls.fullscreen ? "Fullscreen" : "Windowed"}>
            <button
              onClick={() => (kioskControls.fullscreen ? kioskControls.exitFullscreen() : kioskControls.enterFullscreen())}
              className="rounded-xl bg-slate-800/70 px-4 py-2 text-sm font-semibold text-slate-100"
            >
              {kioskControls.fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            </button>
          </SettingTile>
          <SettingTile
            title="Wake Lock"
            description={canWakeLock ? (kioskControls.wakeLockActive ? "Active" : "Inactive") : "Unsupported"}
          >
            <button
              onClick={() =>
                kioskControls.wakeLockActive
                  ? kioskControls.releaseWakeLock()
                  : kioskControls.requestWakeLock().catch((error) => console.error("Wake lock error", error))
              }
              className="rounded-xl bg-slate-800/70 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-40"
              disabled={!canWakeLock}
            >
              {kioskControls.wakeLockActive ? "Release wake lock" : "Hold display awake"}
            </button>
          </SettingTile>
        </div>
      </section>
    </div>
  );
}

function SettingTile({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ToggleGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
            value === option.value ? "bg-cyan-400 text-slate-900" : "bg-slate-800/70 text-slate-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
