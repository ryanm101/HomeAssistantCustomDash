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

type VacuumService = "start" | "pause" | "stop" | "return_to_base" | "locate";

interface ControlConfig {
  label: string;
  service: VacuumService;
  ariaLabel: string;
  emphasis?: "primary" | "secondary";
}

const VACUUM_ENTITY_ID = "vacuum.robot_vacuum";
const BATTERY_SENSOR_ID = "sensor.robot_vacuum_battery";

const CONTROL_ACTIONS: ControlConfig[] = [
  { label: "Start", service: "start", ariaLabel: "Start cleaning", emphasis: "primary" },
  { label: "Pause", service: "pause", ariaLabel: "Pause cleaning", emphasis: "secondary" },
  { label: "Stop", service: "stop", ariaLabel: "Stop cleaning" },
  { label: "Dock", service: "return_to_base", ariaLabel: "Send vacuum to dock" },
  { label: "Locate", service: "locate", ariaLabel: "Locate vacuum" },
];

const STATUS_ENTITIES: EntityConfig[] = [
  { entity: "sensor.robot_vacuum_status", name: "Activity" },
  { entity: BATTERY_SENSOR_ID, name: "Battery" },
  { entity: "sensor.robot_vacuum_cleaning_mode", name: "Cleaning mode" },
  { entity: "sensor.robot_vacuum_current_room", name: "Current room" },
];

const MAINTENANCE_ENTITIES: EntityConfig[] = [
  { entity: "binary_sensor.robot_vacuum_error", name: "Error state" },
  { entity: "binary_sensor.robot_vacuum_bin_full", name: "Dust bin" },
  { entity: "sensor.robot_vacuum_brush_minutes", name: "Main brush" },
  { entity: "sensor.robot_vacuum_filter_minutes", name: "Filter" },
];

export default function VacuumPage() {
  const { credentials } = useHAConnection();
  const isConfigured = Boolean(credentials);

  if (!isConfigured) {
    return (
      <div className="grid gap-4">
        <Tile title="Vacuum" subtitle="Connect Home Assistant">
          <Placeholder message="Open Settings to add your Home Assistant URL and long-lived access token." />
        </Tile>
      </div>
    );
  }

  return (
    <div className="grid min-h-full gap-2 auto-rows-[minmax(140px,1fr)] sm:grid-cols-2 xl:grid-cols-3">
      <VacuumControlsCard entityId={VACUUM_ENTITY_ID} />
      <EntitiesCard
        className="min-h-[220px]"
        title="Vacuum"
        subtitle="Status"
        entities={STATUS_ENTITIES}
        density="compact"
      />
      <EntitiesCard
        className="min-h-[220px]"
        title="Vacuum"
        subtitle="Maintenance"
        entities={MAINTENANCE_ENTITIES}
        layout="grid"
        density="compact"
      />
    </div>
  );
}

function VacuumControlsCard({ entityId }: { entityId: string }) {
  const vacuum = useEntity(entityId);
  const batterySensor = useEntity(BATTERY_SENSOR_ID);
  const serviceCall = useServiceCall();
  const [pendingAction, setPendingAction] = useState<VacuumService | null>(null);
  const isUnavailable = !vacuum;
  const batteryFromAttributes =
    typeof vacuum?.attributes?.battery_level === "number" ? vacuum.attributes.battery_level : null;
  const batteryValue = batterySensor
    ? formatEntityState(batterySensor)
    : batteryFromAttributes !== null
    ? `${batteryFromAttributes}%`
    : "—";
  const mode =
    (vacuum?.attributes?.cleaning_mode as string | undefined) ??
    (vacuum?.attributes?.fan_speed as string | undefined) ??
    null;
  const currentRoom = vacuum?.attributes?.current_room as string | undefined;
  const state = vacuum?.state ?? null;
  const isCleaning = state === "cleaning";
  const isPaused = state === "paused";
  const isIdle = state === "idle" || state === "docked" || state === "returning";

  function deriveControlMeta(control: ControlConfig) {
    let label = control.label;
    let aria = control.ariaLabel;
    let disabled = pendingAction !== null || isUnavailable;

    if (control.service === "start") {
      if (isPaused) {
        label = "Resume";
        aria = "Resume cleaning";
      } else if (state && !isIdle) {
        disabled = true;
      }
    } else if (control.service === "pause") {
      disabled = disabled || !isCleaning;
    } else if (control.service === "stop") {
      disabled = disabled || !(isCleaning || isPaused);
    }

    return { label, aria, disabled };
  }

  async function handleControl(control: ControlConfig) {
    if (pendingAction || isUnavailable) {
      return;
    }

    setPendingAction(control.service);
    try {
      await serviceCall({
        domain: "vacuum",
        service: control.service,
        serviceData: { entity_id: entityId },
      });
    } catch (error) {
      console.error(`Failed to ${control.service} vacuum`, error);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="sm:col-span-2 xl:col-span-1 min-h-[220px]">
      <Tile title="Vacuum" subtitle="Controls">
        <div className="flex h-full flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 sm:grid-cols-2">
            <StatusBlock label="State" value={vacuum ? formatEntityState(vacuum) : "Unavailable"} />
            <StatusBlock label="Battery" value={batteryValue} />
            <StatusBlock label="Mode" value={mode ? humanize(mode) : "—"} />
            <StatusBlock label="Room" value={currentRoom ? humanize(currentRoom) : "—"} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CONTROL_ACTIONS.map((control) => {
              const meta = deriveControlMeta(control);
              return (
                <button
                  key={control.service}
                  type="button"
                  onClick={() => void handleControl(control)}
                  disabled={meta.disabled}
                  className={`flex h-12 items-center justify-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    control.emphasis === "primary"
                      ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/35"
                      : control.emphasis === "secondary"
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-100 hover:bg-amber-500/30"
                      : "border-slate-700/60 bg-slate-800/60 text-slate-200 hover:bg-slate-700/70"
                  } ${meta.disabled ? "opacity-60" : ""}`}
                  aria-label={meta.aria}
                >
                  {pendingAction === control.service ? "…" : meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </Tile>
    </div>
  );
}

function StatusBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-3">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
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
    config,
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
  config,
}: {
  domain: string;
  entity: HassEntity;
  pending: boolean;
  setPending: (next: boolean) => void;
  serviceCall: ReturnType<typeof useServiceCall>;
  config: EntityConfig;
}) {
  if (domain === "vacuum") {
    const state = entity.state;
    const isIdle = state === "idle" || state === "docked";
    const isCleaning = state === "cleaning";
    const isPaused = state === "paused";

    async function handleVacuumAction(service: VacuumService) {
      if (pending) {
        return;
      }
      setPending(true);
      try {
        await serviceCall({
          domain: "vacuum",
          service,
          serviceData: { entity_id: entity.entity_id },
        });
      } catch (error) {
        console.error(`Failed to call vacuum.${service}`, error);
      } finally {
        setTimeout(() => setPending(false), 350);
      }
    }

    if (isIdle) {
      return (
        <button
          type="button"
          onClick={() => void handleVacuumAction("start")}
          disabled={pending}
          className={`rounded-full border border-cyan-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-cyan-200 transition hover:bg-cyan-500/20 ${
            pending ? "opacity-60" : ""
          }`}
          aria-label="Start vacuum cleaning"
        >
          {pending ? "…" : "Start"}
        </button>
      );
    }

    if (isCleaning) {
      return (
        <button
          type="button"
          onClick={() => void handleVacuumAction("pause")}
          disabled={pending}
          className={`rounded-full border border-amber-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-200 transition hover:bg-amber-500/20 ${
            pending ? "opacity-60" : ""
          }`}
          aria-label="Pause vacuum cleaning"
        >
          {pending ? "…" : "Pause"}
        </button>
      );
    }

    if (isPaused) {
      return (
        <button
          type="button"
          onClick={() => void handleVacuumAction("start")}
          disabled={pending}
          className={`rounded-full border border-cyan-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-cyan-200 transition hover:bg-cyan-500/20 ${
            pending ? "opacity-60" : ""
          }`}
          aria-label="Resume vacuum cleaning"
        >
          {pending ? "…" : "Resume"}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => void handleVacuumAction("return_to_base")}
        disabled={pending}
        className={`rounded-full border border-slate-700/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-200 transition hover:bg-slate-700/70 ${
          pending ? "opacity-60" : ""
        }`}
        aria-label="Send vacuum to dock"
      >
        {pending ? "…" : "Dock"}
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
        aria-label={`Press ${config.name} button`}
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

function humanize(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
