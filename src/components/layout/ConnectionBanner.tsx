import { useEffect, useState } from "react";
import { useHAConnection } from "../../hooks/useHAConnection";

export function ConnectionBanner() {
  const { status } = useHAConnection();
  const [isOnline, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const showOffline = !isOnline;
  const showReconnecting = status.phase !== "connected" && status.phase !== "idle";

  if (!showOffline && !showReconnecting) {
    return null;
  }

  const message = showOffline
    ? "Device offline — reconnecting when network returns"
    : status.phase === "connecting"
      ? "Connecting to Home Assistant…"
      : "Re-establishing Home Assistant session…";

  return (
    <div className="bg-amber-500/20 px-4 py-2 text-xs font-medium uppercase tracking-wider text-amber-200">
      {message}
    </div>
  );
}
