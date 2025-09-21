import { useState } from "react";
import type { HassEntity } from "home-assistant-js-websocket";
import { useHAConnection } from "../hooks/useHAConnection";
import { useEntity } from "../hooks/useEntity";
import { useServiceCall } from "../hooks/useServiceCall";
import { Placeholder, Tile } from "../widgets/Tile";

interface EntityConfig {
  entity: string;
  name: string;
}

const CONTROL_ENTITIES: EntityConfig[] = [
  { entity: "switch.washing_machine_power_on", name: "Power on" },
  { entity: "button.washing_machine_start", name: "Start" },
  { entity: "button.washing_machine_stop", name: "Stop" },
];

const CYCLE_ENTITIES: EntityConfig[] = [
  { entity: "binary_sensor.washing_machine_door", name: "Door" },
  { entity: "sensor.washing_machine_program", name: "Program" },
  { entity: "sensor.washing_machine_program_phase", name: "Program phase" },
  { entity: "sensor.washing_machine_status", name: "Status" },
  { entity: "binary_sensor.washing_machine_remote_control", name: "Remote control" },
];

const TIMING_ENTITIES: EntityConfig[] = [
  { entity: "sensor.washing_machine_remaining_time", name: "Remaining time" },
  { entity: "sensor.washing_machine_elapsed_time", name: "Elapsed time" },
  { entity: "sensor.washing_machine_start_time", name: "Start time" },
  { entity: "sensor.washing_machine_start_at", name: "Start at" },
  { entity: "sensor.washing_machine_started_at", name: "Started at" },
  { entity: "sensor.washing_machine_finish_at", name: "Finish at" },
];

const PERFORMANCE_ENTITIES: EntityConfig[] = [
  { entity: "sensor.washing_machine_energy_consumption", name: "Energy consumption" },
  { entity: "sensor.washing_machine_energy_forecast", name: "Energy forecast" },
  { entity: "sensor.washing_machine_program_type", name: "Program type" },
  { entity: "sensor.washing_machine_spin_speed", name: "Spin speed" },
  { entity: "sensor.washing_machine_target_temperature", name: "Target temperature" },
  { entity: "binary_sensor.washing_machine_failure", name: "Failure" },
  { entity: "binary_sensor.washing_machine_info", name: "Info" },
];

export default function WashingMachinePage() {
  const { credentials } = useHAConnection();
  const isConfigured = Boolean(credentials);

  if (!isConfigured) {
    return (
      <div className="grid gap-4">
        <Tile title="Washing Machine" subtitle="Connect Home Assistant">
          <Placeholder message="Open Settings to add your Home Assistant URL and long-lived access token." />
        </Tile>
      </div>
    );
  }

  return (
    <div className="grid min-h-full gap-2 auto-rows-[minmax(140px,1fr)] sm:grid-cols-2 xl:grid-cols-4">
      <EntitiesCard
        className="min-h-[220px]"
        title="Washing Machine"
        subtitle="Controls"
        entities={CONTROL_ENTITIES}
        density="compact"
      />
      <EntitiesCard
        className="min-h-[220px]"
        title="Washing Machine"
        subtitle="Cycle Status"
        entities={CYCLE_ENTITIES}
        density="compact"
      />
      <EntitiesCard
        className="sm:col-span-2 xl:col-span-1 min-h-[220px]"
        title="Washing Machine"
        subtitle="Timing"
        entities={TIMING_ENTITIES}
        layout="grid"
        density="compact"
      />
      <EntitiesCard
        className="sm:col-span-2 xl:col-span-1 min-h-[220px]"
        title="Washing Machine"
        subtitle="Performance"
        entities={PERFORMANCE_ENTITIES}
        layout="grid"
        density="compact"
      />
    </div>
  );
}

function EntitiesCard({
  title,
  subtitle,
  entities,
  className,
  layout = "list",
  density = "comfortable",
}: {
  title: string;
  subtitle: string;
  entities: EntityConfig[];
  className?: string;
  layout?: "list" | "grid";
  density?: "comfortable" | "compact";
}) {
  const listClasses =
    layout === "grid"
      ? "grid h-full grid-cols-1 gap-2 md:grid-cols-2"
      : "flex h-full flex-col divide-y divide-slate-800/60";

  return (
    <div className={className}>
      <Tile title={title} subtitle={subtitle}>
        <ul className={listClasses}>
          {entities.map((config) => (
            <EntityRow key={config.entity} config={config} density={density} />
          ))}
        </ul>
      </Tile>
    </div>
  );
}

function EntityRow({
  config,
  density = "comfortable",
}: {
  config: EntityConfig;
  density?: "comfortable" | "compact";
}) {
  const entity = useEntity(config.entity);
  const serviceCall = useServiceCall();
  const [pending, setPending] = useState(false);
  const domain = config.entity.split(".")[0];
  const paddingClass = density === "compact" ? "py-1.5" : "py-2";

  if (!entity) {
    return (
      <li
        data-testid={`entity-row-${config.entity}`}
        className={`flex flex-1 items-center justify-between gap-3 ${paddingClass}`}
      >
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-300">{config.name}</span>
          <span className="text-xs uppercase tracking-wider text-slate-500">{config.entity}</span>
        </div>
        <span className="text-xs font-medium uppercase tracking-widest text-slate-500">Unavailable</span>
      </li>
    );
  }

  const friendlyName = config.name || (entity.attributes?.friendly_name as string | undefined) || entity.entity_id;
  const displayState = formatEntityState(entity);
  const action = getActionControl({
    domain,
    entity,
    pending,
    setPending,
    serviceCall,
  });

  return (
    <li
      data-testid={`entity-row-${config.entity}`}
      className={`flex items-start justify-between gap-3 ${paddingClass}`}
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-200">{friendlyName}</span>
        <span className="text-xs uppercase tracking-wider text-slate-500">{entity.entity_id}</span>
      </div>
      <div className="flex flex-col items-end gap-2 text-right">
        <span className="text-sm font-semibold text-slate-100">{displayState}</span>
        {action}
      </div>
    </li>
  );
}

function getActionControl({
  domain,
  entity,
  pending,
  setPending,
  serviceCall,
}: {
  domain: string;
  entity: HassEntity;
  pending: boolean;
  setPending: (next: boolean) => void;
  serviceCall: ReturnType<typeof useServiceCall>;
}) {
  if (domain === "switch") {
    const isOn = entity.state === "on";
    const nextState = isOn ? "off" : "on";
    const label = isOn ? "Turn Off" : "Turn On";

    async function toggle() {
      if (pending) {
        return;
      }
      setPending(true);
      try {
        await serviceCall(
          {
            domain,
            service: isOn ? "turn_off" : "turn_on",
            serviceData: { entity_id: entity.entity_id },
          },
          {
            optimisticEntities: {
              [entity.entity_id]: { ...entity, state: nextState },
            },
          },
        );
      } catch (error) {
        console.error("Failed to toggle entity", error);
      } finally {
        setPending(false);
      }
    }

    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`rounded-full border border-slate-700/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest transition ${
          isOn
            ? "bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30"
            : "bg-slate-800/60 text-slate-200 hover:bg-slate-700/70"
        } ${pending ? "opacity-60" : ""}`}
      >
        {pending ? "…" : label}
      </button>
    );
  }

  if (domain === "button") {
    async function press() {
      if (pending) {
        return;
      }
      setPending(true);
      try {
        await serviceCall({
          domain,
          service: "press",
          serviceData: { entity_id: entity.entity_id },
        });
      } catch (error) {
        console.error("Failed to press entity", error);
      } finally {
        setTimeout(() => setPending(false), 350);
      }
    }

    return (
      <button
        type="button"
        onClick={press}
        disabled={pending}
        className={`rounded-full border border-cyan-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-cyan-200 transition hover:bg-cyan-500/20 ${
          pending ? "opacity-60" : ""
        }`}
      >
        {pending ? "…" : "Press"}
      </button>
    );
  }

  return null;
}

function formatEntityState(entity: HassEntity) {
  const raw = entity.state;
  if (raw === "unknown" || raw === "unavailable") {
    return "—";
  }

  const unit = entity.attributes?.unit_of_measurement as string | undefined;

  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && raw.trim() !== "") {
    const formatted = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(numeric);
    return unit ? `${formatted} ${unit}` : formatted;
  }

  if (!Number.isNaN(Date.parse(raw))) {
    const date = new Date(raw);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (typeof raw === "string") {
    return raw
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  return String(raw);
}
