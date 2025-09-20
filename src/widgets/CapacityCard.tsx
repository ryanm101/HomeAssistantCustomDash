import { useMemo } from "react";
import { useEntity } from "../hooks/useEntity";
import { Placeholder, Tile } from "./Tile";

const DEFAULT_IDS = {
  generationToHouse: "sensor.solar_panel_to_house_w",
  generationToGrid: "sensor.solar_panel_to_grid_w",
  generationToBattery: "sensor.solar_panel_to_battery_w",
  gridToHouse: "sensor.solar_grid_to_house_w",
  batteryToHouse: "sensor.solar_battery_to_house_w",
  inverterLimitKw: 3.6,
  batteryState: "sensor.solaredge_b1_state_of_energy",
};

export interface CapacityCardProps {
  ids?: Partial<typeof DEFAULT_IDS>;
  inverterLimitKw?: number;
}

export function CapacityCard({ ids, inverterLimitKw }: CapacityCardProps) {
  const config = useMemo(() => ({ ...DEFAULT_IDS, ...ids }), [ids]);
  const inverterLimit = (inverterLimitKw ?? config.inverterLimitKw) * 1000;

  const solarHouse = usePower(config.generationToHouse);
  const solarGrid = usePower(config.generationToGrid);
  const solarBattery = usePower(config.generationToBattery);
  const gridHouse = usePower(config.gridToHouse);
  const batteryHouse = usePower(config.batteryToHouse);
  const batteryState = useEntity(config.batteryState ?? "");

  const solarTotal = sumSafe([solarHouse.value, solarGrid.value, solarBattery.value]);
  const houseLoad = sumSafe([solarHouse.value, gridHouse.value, batteryHouse.value]);

  if (solarTotal === null || houseLoad === null) {
    return (
      <Tile title="Available Capacity" subtitle="Awaiting Home Assistant data">
        <Placeholder message="We need generation and house load sensors before showing inverter headroom." />
      </Tile>
    );
  }

  const acAvailable = Math.min(solarTotal, inverterLimit);
  const availableForHouse = Math.max(0, acAvailable - houseLoad);
  const toBattery = Math.max(0, solarTotal - acAvailable);
  const inverterHeadroom = Math.max(0, inverterLimit - houseLoad);

  const supplyBreakdown = resolveSupplyBreakdown({
    houseLoad,
    solarHouse: solarHouse.value ?? 0,
    batteryHouse: batteryHouse.value ?? 0,
    gridHouse: gridHouse.value ?? 0,
  });

  const batteryPercent = clampPercent(Number(batteryState?.state));

  return (
    <Tile title="Available Capacity" subtitle="Real-time inverter headroom">
      <div className="flex flex-col gap-4 text-slate-200">
        <Highlight value={availableForHouse} label="Supply spare" tone="text-green-200" />

        <div className="grid gap-3 md:grid-cols-2">
          <Metric label="Solar production" value={solarTotal} />
          <Metric label="House load" value={houseLoad} />
          <Metric label="Inverter limit" value={inverterLimit} />
          <Metric label="Charging battery" value={toBattery} />
        </div>

        <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
          <SupplyPie breakdown={supplyBreakdown} />
          <SupplyLegend breakdown={supplyBreakdown} />
        </div>

        <BatteryStatus percent={batteryPercent} toBattery={toBattery} />

        <ProgressBar
          total={inverterLimit}
          used={Math.min(houseLoad, inverterLimit)}
          label="Inverter utilisation"
        />
        <div className="text-xs text-slate-400">
          Remaining AC capacity: {formatPower(inverterHeadroom)} before export or additional loads.
        </div>
      </div>
    </Tile>
  );
}

function Highlight({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className={`text-4xl font-semibold ${tone}`}>{formatPower(value)}</span>
      <span className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-100">{formatPower(value)}</div>
    </div>
  );
}

function SupplyLegend({
  breakdown,
}: {
  breakdown: Array<{ label: string; value: number; percent: number; color: string }>;
}) {
  const total = breakdown.reduce((acc, item) => acc + item.value, 0);
  return (
    <div className="space-y-2 text-sm">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Where house load is supplied from</div>
      <ul className="space-y-1">
        {breakdown.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-200">
              {item.label}: {formatPower(item.value)} ({item.percent.toFixed(0)}%)
            </span>
          </li>
        ))}
      </ul>
      {total === 0 ? (
        <div className="text-xs text-slate-500">No consumption detected; inverter is idle.</div>
      ) : null}
    </div>
  );
}

function SupplyPie({
  breakdown,
}: {
  breakdown: Array<{ label: string; value: number; percent: number; color: string }>;
}) {
  const total = breakdown.reduce((acc, item) => acc + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-slate-600 text-xs text-slate-500">
        Idle
      </div>
    );
  }

  let cumulative = 0;
  const radius = 15.915;

  return (
    <svg viewBox="0 0 42 42" className="h-32 w-32" role="img" aria-label="Supply source distribution">
      <circle className="fill-slate-900/85" cx="21" cy="21" r="21" />
      {breakdown.map((item) => {
        const dash = (item.percent / 100) * 2 * Math.PI * radius;
        const gap = 2 * Math.PI * radius - dash;
        const strokeDasharray = `${dash} ${gap}`;
        const strokeDashoffset = -(cumulative / 100) * 2 * Math.PI * radius;
        cumulative += item.percent;
        return (
          <circle
            key={item.label}
            role="presentation"
            className="fill-none stroke-[3.5]"
            stroke={item.color}
            strokeLinecap="butt"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            cx="21"
            cy="21"
            r={radius}
          />
        );
      })}
      <circle className="fill-slate-950" cx="21" cy="21" r="11" />
      <text x="21" y="22" textAnchor="middle" className="fill-slate-200 text-[6px] font-semibold">
        {formatPower(total)}
      </text>
    </svg>
  );
}

function BatteryStatus({ percent, toBattery }: { percent: number | null; toBattery: number }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 px-3 py-3">
      <div className="flex items-center justify-between text-sm text-slate-200">
        <span className="uppercase tracking-[0.3em] text-slate-400">Battery</span>
        <span>{percent !== null ? `${percent.toFixed(0)}%` : "—"}</span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1 text-emerald-200">
          ▲ {formatPower(toBattery)} charging
        </span>
        <span className="inline-flex items-center gap-1">
          {percent !== null && percent > 10 ? "Ready to support load" : "Limited reserve"}
        </span>
      </div>
    </div>
  );
}

function ProgressBar({ total, used, label }: { total: number; used: number; label: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</div>
      <div className="h-2 w-full rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-slate-400">{pct}% utilised</div>
    </div>
  );
}

function usePower(entityId?: string) {
  if (!entityId) {
    return { value: null };
  }
  const entity = useEntity(entityId);
  if (!entity) {
    return { value: null };
  }
  const value = Number(entity.state);
  return { value: Number.isFinite(value) ? value : null };
}

function sumSafe(values: Array<number | null>) {
  const filtered = values.filter((v): v is number => v !== null);
  if (!filtered.length) return null;
  return filtered.reduce((acc, v) => acc + v, 0);
}

function formatPower(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1000) {
    const kw = abs / 1000;
    return `${sign}${kw >= 10 ? kw.toFixed(0) : kw.toFixed(1)} kW`;
  }
  return `${sign}${Math.round(abs)} W`;
}

function resolveSupplyBreakdown({
  houseLoad,
  solarHouse,
  batteryHouse,
  gridHouse,
}: {
  houseLoad: number;
  solarHouse: number;
  batteryHouse: number;
  gridHouse: number;
}) {
  let breakdown = [
    { label: "Solar", value: Math.max(0, solarHouse), color: "#facc15" },
    { label: "Battery", value: Math.max(0, batteryHouse), color: "#22c55e" },
    { label: "Grid", value: Math.max(0, gridHouse), color: "#38bdf8" },
  ];

  const supplyTotal = breakdown.reduce((acc, item) => acc + item.value, 0);

  if (supplyTotal <= 1 && houseLoad > 1) {
    breakdown = [
      { label: "Grid", value: houseLoad, color: "#38bdf8" },
      { label: "Solar", value: 0, color: "#facc15" },
      { label: "Battery", value: 0, color: "#22c55e" },
    ];
  }

  const total = breakdown.reduce((acc, item) => acc + item.value, 0);
  return breakdown.map((item) => ({ ...item, percent: total > 0 ? (item.value / total) * 100 : 0 }));
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

export default CapacityCard;
