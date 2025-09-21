import { useMemo } from "react";
import { useEntity } from "../hooks/useEntity";
import { Placeholder, Tile } from "./Tile";

type NodeKey = "solar" | "grid" | "home" | "battery";
type FlowKey =
  | "generationToHouse"
  | "generationToGrid"
  | "generationToBattery"
  | "gridToHouse"
  | "gridToBattery"
  | "batteryToHouse"
  | "batteryToGrid";

const DEFAULT_IDS: Record<FlowKey | "batteryState", string | undefined> = {
  generationToHouse: "sensor.solar_panel_to_house_w",
  generationToGrid: "sensor.solar_panel_to_grid_w",
  generationToBattery: "sensor.solar_panel_to_battery_w",
  gridToHouse: "sensor.solar_grid_to_house_w",
  gridToBattery: "sensor.solar_grid_to_battery_w",
  batteryToHouse: "sensor.solar_battery_to_house_w",
  batteryToGrid: "sensor.solar_battery_to_grid_w",
  batteryState: "sensor.solaredge_b1_state_of_energy",
};

const COLORS: Record<FlowKey, string> = {
  generationToHouse: "#facc15",
  generationToGrid: "#fb923c",
  generationToBattery: "#22c55e",
  gridToHouse: "#38bdf8",
  gridToBattery: "#0ea5e9",
  batteryToHouse: "#14b8a6",
  batteryToGrid: "#f973ab",
};

const NODE_LABELS: Record<NodeKey, string> = {
  solar: "Solar",
  grid: "Grid",
  home: "Home",
  battery: "Battery",
};

const LAYOUT = {
  width: 320,
  height: 320,
  nodeRadius: 44,
  nodes: {
    solar: { x: 160, y: 56 },
    grid: { x: 56, y: 168 },
    home: { x: 264, y: 168 },
    battery: { x: 160, y: 280 },
  } as Record<NodeKey, { x: number; y: number }>,
};

// Helps align diagonal connectors so they meet node edges cleanly
const EDGE_FACTOR = 0.707; // cos(45°)
const DIAGONAL_OFFSET = LAYOUT.nodeRadius * EDGE_FACTOR;

const FLOW_DEFS: Array<{
  key: FlowKey;
  from: NodeKey;
  to: NodeKey;
  anchors: { from: [number, number]; to: [number, number] };
}> = [
  {
    key: "generationToHouse",
    from: "solar",
    to: "home",
    anchors: {
      from: [DIAGONAL_OFFSET, DIAGONAL_OFFSET],
      to: [-DIAGONAL_OFFSET, -DIAGONAL_OFFSET],
    },
  },
  {
    key: "generationToGrid",
    from: "solar",
    to: "grid",
    anchors: {
      from: [-DIAGONAL_OFFSET, DIAGONAL_OFFSET],
      to: [DIAGONAL_OFFSET, -DIAGONAL_OFFSET],
    },
  },
  {
    key: "generationToBattery",
    from: "solar",
    to: "battery",
    anchors: {
      from: [0, LAYOUT.nodeRadius],
      to: [0, -LAYOUT.nodeRadius],
    },
  },
  {
    key: "gridToHouse",
    from: "grid",
    to: "home",
    anchors: {
      from: [LAYOUT.nodeRadius, 0],
      to: [-LAYOUT.nodeRadius, 0],
    },
  },
  {
    key: "gridToBattery",
    from: "grid",
    to: "battery",
    anchors: {
      from: [DIAGONAL_OFFSET * 0.9, DIAGONAL_OFFSET * 0.5],
      to: [-DIAGONAL_OFFSET * 0.9, -DIAGONAL_OFFSET * 0.5],
    },
  },
  {
    key: "batteryToHouse",
    from: "battery",
    to: "home",
    anchors: {
      from: [DIAGONAL_OFFSET * 0.9, -DIAGONAL_OFFSET * 0.5],
      to: [-DIAGONAL_OFFSET * 0.9, DIAGONAL_OFFSET * 0.5],
    },
  },
  {
    key: "batteryToGrid",
    from: "battery",
    to: "grid",
    anchors: {
      from: [-DIAGONAL_OFFSET * 0.9, -DIAGONAL_OFFSET * 0.5],
      to: [DIAGONAL_OFFSET * 0.9, DIAGONAL_OFFSET * 0.5],
    },
  },
];

export interface EnergyFlowCardProps {
  ids?: Partial<typeof DEFAULT_IDS>;
}

export function EnergyFlowCard({ ids }: EnergyFlowCardProps) {
  const entityIds = useMemo(() => ({ ...DEFAULT_IDS, ...ids }), [ids]);

  const generationToHouse = useReadPower(entityIds.generationToHouse);
  const generationToGrid = useReadPower(entityIds.generationToGrid);
  const generationToBattery = useReadPower(entityIds.generationToBattery);
  const gridToHouse = useReadPower(entityIds.gridToHouse);
  const gridToBattery = useReadPower(entityIds.gridToBattery);
  const batteryToHouse = useReadPower(entityIds.batteryToHouse);
  const batteryToGrid = useReadPower(entityIds.batteryToGrid);

  const flows: Record<FlowKey, number | null> = {
    generationToHouse,
    generationToGrid,
    generationToBattery,
    gridToHouse,
    gridToBattery,
    batteryToHouse,
    batteryToGrid,
  };

  const batteryState = useEntity(entityIds.batteryState ?? "");
  const batteryPercent = entityIds.batteryState && batteryState ? clamp(Number(batteryState.state), 0, 100) : NaN;

  const hasData = Object.values(flows).some((value) => value !== null && Math.abs(value) > 1);
  if (!hasData) {
    return (
      <Tile title="Home Energy Flow" subtitle="Awaiting Home Assistant data">
        <Placeholder message="We're waiting for the first energy readings from your Home Assistant entities." />
      </Tile>
    );
  }

  const solarSummary = summariseBubble(flows, [
    { key: "generationToHouse", sign: 1 },
    { key: "generationToGrid", sign: 1 },
    { key: "generationToBattery", sign: 1 },
  ]);
  const gridSummary = summariseBubble(flows, [
    { key: "generationToGrid", sign: -1 },
    { key: "gridToHouse", sign: 1 },
    { key: "gridToBattery", sign: 1 },
    { key: "batteryToGrid", sign: -1 },
  ]);
  const homeSummary = summariseBubble(flows, [
    { key: "generationToHouse", sign: 1 },
    { key: "gridToHouse", sign: 1 },
    { key: "batteryToHouse", sign: 1 },
  ]);
  const batterySummary = summariseBubble(flows, [
    { key: "generationToBattery", sign: 1 },
    { key: "gridToBattery", sign: 1 },
    { key: "batteryToHouse", sign: -1 },
    { key: "batteryToGrid", sign: -1 },
  ]);

  const totalGeneration = solarSummary.value;
  const actionChip = totalGeneration !== null ? formatPowerMagnitude(Math.abs(totalGeneration)) : null;

  return (
    <Tile
      title="Home Energy Flow"
      subtitle="Live power"
      actions={
        actionChip ? (
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-200">
            Solar {actionChip}
          </span>
        ) : null
      }
    >
      <div
        className="relative mx-auto w-full max-w-[580px]"
        style={{ aspectRatio: `${LAYOUT.width} / ${LAYOUT.height}` }}
      >
        <EnergyFlowSvg flows={flows} />

        <FlowBubble node="solar" summary={solarSummary} icon="☀" accent="text-amber-200" />
        <FlowBubble node="grid" summary={gridSummary} icon="⚡" accent="text-sky-200" />
        <FlowBubble node="home" summary={homeSummary} icon="🏠" accent="text-slate-200" />
        <FlowBubble
          node="battery"
          summary={batterySummary}
          icon="🔋"
          accent="text-emerald-200"
          gaugePercent={Number.isFinite(batteryPercent) ? batteryPercent : null}
          footnote={Number.isFinite(batteryPercent) ? `${batteryPercent}%` : undefined}
        />
      </div>
    </Tile>
  );
}

function EnergyFlowSvg({ flows }: { flows: Record<FlowKey, number | null> }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`}
      role="presentation"
    >
      <defs>
        <marker id="energy-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>

      {FLOW_DEFS.map((def) => (
        <FlowPath
          key={def.key}
          flowKey={def.key}
          reading={flows[def.key] ?? 0}
          from={def.from}
          to={def.to}
          color={COLORS[def.key]}
          anchors={def.anchors}
        />
      ))}
    </svg>
  );
}

function FlowPath({ flowKey, reading, from, to, color, anchors }: {
  flowKey: FlowKey;
  reading: number;
  from: NodeKey;
  to: NodeKey;
  color: string;
  anchors: { from: [number, number]; to: [number, number] };
}) {
  const startNode = LAYOUT.nodes[from];
  const endNode = LAYOUT.nodes[to];
  const magnitude = Math.abs(reading);
  const direction = reading >= 0 ? 1 : -1;

  const { path, labelPoint } = buildStraightPath(
    direction === 1 ? startNode : endNode,
    direction === 1 ? anchors.from : anchors.to,
    direction === 1 ? endNode : startNode,
    direction === 1 ? anchors.to : anchors.from,
  );

  let textPosition = { ...labelPoint };
  if (flowKey === "generationToBattery") {
    textPosition.y -= 8;
  } else if (flowKey === "gridToHouse") {
    textPosition.y += 12;
  }

  const animate = magnitude > 1;
  const animateClasses = animate
    ? direction === 1
      ? "energy-flow-path energy-flow-path--animate"
      : "energy-flow-path energy-flow-path--animate energy-flow-path--reverse"
    : "energy-flow-path";
  const strokeWidth = animate ? Math.min(6, 2 + magnitude / 900) : 2;
  const opacity = animate ? 0.9 : 0.25;

  return (
    <g>
      <path
        d={path}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={opacity}
        markerEnd="url(#energy-arrow)"
        className={animateClasses}
      />
      {animate ? (
        <text
          x={textPosition.x}
          y={textPosition.y}
          textAnchor="middle"
          className="fill-white/85 text-[11px] font-medium"
          transform={
            flowKey === "generationToBattery" ? `rotate(-90 ${textPosition.x} ${textPosition.y})` : undefined
          }
          dy={flowKey === "generationToBattery" ? "0.35em" : undefined}
        >
          {formatPowerMagnitude(magnitude)}
        </text>
      ) : null}
    </g>
  );
}

function FlowBubble({
  node,
  summary,
  icon,
  accent,
  gaugePercent,
  footnote,
}: {
  node: NodeKey;
  summary: BubbleSummary;
  icon: string;
  accent: string;
  gaugePercent?: number | null;
  footnote?: string;
}) {
  const { x, y } = LAYOUT.nodes[node];
  const left = `${(x / LAYOUT.width) * 100}%`;
  const top = `${(y / LAYOUT.height) * 100}%`;

  return (
    <div
      className="absolute flex w-36 flex-col items-center gap-2 text-slate-200"
      style={{ left, top, transform: "translate(-50%, -50%)" }}
    >
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full bg-slate-950/90 border border-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.45)]" />
        {typeof gaugePercent === "number" ? (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#22c55e ${Math.max(0, Math.min(100, gaugePercent)) * 3.6}deg, rgba(148,163,184,0.15) 0deg)`
            }}
          />
        ) : null}
        <div className="absolute inset-[10px] rounded-full bg-slate-950/95" />
        <div className="relative z-10 flex h-full w-full items-center justify-center text-3xl">
          {icon}
        </div>
      </div>
      <div className={`flex items-baseline gap-1 text-lg font-semibold ${summary.value !== null ? accent : "text-slate-500"}`}>
        <span>{summary.displayValue}</span>
        {summary.unit ? <span className="text-xs uppercase tracking-widest text-slate-400">{summary.unit}</span> : null}
      </div>
      <div className="text-[11px] uppercase tracking-[0.32em] text-slate-400">{NODE_LABELS[node]}</div>
      {footnote ? <div className="text-xs text-emerald-200">{footnote}</div> : null}
    </div>
  );
}

function buildStraightPath(
  startNode: { x: number; y: number },
  startOffset: [number, number],
  endNode: { x: number; y: number },
  endOffset: [number, number],
) {
  const start = { x: startNode.x + startOffset[0], y: startNode.y + startOffset[1] };
  const end = { x: endNode.x + endOffset[0], y: endNode.y + endOffset[1] };
  const path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  const labelPoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - 8 };
  return { path, labelPoint };
}

interface BubbleSummary {
  value: number | null;
  displayValue: string;
  unit: string;
}

function summariseBubble(
  flows: Record<FlowKey, number | null>,
  terms: Array<{ key: FlowKey; sign: 1 | -1 }>,
): BubbleSummary {
  let sum = 0;
  let hasData = false;
  terms.forEach(({ key, sign }) => {
    const value = flows[key];
    if (value !== null) {
      hasData = true;
      sum += value * sign;
    }
  });

  if (!hasData) {
    return { value: null, displayValue: "—", unit: "" };
  }

  const abs = Math.abs(sum);
  const sign = sum < 0 ? "−" : "";
  if (abs >= 1000) {
    const base = abs / 1000;
    return {
      value: sum,
      displayValue: `${sign}${base >= 10 ? base.toFixed(0) : base.toFixed(1)}`,
      unit: "kW",
    };
  }
  return { value: sum, displayValue: `${sign}${Math.round(abs)}`, unit: "W" };
}

function useReadPower(entityId?: string) {
  const entity = useEntity(entityId ?? "");
  if (!entityId || !entity) return null;

  const value = Number(entity.state);
  return Number.isFinite(value) ? value : null;
}

function formatPowerMagnitude(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000) {
    const kw = value / 1000;
    return `${kw >= 10 ? kw.toFixed(0) : kw.toFixed(1)} kW`;
  }
  return `${Math.round(value)} W`;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return NaN;
  return Math.max(min, Math.min(max, value));
}

export default EnergyFlowCard;
