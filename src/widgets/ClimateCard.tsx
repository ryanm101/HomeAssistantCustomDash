import { useState } from "react";
import { useEntity } from "../hooks/useEntity";
import { useServiceCall } from "../hooks/useServiceCall";
import { Placeholder, Tile } from "./Tile";

interface ClimateCardProps {
  entityId: string;
  step?: number;
}

export function ClimateCard({ entityId, step = 0.5 }: ClimateCardProps) {
  const entity = useEntity(entityId);
  const serviceCall = useServiceCall();
  const [pending, setPending] = useState(false);

  if (!entity) {
    return <Tile title="Climate" subtitle={entityId}><Placeholder message="Climate entity unavailable" /></Tile>;
  }

  const temperature = Number(entity.attributes?.current_temperature ?? entity.attributes?.temperature ?? 0);
  const target = Number(entity.attributes?.temperature ?? entity.attributes?.target_temp_high ?? temperature);
  const unit = entity.attributes?.unit_of_measurement ?? "°C";
  const hvacAction = formatState(entity.attributes?.hvac_action ?? entity.state);

  async function adjust(delta: number) {
    if (pending) {
      return;
    }
    const nextTarget = Math.round((target + delta) / step) * step;
    setPending(true);
    try {
      await serviceCall(
        {
          domain: "climate",
          service: "set_temperature",
          serviceData: { entity_id: entity.entity_id, temperature: nextTarget },
        },
        {
          optimisticEntities: {
            [entity.entity_id]: {
              ...entity,
              attributes: { ...entity.attributes, temperature: nextTarget },
            },
          },
        },
      );
    } catch (error) {
      console.error("Failed to adjust climate", error);
    } finally {
      setPending(false);
    }
  }

  return (
    <Tile
      title={entity.attributes?.friendly_name ?? "Climate"}
      subtitle={`${hvacAction} • ${entity.entity_id}`}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => adjust(-step)}
            className="rounded-full bg-slate-800/70 px-3 py-2 text-lg"
            disabled={pending}
            aria-label="Decrease temperature"
          >
            -
          </button>
          <button
            onClick={() => adjust(step)}
            className="rounded-full bg-slate-800/70 px-3 py-2 text-lg"
            disabled={pending}
            aria-label="Increase temperature"
          >
            +
          </button>
        </div>
      }
    >
      <div className="flex h-full flex-col justify-end gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Current</p>
          <p className="text-4xl font-semibold">{temperature.toFixed(1)}{unit}</p>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Target</p>
          <p className="text-3xl font-medium">{target.toFixed(1)}{unit}</p>
        </div>
      </div>
    </Tile>
  );
}

function formatState(value: unknown) {
  if (!value || typeof value !== "string") {
    return "Unknown";
  }
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
