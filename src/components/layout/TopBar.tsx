import { Link } from "react-router-dom";
import { useMemo } from "react";

import { useEntity } from "../../hooks/useEntity";

const SOLAR_EXPORT_ID = "sensor.solar_panel_to_grid_w";
const BATTERY_SOC_ID = "sensor.solaredge_b1_state_of_energy";
const PANEL_TO_BATTERY_ID = "sensor.solar_panel_to_battery_w";
const GRID_TO_BATTERY_ID = "sensor.solar_grid_to_battery_w";
const BATTERY_TO_HOUSE_ID = "sensor.solar_battery_to_house_w";
const BATTERY_TO_GRID_ID = "sensor.solar_battery_to_grid_w";
const WASHING_MACHINE_STATUS_ID = "sensor.washing_machine_status";

const EXPORT_THRESHOLD_W = 200;
const BATTERY_FLOW_THRESHOLD_W = 120;

export default function TopBar() {
  return (
    <div className="flex h-16 items-center gap-4 px-4 text-sm">
      <button
        aria-label="Open navigation"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800/70 bg-slate-900/40 text-xl shadow-sm transition hover:bg-slate-800/60"
        data-testid="menu-button"
      >
        ☰
      </button>
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-baseline gap-2">
          <Link to="/solar" className="text-2xl font-semibold tracking-wide">
            rpidash
          </Link>
          <span className="rounded-full border border-slate-800/70 px-3 py-1 text-xs uppercase tracking-widest text-slate-300/80">
            kiosk mode
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-300/70">
          <StatusSummaries />
          <span className="hidden sm:inline">Viewport 1024×600</span>
          <time aria-live="polite" data-testid="clock">
            {new Intl.DateTimeFormat(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date())}
          </time>
        </div>
      </div>
    </div>
  );
}

function StatusSummaries() {
  const solarExport = useNumericEntity(SOLAR_EXPORT_ID);
  const panelToBattery = useNumericEntity(PANEL_TO_BATTERY_ID);
  const gridToBattery = useNumericEntity(GRID_TO_BATTERY_ID);
  const batteryToHouse = useNumericEntity(BATTERY_TO_HOUSE_ID);
  const batteryToGrid = useNumericEntity(BATTERY_TO_GRID_ID);
  const batterySoc = useNumericEntity(BATTERY_SOC_ID);
  const washer = useEntity(WASHING_MACHINE_STATUS_ID);

  const batteryMeta = useMemo(() => {
    if (batterySoc === null) {
      return { label: "Battery", value: "—", icon: "🔋" };
    }

    const inflow = (panelToBattery ?? 0) + (gridToBattery ?? 0);
    const outflow = (batteryToHouse ?? 0) + (batteryToGrid ?? 0);
    const net = inflow - outflow;

    let state: "Charging" | "Discharging" | "Idle" = "Idle";
    if (net > BATTERY_FLOW_THRESHOLD_W) {
      state = "Charging";
    } else if (net < -BATTERY_FLOW_THRESHOLD_W) {
      state = "Discharging";
    }

    const icon = state === "Charging" ? "🔌" : state === "Discharging" ? "⚡" : "🔋";
    const value = `${Math.round(batterySoc)}% • ${state}`;
    return { label: "Battery", value, icon };
  }, [batterySoc, panelToBattery, gridToBattery, batteryToHouse, batteryToGrid]);

  const solarMeta = useMemo(() => {
    if (solarExport === null) {
      return { label: "Excess", value: "—", icon: "☀" };
    }
    const exporting = solarExport >= EXPORT_THRESHOLD_W;
    const icon = exporting ? "☀⬆" : "☀";
    const value = exporting ? `${formatWatts(solarExport)} to grid` : "No export";
    return { label: "Excess", value, icon };
  }, [solarExport]);

  const washerMeta = useMemo(() => {
    if (!washer) {
      return { label: "Washer", value: "—", icon: "🧺" };
    }
    const raw = washer.state.toLowerCase();
    const icon = raw.includes("running") || raw === "on" ? "🟢" : raw.includes("finished") ? "✅" : "⚪";
    return { label: "Washer", value: humanize(raw), icon };
  }, [washer]);

  return (
    <div className="flex items-center gap-3 text-slate-200/90">
      <StatusPill meta={solarMeta} />
      <StatusPill meta={batteryMeta} />
      <StatusPill meta={washerMeta} />
    </div>
  );
}

function StatusPill({ meta }: { meta: { label: string; value: string; icon: string } }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-900/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em]"
      aria-label={`${meta.label}: ${meta.value}`}
    >
      <span className="text-lg" aria-hidden>
        {meta.icon}
      </span>
      <span className="flex flex-col gap-0 leading-none tracking-[0.24em]">
        <span className="text-[9px] text-slate-400">{meta.label}</span>
        <span className="text-[10px] tracking-[0.18em] text-slate-200">{meta.value}</span>
      </span>
    </div>
  );
}

function useNumericEntity(entityId: string | undefined) {
  const entity = useEntity(entityId ?? "");
  if (!entity) {
    return null;
  }
  const value = Number(entity.state);
  return Number.isFinite(value) ? value : null;
}

function formatWatts(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `${(abs / 1000).toFixed(1)} kW`;
  }
  return `${Math.round(abs)} W`;
}

function humanize(input: string) {
  return input
    .split(/[\s_]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
