import { useCallback, useEffect, useState } from "react";

let wakeLockSentinel: WakeLockSentinel | null = null;

export function useKioskControls() {
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [fullscreen, setFullscreen] = useState(() => typeof document !== "undefined" && Boolean(document.fullscreenElement));

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      throw new Error("Wake Lock API unavailable on this device");
    }
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
      setWakeLockActive(true);
      wakeLockSentinel.addEventListener("release", () => setWakeLockActive(false));
    } catch (error) {
      setWakeLockActive(false);
      throw error;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockSentinel?.release();
    } finally {
      wakeLockSentinel = null;
      setWakeLockActive(false);
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (typeof document === "undefined") {
      return;
    }
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (typeof document === "undefined") {
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  return {
    wakeLockActive,
    fullscreen,
    requestWakeLock,
    releaseWakeLock,
    enterFullscreen,
    exitFullscreen,
  };
}
