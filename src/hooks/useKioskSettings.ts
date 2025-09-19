import { useCallback, useEffect, useMemo, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";
export type DensityPreference = "comfortable" | "compact";

export interface KioskSettings {
  theme: ThemePreference;
  density: DensityPreference;
}

const STORAGE_KEY = "rpidash.kioskSettings";
const DEFAULT_SETTINGS: KioskSettings = {
  theme: "system",
  density: "comfortable",
};

export function useKioskSettings() {
  const [settings, setSettings] = useState<KioskSettings>(() => loadSettings());
  const [systemTheme, setSystemTheme] = useState<Exclude<ThemePreference, "system">>(getSystemTheme);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemTheme(media.matches ? "dark" : "light");
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = settings.theme === "system" ? systemTheme : settings.theme;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.dataset.density = settings.density;
  }, [settings.density]);

  const update = useCallback((partial: Partial<KioskSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial } as KioskSettings;
      persistSettings(next);
      return next;
    });
  }, []);

  return {
    settings,
    resolvedTheme,
    setTheme: useCallback((theme: ThemePreference) => update({ theme }), [update]),
    setDensity: useCallback((density: DensityPreference) => update({ density }), [update]),
  };
}

function loadSettings(): KioskSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }
  try {
    const parsed = JSON.parse(raw) as KioskSettings;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.warn("Failed to parse kiosk settings", error);
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: KioskSettings) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function getSystemTheme(): Exclude<ThemePreference, "system"> {
  if (typeof window === "undefined") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
