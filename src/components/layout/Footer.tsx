import { useMemo } from "react";
import { useHAConnection } from "../../hooks/useHAConnection";
import { useEntities } from "../../hooks/useEntities";

export default function Footer() {
  const { status } = useHAConnection();
  const alerts = useEntities((entities) =>
    Object.values(entities).filter(
      (entity) =>
        entity.entity_id.startsWith("binary_sensor.") &&
        entity.state === "on" &&
        ["problem", "safety", "smoke", "moisture"].includes(String(entity.attributes?.device_class ?? ""))
    ),
  );

  const alertsCount = alerts.length;
  const alertLabel = alertsCount === 0 ? "No alerts" : `${alertsCount} alert${alertsCount === 1 ? "" : "s"}`;

  const connectionLabel = useMemo(() => formatPhase(status.phase), [status.phase]);
  const latencyLabel = status.latencyMs ? `${status.latencyMs} ms` : "—";
  const lastUpdate = status.lastUpdateTs ? new Date(status.lastUpdateTs).toLocaleTimeString() : "—";

  return (
    <div className="flex h-12 items-center gap-6 px-4 text-xs uppercase tracking-wider text-slate-300/80">
      <div className="flex items-center gap-2">
        <StatusDot phase={status.phase} />
        <span>{connectionLabel}</span>
      </div>
      <div>Latency {latencyLabel}</div>
      <div>Updated {lastUpdate}</div>
      <div className="ml-auto flex items-center gap-2">
        <span className={`rounded-full border px-3 py-1 ${alertsCount ? "border-amber-400 text-amber-300" : "border-slate-700"}`}>
          {alertLabel}
        </span>
      </div>
    </div>
  );
}

function StatusDot({ phase }: { phase: string }) {
  const color =
    phase === "connected" ? "bg-emerald-400" : phase === "reconnecting" ? "bg-amber-400" : "bg-red-500";
  return <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} data-testid="status-dot" />;
}

function formatPhase(phase: string) {
  switch (phase) {
    case "connected":
      return "Online";
    case "reconnecting":
      return "Reconnecting";
    case "connecting":
      return "Connecting";
    case "disconnected":
      return "Offline";
    default:
      return "Not Configured";
  }
}
