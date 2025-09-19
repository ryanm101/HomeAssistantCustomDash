import { useEntity } from "../hooks/useEntity";
import { Placeholder, Tile } from "./Tile";

interface SensorTileProps {
  entityId: string;
  label?: string;
  precision?: number;
}

export function SensorTile({ entityId, label, precision = 1 }: SensorTileProps) {
  const entity = useEntity(entityId);

  if (!entity) {
    return <Tile title={label ?? "Sensor"} subtitle={entityId}><Placeholder message="Sensor unavailable" /></Tile>;
  }

  const value = Number(entity.state);
  const unit = entity.attributes?.unit_of_measurement ?? "";
  const formatted = Number.isFinite(value) ? value.toFixed(precision) : entity.state;

  return (
    <Tile title={label ?? (entity.attributes?.friendly_name ?? "Sensor")} subtitle={entity.entity_id}>
      <div className="flex h-full flex-col justify-center">
        <span className="text-5xl font-semibold tracking-tight">{formatted}</span>
        <span className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-400">{unit}</span>
      </div>
    </Tile>
  );
}
